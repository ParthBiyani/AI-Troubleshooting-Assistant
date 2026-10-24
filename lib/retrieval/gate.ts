import type { RetrievedEntry } from "./index";

/**
 * What the gate decides before the model is called. `clarify` means "uncertain":
 * the model is shown the candidates and chooses between answering, asking, or
 * saying the KB does not cover it. Only `not_in_kb` is final without the model.
 */
export type Decision = "answer" | "clarify" | "not_in_kb";

/**
 * Thresholds were chosen from the development questions (eval/testset.json and
 * eval/heldout.json) and then scored once on eval/sealed.json. BGE-small cosine
 * scores are compressed into roughly 0.45-0.90, so the bands are narrow.
 */
export const THRESHOLDS = {
  /** If even the best semantic match across all candidates is below this, the KB does not cover it. */
  denseFloor: 0.62,
  /** The top-ranked entry's own semantic score must reach this to answer without the model weighing in... */
  denseAnswer: 0.7,
  /** ...and keyword search must also support that entry (vague questions share few keywords). */
  keywordAnswer: 150,
  /** Keyword-only fallback (semantic ranker unavailable). */
  keywordFloor: 100,
  strongKeyword: 300,
} as const;

export interface GateResult {
  decision: Decision;
  reason: string;
  signals: {
    /** Best semantic score among all candidates; used for the refusal floor. */
    maxDense: number | null;
    /** Semantic score of the entry that fused ranking put first. */
    topEntryDense: number | null;
    /** Keyword score of that same entry. */
    topEntryBm25: number;
  };
}

export function decide(hits: RetrievedEntry[], denseAvailable: boolean): GateResult {
  const t = THRESHOLDS;
  const top = hits[0];
  const dense = hits.map((h) => h.denseScore).filter((s): s is number => s !== null);
  const maxDense = dense.length ? Math.max(...dense) : null;
  const topEntryBm25 = top?.bm25Score ?? 0;
  const signals = { maxDense, topEntryDense: top?.denseScore ?? null, topEntryBm25 };

  if (!top) {
    return { decision: "not_in_kb", reason: "No entry matched the query.", signals };
  }

  if (!denseAvailable || maxDense === null) {
    if (topEntryBm25 < t.keywordFloor) {
      return { decision: "not_in_kb", reason: "Keyword evidence is below the floor.", signals };
    }
    return topEntryBm25 >= t.strongKeyword
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

  if (maxDense < t.denseFloor) {
    return {
      decision: "not_in_kb",
      reason: `Best semantic match ${maxDense.toFixed(2)} is below ${t.denseFloor}.`,
      signals,
    };
  }

  const topDense = top.denseScore ?? 0;
  if (topDense >= t.denseAnswer && topEntryBm25 >= t.keywordAnswer) {
    return {
      decision: "answer",
      reason: `Top entry has semantic ${topDense.toFixed(2)} and keyword ${topEntryBm25.toFixed(0)} support.`,
      signals,
    };
  }
  return {
    decision: "clarify",
    reason: "Uncertain: the model decides whether one entry clearly matches.",
    signals,
  };
}
