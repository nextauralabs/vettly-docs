import type { Logger } from 'pino';

export interface ModerationResult {
  decisionId: string;
  safe: boolean;
  flagged: boolean;
  action: 'block' | 'flag' | 'warn' | 'allow';
  results: Array<{
    contentType: string;
    safe: boolean;
    flagged: boolean;
    action: 'block' | 'flag' | 'warn' | 'allow';
    categories: Array<{
      category: string;
      score: number;
      triggered: boolean;
    }>;
    provider: string;
    latency: number;
    cost: number;
  }>;
  totalLatency: number;
  totalCost: number;
}

export interface MultimodalRequest {
  text?: string;
  images?: string[];
  policyId: string;
  metadata?: Record<string, unknown>;
}

export class VettlyClient {
  private baseUrl: string;
  private apiKey: string;
  private logger: Logger;

  constructor(logger: Logger) {
    this.baseUrl = process.env.VETTLY_API_URL!;
    this.apiKey = process.env.VETTLY_API_KEY!;
    this.logger = logger;
  }

  async checkMultimodal(request: MultimodalRequest): Promise<ModerationResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/v1/check/multimodal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vettly API error: ${response.status} ${errorText}`);
      }

      const result = await response.json() as ModerationResult;

      this.logger.debug({
        latency: Date.now() - startTime,
        safe: result.safe,
        action: result.action,
        resultCount: result.results?.length || 0,
        resultKeys: Object.keys(result),
      }, 'Vettly moderation complete');

      return result;
    } catch (error) {
      this.logger.error({ error, latency: Date.now() - startTime }, 'Vettly API request failed');
      throw error;
    }
  }

  async checkText(content: string, policyId: string, metadata?: Record<string, unknown>): Promise<ModerationResult> {
    return this.checkMultimodal({ text: content, policyId, metadata });
  }
}

// Singleton instance
let vettlyClient: VettlyClient | null = null;

export function getVettlyClient(logger: Logger): VettlyClient {
  if (!vettlyClient) {
    vettlyClient = new VettlyClient(logger);
  }
  return vettlyClient;
}
