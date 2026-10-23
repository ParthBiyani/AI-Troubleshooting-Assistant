import { describe, expect, it } from "vitest";
import { decide } from "@/lib/retrieval/gate";
import type { RetrievedEntry } from "@/lib/retrieval";

const hit = (id: string, dense: number | null, bm25: number | null): RetrievedEntry => ({
  id,
  fusedScore: 0.03,
  bm25Score: bm25,
  denseScore: dense,
  bm25Rank: 1,
  denseRank: 1,
  matchedTerms: [],
});

describe("confidence gate", () => {
  it("answers on a strong, unambiguous match", () => {
    expect(decide([hit("a", 0.85, 800), hit("b", 0.7, 300)], true).decision).toBe("answer");
  });

  it("asks for more information when the top entries are close and keywords are weak", () => {
    expect(decide([hit("a", 0.75, 50), hit("b", 0.74, 40)], true).decision).toBe("clarify");
  });

  it("asks for more information below the answer band", () => {
    expect(decide([hit("a", 0.66, 500), hit("b", 0.5, 100)], true).decision).toBe("clarify");
  });

  it("refuses when nothing in the KB is semantically close", () => {
    expect(decide([hit("a", 0.5, 400), hit("b", 0.45, 100)], true).decision).toBe("not_in_kb");
  });

  it("falls back to keyword evidence when the semantic ranker is down", () => {
    expect(decide([hit("a", null, 900)], false).decision).toBe("answer");
    expect(decide([hit("a", null, 200)], false).decision).toBe("clarify");
    expect(decide([hit("a", null, 20)], false).decision).toBe("not_in_kb");
  });

  it("refuses on an empty result", () => {
    expect(decide([], true).decision).toBe("not_in_kb");
  });
});
