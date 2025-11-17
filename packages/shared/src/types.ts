/**
 * Shared types and Zod schemas for unified moderation API
 */
import { z } from 'zod';

// ============================================================================
// Content Types
// ============================================================================

export const ContentTypeSchema = z.enum(['text', 'image', 'video']);
export type ContentType = z.infer<typeof ContentTypeSchema>;

// Use case types for context-aware moderation
export const UseCaseTypeSchema = z.enum([
  'social_post',
  'comment',
  'profile',
  'message',
  'review',
  'listing',
  'bio',
  'other',
]);
export type UseCaseType = z.infer<typeof UseCaseTypeSchema>;

// ============================================================================
// Moderation Categories
// ============================================================================

export const CategorySchema = z.enum([
  'hate_speech',
  'harassment',
  'violence',
  'self_harm',
  'sexual',
  'spam',
  'profanity',
  'scam',
  'illegal',
]);
export type Category = z.infer<typeof CategorySchema>;

// ============================================================================
// Provider Types
// ============================================================================

export const ProviderNameSchema = z.enum([
  'openai',
  'perspective',
  'hive',
  'azure',
  'bot_detection',
  'mock',
  'fallback',
]);
export type ProviderName = z.infer<typeof ProviderNameSchema>;

export interface ProviderResult {
  provider: ProviderName;
  flagged: boolean;
  categories: Partial<Record<Category, number>>; // Category scores 0-1
  confidence?: number; // Overall confidence score (0-1), optional
  latency: number; // ms
  cost: number; // USD
  raw?: unknown; // Original provider response
}

// ============================================================================
// Policy Types
// ============================================================================

export const ActionSchema = z.enum(['block', 'warn', 'flag', 'allow']);
export type Action = z.infer<typeof ActionSchema>;

export const RuleSchema = z.object({
  category: CategorySchema,
  threshold: z.number().min(0).max(1),
  provider: ProviderNameSchema,
  action: ActionSchema,
  priority: z.number().optional().default(0),
});
export type Rule = z.infer<typeof RuleSchema>;

export const OverrideSchema = z.object({
  locale: z.string().optional(),
  region: z.string().optional(),
  data_residency: z.string().optional(),
  provider: ProviderNameSchema.optional(),
});
export type Override = z.infer<typeof OverrideSchema>;

export const FallbackConfigSchema = z.object({
  provider: ProviderNameSchema,
  on_timeout: z.boolean().optional().default(true),
  timeout_ms: z.number().optional().default(5000),
});
export type FallbackConfig = z.infer<typeof FallbackConfigSchema>;

export const PolicySchema = z.object({
  name: z.string(),
  version: z.string(),
  rules: z.array(RuleSchema),
  overrides: z.array(OverrideSchema).optional(),
  fallback: FallbackConfigSchema.optional(),
});
export type Policy = z.infer<typeof PolicySchema>;

// ============================================================================
// Decision Types
// ============================================================================

export const DecisionSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  contentHash: z.string(),
  contentType: ContentTypeSchema,
  policy: z.object({
    id: z.string(),
    version: z.string(),
  }),
  result: z.object({
    safe: z.boolean(),
    flagged: z.boolean(),
    action: ActionSchema,
    categories: z.array(
      z.object({
        category: CategorySchema,
        score: z.number(),
        threshold: z.number(),
        triggered: z.boolean(),
      })
    ),
  }),
  provider: z.object({
    name: ProviderNameSchema,
    latency: z.number(),
    cost: z.number(),
  }),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().optional(),
});
export type Decision = z.infer<typeof DecisionSchema>;

// ============================================================================
// API Request/Response Types
// ============================================================================

// Multi-modal content request schema
export const MultiModalCheckRequestSchema = z
  .object({
    // Multi-modal content inputs
    text: z.string().max(100000, 'Text exceeds maximum size of 100KB').optional(),
    images: z
      .array(
        z.string().refine(
          (val) => {
            // Accept URLs or base64 data URIs
            return val.startsWith('http://') ||
                   val.startsWith('https://') ||
                   val.startsWith('data:image/');
          },
          { message: 'Images must be URLs or base64 data URIs' }
        )
      )
      .max(10, 'Maximum 10 images per request')
      .optional(),
    video: z
      .string()
      .url('Video must be a valid URL')
      .optional(),

    // Moderation context
    context: z.object({
      useCase: UseCaseTypeSchema.default('other'),
      userId: z.string().optional(),
      userReputation: z.number().min(0).max(1).optional(), // 0-1 score
      locale: z.string().optional(),
      region: z.string().optional(),
    }).optional(),

    // Policy and metadata
    policyId: z.string(),
    metadata: z.record(z.unknown()).optional(),
    requestId: z.string().optional(), // For idempotency
  })
  .refine(
    (data) => {
      // At least one content type must be provided
      return data.text || data.images?.length || data.video;
    },
    { message: 'At least one of text, images, or video must be provided' }
  );
