import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCorpus } from "../lib/kb/parse";

const root = join(__dirname, "..");
const markdown = readFileSync(join(root, "data", "Northwind_Support_Knowledge_Manual.md"), "utf8");
const corpus = parseCorpus(markdown);

mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "data", "kb-entries.json"), JSON.stringify(corpus, null, 2));
console.log(
  `Parsed ${corpus.entries.length} entries, ${corpus.teams.length} teams, ${corpus.priorities.length} priorities`,
);
