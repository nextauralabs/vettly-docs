/**
 * @vettly/sdk
 * TypeScript client SDK for unified moderation API
 */
import type { CheckRequest, CheckResponse, Policy } from '@vettly/shared';

export interface ModerationClientConfig {
  apiKey: string;
  apiUrl?: string;
  mode?: 'test' | 'production';
  timeout?: number;
}

export class ModerationClient {
  private config: Required<ModerationClientConfig>;

  constructor(config: ModerationClientConfig) {
    this.config = {
      apiKey: config.apiKey,
      apiUrl: config.apiUrl || 'http://localhost:3000',
      mode: config.mode || 'production',
      timeout: config.timeout || 5000,
    };
  }

  /**
   * Check content for moderation
   */
  async check(request: Omit<CheckRequest, 'apiKey'>): Promise<CheckResponse> {
    const response = await this.fetch('/v1/check', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error || 'Moderation check failed');
    }

    return response.json() as Promise<CheckResponse>;
  }

  /**
   * Dry-run a policy without making provider calls
   */
  async dryRun(policyId: string, mockScores?: Record<string, number>): Promise<any> {
    const response = await this.fetch('/v1/check/dry-run', {
      method: 'POST',
      body: JSON.stringify({
        content: 'dry-run',
        policyId,
        mockScores,
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Dry run failed');
    }

    return response.json();
  }

  /**
   * Create or update a policy
   */
  async createPolicy(policyId: string, yamlContent: string, userId?: string): Promise<any> {
    const response = await this.fetch('/v1/policies', {
      method: 'POST',
      body: JSON.stringify({ policyId, yamlContent, userId }),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to create policy');
    }

    return response.json();
  }

  /**
   * Get a specific policy
   */
  async getPolicy(policyId: string): Promise<any> {
    const response = await this.fetch(`/v1/policies/${policyId}`);

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to get policy');
    }

    return response.json();
  }

  /**
   * List all policies
   */
  async listPolicies(): Promise<any> {
    const response = await this.fetch('/v1/policies');

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to list policies');
    }

    return response.json();
  }

  /**
   * Get decision details
   */
  async getDecision(decisionId: string): Promise<any> {
    const response = await this.fetch(`/v1/decisions/${decisionId}`);

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to get decision');
    }

    return response.json();
  }

  /**
   * List recent decisions
   */
  async listDecisions(options?: { limit?: number; offset?: number }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const response = await this.fetch(`/v1/decisions?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to list decisions');
    }

    return response.json();
  }

  /**
   * Replay a decision with a different policy
   */
  async replayDecision(decisionId: string, policyId: string): Promise<any> {
    const response = await this.fetch(`/v1/decisions/${decisionId}/replay`, {
      method: 'POST',
      body: JSON.stringify({ policyId }),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to replay decision');
    }

    return response.json();
  }

  /**
   * Get cURL command for a decision
   */
  async getCurlCommand(decisionId: string): Promise<string> {
    const response = await this.fetch(`/v1/decisions/${decisionId}/curl`);

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to get cURL command');
    }

    const data = await response.json() as { curl: string };
    return data.curl;
  }

  /**
   * Batch check multiple items synchronously
   */
  async batchCheck(request: {
    policyId: string;
    items: Array<{
      id: string;
      content: string;
      contentType?: 'text' | 'image' | 'video';
      metadata?: Record<string, unknown>;
    }>;
  }): Promise<any> {
    const response = await this.fetch('/v1/batch/check', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Batch check failed');
    }

    return response.json();
  }

  /**
   * Batch check multiple items asynchronously with webhook delivery
   */
  async batchCheckAsync(request: {
    policyId: string;
    items: Array<{
      id: string;
      content: string;
      contentType?: 'text' | 'image' | 'video';
      metadata?: Record<string, unknown>;
    }>;
    webhookUrl: string;
  }): Promise<any> {
    const response = await this.fetch('/v1/batch/check/async', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Async batch check failed');
    }

    return response.json();
  }

  /**
   * Register a webhook endpoint
   */
  async registerWebhook(request: {
    url: string;
    events: string[];
    description?: string;
  }): Promise<any> {
    const response = await this.fetch('/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to register webhook');
    }

    return response.json();
  }

  /**
   * List all webhook endpoints
   */
  async listWebhooks(): Promise<any> {
    const response = await this.fetch('/v1/webhooks');

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to list webhooks');
    }

    return response.json();
  }

  /**
   * Get webhook endpoint details
   */
  async getWebhook(webhookId: string): Promise<any> {
    const response = await this.fetch(`/v1/webhooks/${webhookId}`);

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to get webhook');
    }

    return response.json();
  }

  /**
   * Update webhook endpoint
   */
  async updateWebhook(
    webhookId: string,
    updates: {
      url?: string;
      events?: string[];
      description?: string;
      enabled?: boolean;
    }
  ): Promise<any> {
    const response = await this.fetch(`/v1/webhooks/${webhookId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to update webhook');
    }

    return response.json();
  }

  /**
   * Delete webhook endpoint
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const response = await this.fetch(`/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to delete webhook');
    }
  }

  /**
   * Send test webhook event
   */
  async testWebhook(
    webhookId: string,
    eventType: string
  ): Promise<any> {
    const response = await this.fetch(`/v1/webhooks/${webhookId}/test`, {
      method: 'POST',
      body: JSON.stringify({ eventType }),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to test webhook');
    }

    return response.json();
  }

  /**
   * Get webhook delivery logs
   */
  async getWebhookDeliveries(
    webhookId: string,
    options?: { limit?: number }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());

    const response = await this.fetch(
      `/v1/webhooks/${webhookId}/deliveries?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to get webhook deliveries');
    }

    return response.json();
  }

  /**
   * Internal fetch wrapper
   */
  private async fetch(path: string, options?: RequestInit): Promise<Response> {
    const url = `${this.config.apiUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        ...options?.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    return response;
  }
}

/**
 * Express middleware for content moderation
 */
export function moderateContent(options: {
  client: ModerationClient;
  policyId: string;
  field?: string;
  onFlagged?: (req: any, res: any, result: CheckResponse) => void;
}) {
  return async (req: any, res: any, next: any) => {
    try {
      const content = options.field
        ? getNestedProperty(req, options.field)
        : req.body.content;

      if (!content) {
        return next();
      }

      const result = await options.client.check({
        content,
        policyId: options.policyId,
        contentType: 'text',
        metadata: {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      if (result.flagged && options.onFlagged) {
        return options.onFlagged(req, res, result);
      }

      if (result.action === 'block') {
        return res.status(403).json({
          error: 'Content blocked by moderation',
          categories: result.categories.filter(c => c.triggered),
        });
      }

      next();
    } catch (error) {
      console.error('Moderation middleware error:', error);
      next(); // Fail open - don't block on moderation errors
    }
  };
}

function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
