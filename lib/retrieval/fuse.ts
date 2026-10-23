/**
 * Reciprocal Rank Fusion: score(d) = sum over rankings of 1 / (k + rank).
 * It needs no score calibration between BM25 and cosine similarity.
 */
export function reciprocalRankFusion(rankings: string[][], k = 60): Map<string, number> {
  const scores = new Map<string, number>();
  for (const ranking of rankings) {
    ranking.forEach((id, i) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1));
    });
  }
  return scores;
}
