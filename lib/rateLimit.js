/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for serverless (Vercel) — state resets on cold start,
 * so this is burst protection only, not a hard quota.
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rateLimit';
 *   const limiter = rateLimit({ windowMs: 60000, max: 10 });
 *   const { allowed, remaining } = limiter.check(userId);
 */

const limiters = new Map();

/**
 * Create a rate limiter instance.
 * @param {object} opts
 * @param {number} opts.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} opts.max - Max requests per window (default: 10)
 * @param {string} [opts.name] - Optional name for debugging
 * @returns {{ check: (key: string) => { allowed: boolean, remaining: number, retryAfterMs: number } }}
 */
export function rateLimit({ windowMs = 60000, max = 10, name = 'default' } = {}) {
  // Reuse existing limiter by name to persist state across imports
  if (limiters.has(name)) return limiters.get(name);

  const hits = new Map(); // key → [timestamp, timestamp, ...]

  function cleanup(key) {
    const now = Date.now();
    const timestamps = hits.get(key);
    if (!timestamps) return;
    // Remove timestamps outside the window
    while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }
    if (timestamps.length === 0) hits.delete(key);
  }

  function check(key) {
    cleanup(key);
    const timestamps = hits.get(key) || [];

    if (timestamps.length >= max) {
      const oldestInWindow = timestamps[0];
      const retryAfterMs = oldestInWindow + windowMs - Date.now();
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
    }

    timestamps.push(Date.now());
    hits.set(key, timestamps);
    return { allowed: true, remaining: max - timestamps.length, retryAfterMs: 0 };
  }

  // Periodic cleanup to prevent memory leaks (every 5 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const filtered = timestamps.filter(t => t > now - windowMs);
      if (filtered.length === 0) hits.delete(key);
      else hits.set(key, filtered);
    }
  }, 5 * 60 * 1000);
  // Don't block process exit
  if (cleanupInterval.unref) cleanupInterval.unref();

  const limiter = { check };
  limiters.set(name, limiter);
  return limiter;
}
