import type { KbEntry } from "@/lib/kb/types";

/**
 * What we index. Users describe symptoms, not resolutions, so matching on
 * resolution text only adds noise.
 */
export function searchableText(e: KbEntry): string {
  return [e.title, e.keywords.join(", "), e.symptoms.join(" "), e.likelyCauses.join(" ")]
    .join("\n")
    .replace(/`/g, "");
}

/** BGE retrieval models expect this instruction on the query side only. */
export const BGE_QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";
