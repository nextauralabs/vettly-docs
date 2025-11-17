/**
 * Shared utility functions
 */
import crypto from 'crypto';

/**
 * Generate a SHA256 hash of content
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a request ID for idempotency
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Calculate policy version hash from YAML content
 */
export function calculatePolicyVersion(yaml: string): string {
  return hashContent(yaml).substring(0, 16);
}

/**
 * Format cost in USD
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`;
}

/**
 * Format latency in ms
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}
