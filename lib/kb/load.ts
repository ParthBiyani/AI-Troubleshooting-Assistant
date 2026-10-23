import corpusJson from "@/data/kb-entries.json";
import type { KbCorpus, KbEntry } from "./types";

export const corpus = corpusJson as unknown as KbCorpus;

const byId = new Map(corpus.entries.map((e) => [e.id, e]));

export const getEntry = (id: string): KbEntry | undefined => byId.get(id);
export const teamCodes = (): Set<string> => new Set(corpus.teams.map((t) => t.code));
