/**
 * ModeratedVideoUpload - Professional video upload with drag-and-drop, thumbnails, and real-time moderation
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useModeration } from './useModeration';
import type { UseModerationOptions } from './useModeration';

export interface ModeratedVideoUploadProps {
  apiKey: string;
  policyId: string;
  onUpload?: (file: File, result: { safe: boolean; flagged: boolean; action: string }) => void;
  onReject?: (file: File, reason: string) => void;
  maxSizeMB?: number;
  maxDurationSeconds?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
  blockUnsafe?: boolean;
  extractFramesCount?: number;
  customPreview?: (props: {
    file: File;
    preview: string;
    duration: number;
    result: {
      safe: boolean;
      flagged: boolean;
      action: string;
      isChecking: boolean;
      error: string | null;
    };
    onRemove: () => void;
  }) => React.ReactNode;
  className?: string;
  disabled?: boolean;
  onModerationResult?: UseModerationOptions['onCheck'];
  onModerationError?: UseModerationOptions['onError'];
}

export function ModeratedVideoUpload({
  apiKey,
  policyId,
  onUpload,
  onReject,
  maxSizeMB = 100,
  maxDurationSeconds = 300,
  acceptedFormats = ['video/mp4', 'video/webm', 'video/quicktime'],
  showPreview = true,
  blockUnsafe = true,
  extractFramesCount = 3,
  customPreview,
  className = '',
  disabled = false,
  onModerationResult,
  onModerationError,
}: ModeratedVideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [frameExtractionProgress, setFrameExtractionProgress] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { result, check } = useModeration({
    apiKey,
    policyId,
    debounceMs: 0,
    enabled: !disabled,
    onCheck: onModerationResult,
    onError: onModerationError,
  });

  const validateFile = useCallback(
    (selectedFile: File): string | null => {
      // Check file type
      if (!acceptedFormats.includes(selectedFile.type)) {
        return `Invalid file type. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]?.toUpperCase() || '').join(', ')}`;
      }

      // Check file size
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        return `File size exceeds ${maxSizeMB}MB limit`;
      }

      return null;
    },
    [acceptedFormats, maxSizeMB]
  );

  const generateThumbnail = useCallback(async (video: HTMLVideoElement): Promise<string> => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Seek to 10% of video duration for a good thumbnail
    const seekTime = Math.min(1, video.duration * 0.1);
    
    return new Promise((resolve, reject) => {
      video.currentTime = seekTime;
      video.onseeked = () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailUrl);
        } catch (error) {
          reject(error);
        }
      };
      video.onerror = () => reject(new Error('Failed to generate thumbnail'));
    });
  }, []);

  const extractFrames = async (video: HTMLVideoElement): Promise<string[]> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const frames: string[] = [];
    const interval = video.duration / extractFramesCount;

    setProcessingStage('Extracting frames for analysis...');

    for (let i = 0; i < extractFramesCount; i++) {
      const time = i * interval;
      await new Promise<void>((resolve) => {
        video.currentTime = time;
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          const progress = ((i + 1) / extractFramesCount) * 100;
          setFrameExtractionProgress(progress);
          setProcessingStage(`Extracting frames... ${Math.round(progress)}%`);
          resolve();
        };
      });
    }

    setProcessingStage('Analyzing video content...');
    return frames;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setUploadError(null);
    setFrameExtractionProgress(0);
    setProcessingStage('');

    // Validate file
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setUploadError(validationError);
      if (onReject) {
        onReject(selectedFile, validationError);
      }
      return;
    }

    // Create preview
    const videoUrl = URL.createObjectURL(selectedFile);
    setPreview(videoUrl);
    setFile(selectedFile);

    // Load video metadata
    const video = document.createElement('video');
    video.src = videoUrl;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = async () => {
      const videoDuration = video.duration;
      setDuration(videoDuration);

      // Check duration
      if (videoDuration > maxDurationSeconds) {
        const error = `Video duration (${Math.round(videoDuration)}s) exceeds ${maxDurationSeconds}s limit`;
        setUploadError(error);
        if (onReject) {
          onReject(selectedFile, error);
        }
        return;
      }

      try {
        setProcessingStage('Generating thumbnail...');
        
        // Generate thumbnail
        const thumbnailUrl = await generateThumbnail(video);
        setThumbnail(thumbnailUrl);

        // Extract frames for moderation
        const frames = await extractFrames(video);

        // For demo: Send to video API endpoint
        if (frames.length > 0) {
          // This would actually call POST /v1/video/moderate in production
          // For demo purposes, we'll check the first frame
          check({
            content: frames[0] || '',
            contentType: 'video',
            policyId,
            metadata: {
              totalFrames: frames.length,
              videoDuration: videoDuration,
              filename: selectedFile.name,
              fileSize: selectedFile.size,
              demoMode: true,
            },
          });
        }
        
        setProcessingStage('Moderation complete');
      } catch (error) {
        const err = error as Error;
        setUploadError(err.message);
        setProcessingStage('');
        if (onReject) {
          onReject(selectedFile, err.message);
        }
      }
    };

    video.onerror = () => {
      const error = 'Failed to load video metadata';
      setUploadError(error);
      setProcessingStage('');
      if (onReject) {
        onReject(selectedFile, error);
      }
    };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setThumbnail(null);
    setDuration(0);
    setUploadError(null);
    setFrameExtractionProgress(0);
    setProcessingStage('');
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (!file) return;

    if (blockUnsafe && !result.safe) {
      if (onReject) {
        onReject(file, 'Content violates community guidelines');
      }
      return;
    }

    if (onUpload) {
      onUpload(file, {
        safe: result.safe,
        flagged: result.flagged,
        action: result.action,
      });
    }

    // Reset
    handleRemove();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className={`moderated-video-upload ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!file ? (
        <div 
          className={`upload-area ${
            isDragOver ? 'drag-over' : ''
          } ${disabled ? 'disabled' : ''}`}
          onClick={!disabled ? triggerFileInput : undefined}
          onDragOver={!disabled ? handleDragOver : undefined}
          onDragLeave={!disabled ? handleDragLeave : undefined}
          onDrop={!disabled ? handleDrop : undefined}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyPress={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              triggerFileInput();
            }
          }}
        >
          <div className="upload-content">
            <div className="upload-icon">🎥</div>
            <h3 className="upload-title">
              {isDragOver ? 'Drop your video here' : 'Upload Video for Moderation'}
            </h3>
            <p className="upload-text">
              {isDragOver ? 'Release to upload' : 'Click to browse or drag & drop your video here'}
            </p>
            <div className="upload-specs">
              <span className="spec-item">
                📄 {acceptedFormats.map(f => f.split('/')[1]?.toUpperCase() || '').join(', ')}
              </span>
              <span className="spec-item">📦 Max {maxSizeMB} MB</span>
              <span className="spec-item">⏱️ Max {formatDuration(maxDurationSeconds)}</span>
            </div>
            {uploadError && (
              <div className="upload-error">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{uploadError}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {customPreview ? (
            customPreview({
              file,
              preview: preview!,
              duration,
              result,
              onRemove: handleRemove,
            })
          ) : (
            <DefaultPreview
              file={file}
              preview={preview!}
              thumbnail={thumbnail}
              duration={duration}
              result={result}
              frameExtractionProgress={frameExtractionProgress}
              processingStage={processingStage}
              onRemove={handleRemove}
              onConfirm={handleConfirm}
              blockUnsafe={blockUnsafe}
              formatDuration={formatDuration}
              formatFileSize={formatFileSize}
            />
          )}
        </>
      )}
    </div>
  );
}

function DefaultPreview({
  file,
  preview,
  thumbnail,
  duration,
  result,
  frameExtractionProgress,
  processingStage,
  onRemove,
  onConfirm,
  blockUnsafe,
  formatDuration,
  formatFileSize,
}: {
  file: File;
  preview: string;
  thumbnail: string | null;
  duration: number;
  result: {
    safe: boolean;
    flagged: boolean;
    action: string;
    isChecking: boolean;
    error: string | null;
  };
  frameExtractionProgress: number;
  processingStage: string;
  onRemove: () => void;
  onConfirm: () => void;
  blockUnsafe: boolean;
  formatDuration: (seconds: number) => string;
  formatFileSize: (bytes: number) => string;
}) {
  const [showVideo, setShowVideo] = useState(false);
  const isProcessing = result.isChecking || frameExtractionProgress < 100 || processingStage;
  const canConfirm = !isProcessing && (result.safe || !blockUnsafe);

  return (
    <div className="video-preview">
      <div className="preview-container">
        {showVideo ? (
          <video 
            src={preview} 
            controls 
            className="preview-video"
            onError={() => setShowVideo(false)}
          />
        ) : (
          <div className="thumbnail-container" onClick={() => setShowVideo(true)}>
            {thumbnail ? (
              <img src={thumbnail} alt="Video thumbnail" className="video-thumbnail" />
            ) : (
              <div className="thumbnail-placeholder">
                <span className="video-icon">🎥</span>
              </div>
            )}
            <div className="play-overlay">
              <div className="play-button">▶</div>
            </div>
            <div className="duration-badge">
              {formatDuration(duration)}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="processing-overlay">
            <div className="processing-content">
              <div className="processing-spinner" />
              <span className="processing-text">
                {processingStage || (
                  frameExtractionProgress < 100
                    ? `Extracting frames... ${frameExtractionProgress.toFixed(0)}%`
                    : 'Analyzing video content...'
                )}
              </span>
              {frameExtractionProgress > 0 && frameExtractionProgress < 100 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${frameExtractionProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="preview-info">
        <div className="file-details">
          <h4 className="file-name">{file.name}</h4>
          <div className="file-metadata">
            <span className="metadata-item">📦 {formatFileSize(file.size)}</span>
            <span className="metadata-item">⏱️ {formatDuration(duration)}</span>
            <span className="metadata-item">🎬 Video File</span>
          </div>
        </div>
      </div>

      {result.error && (
        <div className="moderation-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{result.error}</span>
        </div>
      )}

      {!isProcessing && !result.error && (
        <div className={`moderation-status status-${result.action}`}>
          {result.action === 'block' && (
            <>
              <span className="status-icon">🚫</span>
              <div className="status-content">
                <span className="status-text">Video blocked</span>
                <span className="status-detail">Contains content that violates community guidelines</span>
              </div>
            </>
          )}
          {result.action === 'flag' && (
            <>
              <span className="status-icon">⚠️</span>
              <div className="status-content">
                <span className="status-text">Video flagged for review</span>
                <span className="status-detail">Contains potentially inappropriate content</span>
              </div>
            </>
          )}
          {result.action === 'warn' && (
            <>
              <span className="status-icon">⚡</span>
              <div className="status-content">
                <span className="status-text">Video may need attention</span>
                <span className="status-detail">Some content may not be appropriate</span>
              </div>
            </>
          )}
          {result.safe && (
            <>
              <span className="status-icon">✅</span>
              <div className="status-content">
                <span className="status-text">Video approved</span>
                <span className="status-detail">No policy violations detected</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="preview-actions">
        <button type="button" onClick={onRemove} className="btn-remove">
          Remove Video
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className="btn-confirm"
        >
          {isProcessing
            ? 'Processing...'
            : blockUnsafe && !result.safe
            ? 'Cannot Upload'
            : 'Upload Video'}
        </button>
      </div>
    </div>
  );
}
