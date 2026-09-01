interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const previous = rateLimitStore.get(key);
  const entry = !previous || previous.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : previous;

  entry.count += 1;
  rateLimitStore.set(key, entry);

  if (rateLimitStore.size > 10_000) {
    for (const [storedKey, stored] of rateLimitStore) {
      if (stored.resetAt <= now) rateLimitStore.delete(storedKey);
    }
  }

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function resetRateLimitsForTests(): void {
  rateLimitStore.clear();
}
