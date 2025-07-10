interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Simple in-memory rate limiter
 * In production, consider using Redis or a dedicated rate limiting service
 */
export function rateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE_MS;

  // Clean up old entries
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < windowStart) {
      delete store[key];
    }
  });

  // Check current identifier
  if (!store[identifier]) {
    store[identifier] = {
      count: 1,
      resetTime: now + WINDOW_SIZE_MS,
    };
    return { allowed: true };
  }

  const entry = store[identifier];
  
  if (entry.resetTime < now) {
    // Reset window
    entry.count = 1;
    entry.resetTime = now + WINDOW_SIZE_MS;
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Get current rate limit status for an identifier
 */
export function getRateLimitStatus(identifier: string): {
  remaining: number;
  resetTime: number;
} {
  const entry = store[identifier];
  
  if (!entry || entry.resetTime < Date.now()) {
    return {
      remaining: MAX_REQUESTS_PER_WINDOW,
      resetTime: Date.now() + WINDOW_SIZE_MS,
    };
  }

  return {
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count),
    resetTime: entry.resetTime,
  };
} 