import { Injectable } from "@nestjs/common";

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, number[]>();

  check(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const threshold = now - windowMs;
    const existing = this.buckets.get(key) ?? [];
    const next = existing.filter((value) => value > threshold);

    if (next.length >= limit) {
      const retryAfterMs = Math.max(windowMs - (now - next[0]), 1000);
      return {
        allowed: false,
        retryAfterMs
      };
    }

    next.push(now);
    this.buckets.set(key, next);

    return {
      allowed: true,
      retryAfterMs: 0
    };
  }
}
