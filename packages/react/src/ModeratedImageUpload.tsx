/**
 * ModeratedImageUpload - Image upload with automatic moderation
 */
import React, { useState, useRef, useCallback } from 'react';
import { useModeration } from './useModeration';
import type { UseModerationOptions } from './useModeration';

export interface ModeratedImageUploadProps {
  apiKey: string;
  policyId: string;
  onUpload?: (file: File, result: { safe: boolean; flagged: boolean; action: string }) => void;
  onReject?: (file: File, reason: string) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
  blockUnsafe?: boolean;
  customPreview?: (props: {
    file: File;
    preview: string;
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

export function ModeratedImageUpload({
  apiKey,
  policyId,
  onUpload,
  onReject,
  maxSizeMB = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  showPreview = true,
  blockUnsafe = true,
  customPreview,
  className = '',
  disabled = false,
  onModerationResult,
  onModerationError,
}: ModeratedImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { result, check } = useModeration({
    apiKey,
    policyId,
    debounceMs: 0, // No debounce for images
    enabled: !disabled,
    onCheck: onModerationResult,
    onError: onModerationError,
  });

  const validateFile = useCallback(
    (selectedFile: File): string | null => {
      // Check file type
      if (!acceptedFormats.includes(selectedFile.type)) {
        return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`;
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

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
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      setFile(selectedFile);

      // Check image content
      check({
        content: previewUrl, // Send base64 for moderation
        contentType: 'image',
        policyId,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setUploadError(null);
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

  return (
    <div className={`moderated-image-upload ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      {!file ? (
        <div className="upload-area" onClick={triggerFileInput}>
          <div className="upload-icon">📷</div>
          <p className="upload-text">Click to upload an image</p>
          <p className="upload-hint">
            {acceptedFormats.map((f) => f.split('/')[1]).join(', ')} up to {maxSizeMB}MB
          </p>
          {uploadError && (
            <div className="upload-error">
              <span>⚠️</span>
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {customPreview ? (
            customPreview({
              file,
              preview: preview!,
              result,
              onRemove: handleRemove,
            })
          ) : (
            <DefaultPreview
              file={file}
              preview={preview!}
              result={result}
              onRemove={handleRemove}
              onConfirm={handleConfirm}
              blockUnsafe={blockUnsafe}
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
  result,
  onRemove,
  onConfirm,
  blockUnsafe,
}: {
  file: File;
  preview: string;
  result: {
    safe: boolean;
    flagged: boolean;
    action: string;
    isChecking: boolean;
    error: string | null;
  };
  onRemove: () => void;
  onConfirm: () => void;
  blockUnsafe: boolean;
}) {
  const canConfirm = !result.isChecking && (result.safe || !blockUnsafe);

  return (
    <div className="image-preview">
      <div className="preview-container">
        <img src={preview} alt={file.name} className="preview-image" />
        {result.isChecking && (
          <div className="preview-overlay">
            <div className="spinner" />
            <span>Checking image...</span>
          </div>
        )}
      </div>

      <div className="preview-info">
        <p className="file-name">{file.name}</p>
        <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
      </div>

      {result.error && (
        <div className="moderation-error">
          <span>⚠️</span>
          <span>{result.error}</span>
        </div>
      )}

      {!result.isChecking && !result.error && (
        <div className={`moderation-status status-${result.action}`}>
          {result.action === 'block' && (
            <>
              <span>🚫</span>
              <span>This image violates community guidelines</span>
            </>
          )}
          {result.action === 'flag' && (
            <>
              <span>⚠️</span>
              <span>This image has been flagged for review</span>
            </>
          )}
          {result.action === 'warn' && (
            <>
              <span>⚡</span>
              <span>This image may not be appropriate</span>
            </>
          )}
          {result.safe && (
            <>
              <span>✅</span>
              <span>Image looks good</span>
            </>
          )}
        </div>
      )}

      <div className="preview-actions">
        <button type="button" onClick={onRemove} className="btn-remove">
          Remove
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className="btn-confirm"
        >
          {blockUnsafe && !result.safe ? 'Cannot Upload' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
