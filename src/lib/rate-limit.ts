// Failed-login limiter: MAX_FAILED_ATTEMPTS per WINDOW_MS per client IP.
//
// State is held in memory, so it is per server instance and resets when the
// instance is recycled. That is enough to stop casual brute forcing on a small
// hobby app; swap in Redis/KV if it ever needs to be airtight.

export const MAX_FAILED_ATTEMPTS = 5;
export const WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

type Entry = { count: number; resetAt: number };

const failures = new Map<string, Entry>();

export type LimitStatus = {
  blocked: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function prune(now: number) {
  for (const [key, entry] of failures) {
    if (entry.resetAt <= now) failures.delete(key);
  }
}

function statusFor(entry: Entry | undefined, now: number): LimitStatus {
  if (!entry) {
    return { blocked: false, remaining: MAX_FAILED_ATTEMPTS, retryAfterSeconds: 0 };
  }
  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.count);
  return {
    blocked: remaining === 0,
    remaining,
    retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * The requesting source is the client IP. On Vercel, x-forwarded-for is set by
 * the platform (client-supplied values are overwritten), so it can't be spoofed.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkLimit(key: string): LimitStatus {
  const now = Date.now();
  prune(now);
  return statusFor(failures.get(key), now);
}

export function recordFailure(key: string): LimitStatus {
  const now = Date.now();
  prune(now);
  const entry = failures.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };
  entry.count += 1;
  failures.set(key, entry);
  return statusFor(entry, now);
}