export type MultiModalCheckRequest = z.infer<typeof MultiModalCheckRequestSchema>;

// Legacy single-content request schema (backward compatibility)
export const CheckRequestSchema = z.object({
  content: z.string().min(1).max(100000, 'Content exceeds maximum size of 100KB'),
  policyId: z.string(),
  contentType: ContentTypeSchema.optional().default('text'),
  metadata: z.record(z.unknown()).optional(),
  requestId: z.string().optional(), // For idempotency
});
export type CheckRequest = z.infer<typeof CheckRequestSchema>;

// Individual content item result
export const ContentItemResultSchema = z.object({
  contentType: ContentTypeSchema,
  contentRef: z.string().optional(), // URL or identifier for images/video
  contentItemId: z.string().uuid().optional(), // Database ID for linking evidence
  safe: z.boolean(),
  flagged: z.boolean(),
  action: ActionSchema,
  categories: z.array(
    z.object({
      category: CategorySchema,
      score: z.number(),
      triggered: z.boolean(),
    })
  ),
  provider: ProviderNameSchema,
  latency: z.number(),
  cost: z.number(),
  evidence: z
    .object({
      url: z.string().url().optional(), // Signed URL to evidence (screenshot, frame)
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
});
export type ContentItemResult = z.infer<typeof ContentItemResultSchema>;

// Multi-modal response
export const MultiModalCheckResponseSchema = z.object({
  decisionId: z.string().uuid(),
  safe: z.boolean(), // Overall safe if ALL content items are safe
  flagged: z.boolean(), // Overall flagged if ANY content item is flagged
  action: ActionSchema, // Most severe action across all content
  results: z.array(ContentItemResultSchema), // Per-content-type results
  totalLatency: z.number(),
  totalCost: z.number(),
  requestId: z.string().optional(),
});
export type MultiModalCheckResponse = z.infer<typeof MultiModalCheckResponseSchema>;

// Legacy single-content response (backward compatibility)
export const CheckResponseSchema = z.object({
  decisionId: z.string().uuid(),
  safe: z.boolean(),
  flagged: z.boolean(),
  action: ActionSchema,
  categories: z.array(
    z.object({
      category: CategorySchema,
      score: z.number(),
      triggered: z.boolean(),
    })
  ),
  provider: ProviderNameSchema,
  latency: z.number(),
  cost: z.number(),
  requestId: z.string().optional(),
});
export type CheckResponse = z.infer<typeof CheckResponseSchema>;

// ============================================================================
// Replay Types
// ============================================================================

export const ReplayRequestSchema = z.object({
  decisionId: z.string().uuid(),
  policyId: z.string(),
});
export type ReplayRequest = z.infer<typeof ReplayRequestSchema>;

// ============================================================================
// Error Types
// ============================================================================

export class ModerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ModerationError';
  }
}

export class PolicyValidationError extends ModerationError {
  constructor(message: string, details?: unknown) {
    super(message, 'POLICY_VALIDATION_ERROR', 400, details);
    this.name = 'PolicyValidationError';
  }
}

export class ProviderError extends ModerationError {
  constructor(message: string, provider: ProviderName, details?: unknown) {
    super(message, 'PROVIDER_ERROR', 502, { provider, ...details });
    this.name = 'ProviderError';
  }
}

// ============================================================================
// Webhook Types
// ============================================================================

export const WebhookEventTypeSchema = z.enum([
  'decision.created',
  'decision.flagged',
  'decision.blocked',
  'policy.created',
  'policy.updated',
]);
export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

export const WebhookEndpointSchema = z.object({
  url: z.string().url().refine(
    (url) => {
      if (process.env.NODE_ENV === 'production') {
        // Disallow localhost in production
        return !url.includes('localhost') && !url.includes('127.0.0.1');
      }
      return true;
    },
    'Localhost webhooks are not allowed in production'
  ),
  events: z.array(WebhookEventTypeSchema),
  description: z.string().max(500).optional(),
});
export type WebhookEndpoint = z.infer<typeof WebhookEndpointSchema>;

// ============================================================================
// Utility Types
// ============================================================================

// JSON-serializable types for database storage
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface ModerationContext {
  userId?: string;
  sessionId?: string;
  locale?: string;
  region?: string;
  metadata?: Record<string, unknown>;
}
