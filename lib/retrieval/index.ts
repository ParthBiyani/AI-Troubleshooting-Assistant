import vectorData from "@/data/kb-vectors.json";
import { keywordSearch } from "./bm25";
import { cosineRank, embedQuery } from "./dense";
import { reciprocalRankFusion } from "./fuse";

export type RetrievalMode = "hybrid" | "bm25" | "dense";

export interface RetrievedEntry {
  id: string;
  /** RRF score, or the single ranker's score in bm25/dense mode. */
  fusedScore: number;
  bm25Score: number | null;
  denseScore: number | null;
  bm25Rank: number | null;
  denseRank: number | null;
  matchedTerms: string[];
}

export interface RetrievalResult {
  hits: RetrievedEntry[];
  /** False when the semantic ranker was unavailable and we fell back to keyword search. */
  denseAvailable: boolean;
}

const vectors = (vectorData as { vectors: Record<string, number[]> }).vectors;

export async function retrieve(
  query: string,
  mode: RetrievalMode = "hybrid",
  limit = 5,
): Promise<RetrievalResult> {
  const keyword = mode === "dense" ? [] : keywordSearch(query, 10);

  let dense: ReturnType<typeof cosineRank> = [];
  let denseAvailable = true;
  if (mode !== "bm25") {
    try {
      dense = cosineRank(await embedQuery(query), vectors, 10);
    } catch (err) {
      console.warn("Dense retrieval unavailable, using keyword search only:", err);
      denseAvailable = false;
    }
  }

  const kwById = new Map(keyword.map((h, i) => [h.id, { ...h, rank: i + 1 }]));
  const dnById = new Map(dense.map((h, i) => [h.id, { ...h, rank: i + 1 }]));
  const fused = reciprocalRankFusion([keyword.map((h) => h.id), dense.map((h) => h.id)]);

  const hits = [...fused.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, fusedScore]): RetrievedEntry => ({
      id,
      fusedScore,
      bm25Score: kwById.get(id)?.score ?? null,
      denseScore: dnById.get(id)?.score ?? null,
      bm25Rank: kwById.get(id)?.rank ?? null,
      denseRank: dnById.get(id)?.rank ?? null,
      matchedTerms: kwById.get(id)?.matchedTerms ?? [],
    }));

  return { hits, denseAvailable };
}
