import { createHash } from "node:crypto";

/** Small in-memory TTL cache. Per-instance only, which is fine for a demo-scale app. */
export class TtlCache<V> {
  private store = new Map<string, { value: V; expires: number }>();

  constructor(
    private ttlMs: number,
    private maxEntries = 200,
  ) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

export const normaliseQuery = (q: string): string => q.toLowerCase().replace(/\s+/g, " ").trim();

export const queryKey = (q: string): string =>
  createHash("sha256").update(normaliseQuery(q)).digest("hex").slice(0, 32);

/** Sliding-window limiter, keyed by client IP. */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private limit: number,
    private windowMs: number,
  ) {}

  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
