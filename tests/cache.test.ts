import { describe, expect, it, vi } from "vitest";
import { RateLimiter, TtlCache, normaliseQuery, queryKey } from "@/lib/cache";

describe("query normalisation", () => {
  it("treats case and whitespace differences as the same question", () => {
    expect(normaliseQuery("  Payment   FAILING ")).toBe("payment failing");
    expect(queryKey("Payment failing")).toBe(queryKey("  payment   failing"));
  });
});

describe("TtlCache", () => {
  it("returns a stored value until it expires", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1000);
    cache.set("k", "v");
    expect(cache.get("k")).toBe("v");
    vi.advanceTimersByTime(1500);
    expect(cache.get("k")).toBeUndefined();
    vi.useRealTimers();
  });

  it("evicts the oldest entry when full", () => {
    const cache = new TtlCache<number>(60_000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });
});

describe("RateLimiter", () => {
  it("blocks after the limit within the window and recovers afterwards", () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.allow("ip", 0)).toBe(true);
    expect(rl.allow("ip", 100)).toBe(true);
    expect(rl.allow("ip", 200)).toBe(false);
    expect(rl.allow("other", 200)).toBe(true);
    expect(rl.allow("ip", 1200)).toBe(true);
  });
});
