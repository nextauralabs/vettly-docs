/**
 * Core moderation hook for real-time content checking
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { ModerationClient } from '@vettly/sdk';
import type { CheckRequest, CheckResponse } from '@vettly/shared';

export interface ModerationResult {
  safe: boolean;
  flagged: boolean;
  action: 'allow' | 'warn' | 'flag' | 'block';
  categories: Array<{
    category: string;
    score: number;
    threshold: number;
    violated: boolean;
  }>;
  isChecking: boolean;
  error: string | null;
}

export interface UseModerationOptions {
  apiKey: string;
  policyId: string;
  debounceMs?: number;
  enabled?: boolean;
  onCheck?: (result: CheckResponse) => void;
  onError?: (error: Error) => void;
}

export function useModeration(options: UseModerationOptions) {
  const {
    apiKey,
    policyId,
    debounceMs = 500,
    enabled = true,
    onCheck,
    onError,
  } = options;

  const [result, setResult] = useState<ModerationResult>({
    safe: true,
    flagged: false,
    action: 'allow',
    categories: [],
    isChecking: false,
    error: null,
  });

  const clientRef = useRef<InstanceType<typeof ModerationClient> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize client
  useEffect(() => {
    if (!apiKey) return;
    clientRef.current = new ModerationClient({ apiKey });
  }, [apiKey]);

  const check = useCallback(
    async (content: string | CheckRequest) => {
      if (!enabled || !clientRef.current) return;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Empty content is always safe
      if (typeof content === 'string' && !content.trim()) {
        setResult({
          safe: true,
          flagged: false,
          action: 'allow',
          categories: [],
          isChecking: false,
          error: null,
        });
        return;
      }

      setResult((prev) => ({ ...prev, isChecking: true, error: null }));

      // Debounce the check
      timeoutRef.current = setTimeout(async () => {
        try {
          abortControllerRef.current = new AbortController();

          const checkRequest: CheckRequest =
            typeof content === 'string'
              ? { content, policyId, contentType: 'text' }
              : { ...content, policyId };

          const response = await clientRef.current!.check(checkRequest);

          setResult({
            safe: response.safe,
            flagged: response.flagged,
            action: response.action,
            categories: response.categories || [],
            isChecking: false,
            error: null,
          });

          if (onCheck) {
            onCheck(response);
          }
        } catch (err) {
          const error = err as Error;
          if (error.name === 'AbortError') return;

          setResult((prev) => ({
            ...prev,
            isChecking: false,
            error: error.message || 'Failed to check content',
          }));

          if (onError) {
            onError(error);
          }
        }
      }, debounceMs);
    },
    [enabled, policyId, debounceMs, onCheck, onError]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    result,
    check,
  };
}
