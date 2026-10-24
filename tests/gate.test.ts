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
  it("answers when the top entry has both semantic and keyword support", () => {
    expect(decide([hit("a", 0.85, 800), hit("b", 0.7, 300)], true).decision).toBe("answer");
  });

  it("scores the entry that fused ranking put first, not the best score among all hits", () => {
    // The user's "504 again and again" case: the right entry (first) scored 0.675 and an
    // unrelated entry scored 0.707. The old gate read 0.707; the signals must come from hits[0].
    const g = decide([hit("KB-PAY-002", 0.675, 208), hit("KB-PAY-005", 0.707, 74)], true);
    expect(g.signals.topEntryDense).toBeCloseTo(0.675);
    expect(g.signals.maxDense).toBeCloseTo(0.707);
    expect(g.decision).toBe("clarify");
  });

  it("does not answer a vague question that has a good semantic score but no keyword support", () => {
    expect(decide([hit("a", 0.75, 25), hit("b", 0.73, 20)], true).decision).toBe("clarify");
  });

  it("leaves the middle band to the model", () => {
    expect(decide([hit("a", 0.68, 400), hit("b", 0.5, 100)], true).decision).toBe("clarify");
  });

  it("refuses when nothing in the KB is semantically close", () => {
    expect(decide([hit("a", 0.5, 400), hit("b", 0.45, 100)], true).decision).toBe("not_in_kb");
  });

  it("keeps the refusal floor tied to the best candidate, so a lone weak top entry is not refused", () => {
    expect(decide([hit("a", 0.6, 300), hit("b", 0.66, 100)], true).decision).toBe("clarify");
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
