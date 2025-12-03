/**
 * Simple in-memory rate limiter per guild
 * Prevents spamming the Vettly API
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60_000);
  }

  isLimited(guildId: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(guildId) || [];

    // Filter to only recent requests
    const recentRequests = timestamps.filter(ts => now - ts < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return true;
    }

    // Record this request
    recentRequests.push(now);
    this.requests.set(guildId, recentRequests);

    return false;
  }

  private cleanup() {
    const now = Date.now();
    for (const [guildId, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter(ts => now - ts < this.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(guildId);
      } else {
        this.requests.set(guildId, recentRequests);
      }
    }
  }
}

// Singleton instance - 100 requests per minute per guild
export const rateLimiter = new RateLimiter(100, 60_000);
