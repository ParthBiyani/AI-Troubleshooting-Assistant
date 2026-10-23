import type { RetrievedEntry } from "./index";

export type Decision = "answer" | "clarify" | "not_in_kb";

/**
 * Thresholds were read off the labelled set in eval/testset.json (see
 * docs/DECISIONS.md). BGE-small cosine scores are compressed into roughly
 * 0.45-0.90, so the bands are narrow.
 */
export const THRESHOLDS = {
  /** Below this the closest entry is unrelated: say the KB does not cover it. */
  denseFloor: 0.62,
  /** At or above this a match is strong enough to answer from. */
  denseAnswer: 0.7,
  /** A clear lead over the runner-up is enough to answer... */
  minGap: 0.03,
  /** ...or strong keyword evidence (exact codes, product terms). */
  strongKeyword: 300,
  /** Keyword-only fallback (semantic ranker unavailable). */
  keywordFloor: 100,
} as const;

export interface GateResult {
  decision: Decision;
  reason: string;
  signals: { topDense: number | null; denseGap: number | null; topBm25: number };
}

export function decide(hits: RetrievedEntry[], denseAvailable: boolean): GateResult {
  const dense = hits
    .map((h) => h.denseScore)
    .filter((s): s is number => s !== null)
    .sort((a, b) => b - a);
  const topBm25 = Math.max(0, ...hits.map((h) => h.bm25Score ?? 0));
  const topDense = dense[0] ?? null;
  const denseGap = dense.length > 1 ? dense[0] - dense[1] : null;
  const signals = { topDense, denseGap, topBm25 };
  const t = THRESHOLDS;

  if (hits.length === 0) {
    return { decision: "not_in_kb", reason: "No entry matched the query.", signals };
  }

  if (!denseAvailable || topDense === null) {
    if (topBm25 < t.keywordFloor) {
      return { decision: "not_in_kb", reason: "Keyword evidence is below the floor.", signals };
    }
    return topBm25 >= t.strongKeyword
      ? {
          decision: "answer",
          reason: "Strong keyword match (semantic ranker unavailable).",
          signals,
        }
      : {
          decision: "clarify",
          reason: "Weak keyword match (semantic ranker unavailable).",
          signals,
        };
  }

  if (topDense < t.denseFloor) {
    return {
      decision: "not_in_kb",
      reason: `Best semantic match ${topDense.toFixed(2)} is below ${t.denseFloor}.`,
      signals,
    };
  }
  if (topDense >= t.denseAnswer && ((denseGap ?? 1) >= t.minGap || topBm25 >= t.strongKeyword)) {
    return { decision: "answer", reason: "Strong, unambiguous match.", signals };
  }
  return {
    decision: "clarify",
    reason: "Match is weak or ambiguous between several entries.",
    signals,
  };
}
