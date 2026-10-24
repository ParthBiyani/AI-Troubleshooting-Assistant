/* Pure text helpers for the interface, kept apart from components so they can be unit tested. */

/** Words that match everywhere and say nothing about why an entry was retrieved. */
const NOISE = new Set([
  "is",
  "and",
  "an",
  "a",
  "the",
  "of",
  "to",
  "in",
  "on",
  "not",
  "no",
  "for",
  "it",
  "at",
  "or",
  "are",
  "be",
  "by",
  "we",
  "my",
  "says",
  "but",
  "out",
  "one",
  "got",
  "was",
  "has",
  "this",
  "that",
  "with",
  "from",
  "when",
  "what",
  "how",
  "all",
  "can",
  "its",
]);
export function meaningfulTerms(terms: string[], question: string): string[] {
  const q = question.toLowerCase();
  return terms.filter((t) => {
    const w = t.toLowerCase();
    if (w.length < 3 || NOISE.has(w)) return false;
    // Fuzzy matching can surface numbers the user never typed (e.g. 004 for 504).
    if (/^\d+$/.test(w)) return q.includes(w);
    return true;
  });
}

/** Some models repeat the level inside the step text; the level pill already shows it. */
export const stripLevelTag = (step: string) => step.replace(/^\s*\((?:L1|L2)\)\s*/i, "");
