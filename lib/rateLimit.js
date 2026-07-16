/**
 * Sliding-window rate limiter with optional Redis persistence.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set,
 * uses Upstash Redis for cross-instance, deploy-surviving rate limits.
 * Otherwise falls back to in-memory Map (burst protection only).
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rateLimit';
 *   const limiter = rateLimit({ windowMs: 60000, max: 10 });
 *   const { allowed, remaining } = await limiter.check(userId);
 *
 * Note: check() is now async to support Redis. Existing callers that
 * use the sync in-memory version should await the result.
 */

const limiters = new Map();

/** Check if Upstash Redis is configured */
function isRedisConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Redis-based sliding window check using Upstash REST API.
 * Uses a sorted set per key with timestamps as scores.
 */
async function redisCheck(key, windowMs, max) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `rl:${key}`;

  try {
    // Pipeline: ZREMRANGEBYSCORE (cleanup) + ZADD (add current) + ZCARD (count) + PEXPIRE (TTL)
    const pipeline = [
      ['ZREMRANGEBYSCORE', redisKey, '0', String(windowStart)],
      ['ZADD', redisKey, String(now), `${now}:${Math.random().toString(36).slice(2, 8)}`],
      ['ZCARD', redisKey],
      ['PEXPIRE', redisKey, String(windowMs)],
    ];

    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
    });

    if (!res.ok) {
      console.warn('Redis rate limit request failed, falling back to allow');
      return { allowed: true, remaining: max, retryAfterMs: 0 };
    }

    const results = await res.json();
    // results[2] is ZCARD response: { result: count }
    const count = results[2]?.result || 0;

    if (count > max) {
      // Over limit — the ZADD already added one, so we need to remove it
      // But for simplicity, just deny — it'll expire naturally
      return { allowed: false, remaining: 0, retryAfterMs: windowMs };
    }

    return { allowed: true, remaining: Math.max(0, max - count), retryAfterMs: 0 };
  } catch (err) {
    console.warn('Redis rate limit error:', err.message);
    // Fail open — don't block users if Redis is down
    return { allowed: true, remaining: max, retryAfterMs: 0 };
  }
}

/**
 * In-memory sliding window check (original implementation).
 */
function memoryCheck(hits, key, windowMs, max) {
  const now = Date.now();
  const timestamps = hits.get(key) || [];

  // Remove timestamps outside the window
  while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
    timestamps.shift();
  }
  if (timestamps.length === 0) hits.delete(key);

  if (timestamps.length >= max) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true, remaining: max - timestamps.length, retryAfterMs: 0 };
}

/**
 * Create a rate limiter instance.
 * @param {object} opts
 * @param {number} opts.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} opts.max - Max requests per window (default: 10)
 * @param {string} [opts.name] - Optional name for debugging / limiter reuse
 * @returns {{ check: (key: string) => Promise<{ allowed: boolean, remaining: number, retryAfterMs: number }> }}
 */
export function rateLimit({ windowMs = 60000, max = 10, name = 'default' } = {}) {
  // Reuse existing limiter by name to persist state across imports
  if (limiters.has(name)) return limiters.get(name);

  const hits = new Map(); // in-memory fallback storage

  async function check(key) {
    const prefixedKey = `${name}:${key}`;

    if (isRedisConfigured()) {
      return redisCheck(prefixedKey, windowMs, max);
    }

    return memoryCheck(hits, key, windowMs, max);
  }

  // Periodic cleanup for in-memory fallback (every 5 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const filtered = timestamps.filter(t => t > now - windowMs);
      if (filtered.length === 0) hits.delete(key);
      else hits.set(key, filtered);
    }
  }, 5 * 60 * 1000);
  if (cleanupInterval.unref) cleanupInterval.unref();

  const limiter = { check };
  limiters.set(name, limiter);
  return limiter;
}
