import MiniSearch from "minisearch";
import { corpus } from "@/lib/kb/load";

export interface KeywordHit {
  id: string;
  score: number;
  matchedTerms: string[];
}

let index: MiniSearch | null = null;

function getIndex(): MiniSearch {
  if (index) return index;
  index = new MiniSearch({
    fields: ["keywords", "title", "symptoms", "causes"],
    storeFields: ["id"],
    searchOptions: {
      boost: { keywords: 3, title: 2, symptoms: 1.5, causes: 1 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: "OR",
    },
    tokenize: (s) =>
      s
        .toLowerCase()
        .split(/[^\p{L}\p{N}_]+/u)
        .filter(Boolean),
  });
  index.addAll(
    corpus.entries.map((e) => ({
      id: e.id,
      title: e.title,
      keywords: e.keywords.join(" "),
      symptoms: e.symptoms.join(" ").replace(/`/g, ""),
      causes: e.likelyCauses.join(" ").replace(/`/g, ""),
    })),
  );
  return index;
}

export function keywordSearch(query: string, limit = 10): KeywordHit[] {
  return getIndex()
    .search(query)
    .slice(0, limit)
    .map((r) => ({ id: r.id as string, score: r.score, matchedTerms: Object.keys(r.match) }));
}
