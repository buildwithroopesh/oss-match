import { describe, it, expect } from "vitest";
import {
  parseRateLimitHeaders,
  isPrimaryRateLimitExhausted,
  formatResetTime,
} from "@/core/github/rate-limit";

describe("Rate Limit Parser & Helpers", () => {
  it("parses full rate limit headers correctly", () => {
    const headers = new Headers({
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "4920",
      "x-ratelimit-used": "80",
      "x-ratelimit-reset": "1774123456",
      "x-ratelimit-resource": "core",
    });

    const info = parseRateLimitHeaders(headers);
    expect(info).toEqual({
      limit: 5000,
      remaining: 4920,
      used: 80,
      reset: 1774123456,
      resource: "core",
      retryAfter: undefined,
    });
  });

  it("parses retry-after header when present", () => {
    const headers = new Headers({
      "x-ratelimit-limit": "60",
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": "1774120000",
      "retry-after": "45",
    });

    const info = parseRateLimitHeaders(headers);
    expect(info?.retryAfter).toBe(45);
    expect(info?.remaining).toBe(0);
  });

  it("returns undefined when no rate limit headers are present", () => {
    const headers = new Headers({ "content-type": "application/json" });
    const info = parseRateLimitHeaders(headers);
    expect(info).toBeUndefined();
  });

  it("identifies when primary rate limit is exhausted", () => {
    expect(
      isPrimaryRateLimitExhausted({
        limit: 60,
        remaining: 0,
        used: 60,
        reset: 1000,
        resource: "core",
      })
    ).toBe(true);

    expect(
      isPrimaryRateLimitExhausted({
        limit: 60,
        remaining: 5,
        used: 55,
        reset: 1000,
        resource: "core",
      })
    ).toBe(false);

    expect(isPrimaryRateLimitExhausted(undefined)).toBe(false);
  });

  it("formats human-readable reset duration", () => {
    const now = 1000;
    expect(formatResetTime(1040, now)).toBe("40s");
    expect(formatResetTime(1120, now)).toBe("2 min");
    expect(formatResetTime(990, now)).toBe("0s");
  });
});
