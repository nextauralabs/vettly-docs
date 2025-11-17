/**
 * ModeratedTextarea - A textarea with real-time content moderation
 */
import React, { forwardRef, useEffect, useState } from 'react';
import { useModeration } from './useModeration';
import type { UseModerationOptions } from './useModeration';

export interface ModeratedTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  apiKey: string;
  policyId: string;
  value?: string;
  onChange?: (value: string, result: { safe: boolean; flagged: boolean; action: string }) => void;
  debounceMs?: number;
  showFeedback?: boolean;
  blockUnsafe?: boolean;
  customFeedback?: (result: {
    safe: boolean;
    flagged: boolean;
    action: string;
    isChecking: boolean;
    error: string | null;
  }) => React.ReactNode;
  onModerationResult?: UseModerationOptions['onCheck'];
  onModerationError?: UseModerationOptions['onError'];
}

export const ModeratedTextarea = forwardRef<HTMLTextAreaElement, ModeratedTextareaProps>(
  (
    {
      apiKey,
      policyId,
      value = '',
      onChange,
      debounceMs = 500,
      showFeedback = true,
      blockUnsafe = false,
      customFeedback,
      onModerationResult,
      onModerationError,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(value);

    const { result, check } = useModeration({
      apiKey,
      policyId,
      debounceMs,
      enabled: !disabled,
      onCheck: onModerationResult,
      onError: onModerationError,
    });

    // Sync external value changes
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Check content when it changes
    useEffect(() => {
      if (internalValue) {
        check(internalValue);
      }
    }, [internalValue, check]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      // If blockUnsafe is true and content is unsafe, prevent change
      if (blockUnsafe && !result.safe && newValue.length > internalValue.length) {
        return;
      }

      setInternalValue(newValue);

      if (onChange) {
        onChange(newValue, {
          safe: result.safe,
          flagged: result.flagged,
          action: result.action,
        });
      }
    };

    // Determine border color based on result
    const getBorderColor = () => {
      if (result.isChecking) return 'border-blue-300';
      if (result.error) return 'border-red-400';
      if (result.action === 'block') return 'border-red-400';
      if (result.action === 'flag') return 'border-yellow-400';
      if (result.action === 'warn') return 'border-orange-400';
      return 'border-green-400';
    };

    return (
      <div className="moderated-textarea-wrapper">
        <textarea
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          className={`moderated-textarea ${getBorderColor()} ${className}`}
          {...props}
        />

        {showFeedback && (
          <div className="moderation-feedback">
            {customFeedback ? (
              customFeedback(result)
            ) : (
              <DefaultFeedback result={result} />
            )}
          </div>
        )}
      </div>
    );
  }
);

ModeratedTextarea.displayName = 'ModeratedTextarea';

function DefaultFeedback({
  result,
}: {
  result: {
    safe: boolean;
    flagged: boolean;
    action: string;
    isChecking: boolean;
    error: string | null;
  };
}) {
  if (result.isChecking) {
    return (
      <div className="feedback-checking">
        <span className="spinner" />
        <span>Checking content...</span>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="feedback-error">
        <span>⚠️</span>
        <span>{result.error}</span>
      </div>
    );
  }

  if (result.action === 'block') {
    return (
      <div className="feedback-block">
        <span>🚫</span>
        <span>This content violates community guidelines</span>
      </div>
    );
  }

  if (result.action === 'flag') {
    return (
      <div className="feedback-flag">
        <span>⚠️</span>
        <span>This content has been flagged for review</span>
      </div>
    );
  }

  if (result.action === 'warn') {
    return (
      <div className="feedback-warn">
        <span>⚡</span>
        <span>Please be mindful of community guidelines</span>
      </div>
    );
  }

  if (result.safe) {
    return (
      <div className="feedback-safe">
        <span>✅</span>
        <span>Content looks good</span>
      </div>
    );
  }

  return null;
}
