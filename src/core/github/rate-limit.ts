/**
 * GitHub Rate Limit Header Parser & Telemetry
 *
 * Extracts rate-limiting telemetry directly from HTTP response headers
 * without making superfluous GET /rate_limit calls.
 */

import type { RateLimitInfo } from "../types/github";

/**
 * Parses GitHub rate limit headers from a Headers or Headers-like object.
 */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
  const limitStr = headers.get("x-ratelimit-limit");
  const remainingStr = headers.get("x-ratelimit-remaining");
  const resetStr = headers.get("x-ratelimit-reset");
  const usedStr = headers.get("x-ratelimit-used");
  const resource = headers.get("x-ratelimit-resource") ?? "core";
  const retryAfterStr = headers.get("retry-after");

  // If no rate limit headers are present at all, return undefined
  if (!limitStr && !remainingStr && !resetStr) {
    if (retryAfterStr) {
      const retryAfter = parseInt(retryAfterStr, 10);
      return {
        limit: 0,
        remaining: 0,
        used: 0,
        reset: Math.floor(Date.now() / 1000) + (isNaN(retryAfter) ? 60 : retryAfter),
        resource: "unknown",
        retryAfter: isNaN(retryAfter) ? undefined : retryAfter,
      };
    }
    return undefined;
  }

  const limit = limitStr ? parseInt(limitStr, 10) : 0;
  const remaining = remainingStr ? parseInt(remainingStr, 10) : 0;
  const reset = resetStr ? parseInt(resetStr, 10) : Math.floor(Date.now() / 1000) + 60;
  const used = usedStr ? parseInt(usedStr, 10) : limit - remaining;
  const retryAfter = retryAfterStr ? parseInt(retryAfterStr, 10) : undefined;

  return {
    limit: isNaN(limit) ? 0 : limit,
    remaining: isNaN(remaining) ? 0 : remaining,
    used: isNaN(used) ? 0 : used,
    reset: isNaN(reset) ? Math.floor(Date.now() / 1000) + 60 : reset,
    resource,
    retryAfter: retryAfter !== undefined && !isNaN(retryAfter) ? retryAfter : undefined,
  };
}

/**
 * Checks if the primary rate limit has been exhausted.
 */
export function isPrimaryRateLimitExhausted(rateLimit?: RateLimitInfo): boolean {
  return rateLimit !== undefined && rateLimit.remaining === 0;
}

/**
 * Formats a human-readable duration until rate limit reset.
 */
export function formatResetTime(resetEpochSeconds: number, nowEpochSeconds = Math.floor(Date.now() / 1000)): string {
  const secondsLeft = Math.max(0, resetEpochSeconds - nowEpochSeconds);
  if (secondsLeft < 60) {
    return `${secondsLeft}s`;
  }
  const minutes = Math.ceil(secondsLeft / 60);
  return `${minutes} min`;
}
