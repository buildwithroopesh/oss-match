import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryCache } from "@/core/github/cache";

describe("MemoryCache", () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ defaultTtlMs: 1000, maxEntries: 3 });
  });

  it("stores and retrieves cached items (cache hit)", () => {
    cache.set("key1", { data: "test-data" });
    const result = cache.get<{ data: string }>("key1");
    expect(result).toEqual({ data: "test-data" });
    expect(cache.has("key1")).toBe(true);
  });

  it("returns undefined for nonexistent key (cache miss)", () => {
    const result = cache.get("nonexistent");
    expect(result).toBeUndefined();
    expect(cache.has("nonexistent")).toBe(false);
  });

  it("expires cached items after TTL (cache expiry)", () => {
    vi.useFakeTimers();
    try {
      cache.set("temp-key", "value", 500);
      expect(cache.get("temp-key")).toBe("value");

      // Advance clock past 500ms TTL
      vi.advanceTimersByTime(501);

      expect(cache.get("temp-key")).toBeUndefined();
      expect(cache.has("temp-key")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("evicts oldest entry when maxEntries is exceeded", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    // At capacity (3 entries)

    cache.set("d", 4); // Should evict oldest ('a')

    expect(cache.has("a")).toBe(false);
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("deletes and clears items", () => {
    cache.set("k1", "v1");
    cache.set("k2", "v2");

    cache.delete("k1");
    expect(cache.has("k1")).toBe(false);
    expect(cache.has("k2")).toBe(true);

    cache.clear();
    expect(cache.has("k2")).toBe(false);
    expect(cache.size()).toBe(0);
  });
});
