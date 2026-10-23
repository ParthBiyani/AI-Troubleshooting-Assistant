import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCorpus } from "../lib/kb/parse";
import { embed, EMBEDDING_MODEL } from "../lib/retrieval/dense";
import { searchableText } from "../lib/retrieval/text";

const root = join(__dirname, "..");
const markdown = readFileSync(join(root, "data", "Northwind_Support_Knowledge_Manual.md"), "utf8");
const corpus = parseCorpus(markdown);

mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "data", "kb-entries.json"), JSON.stringify(corpus, null, 2));
console.log(
  `Parsed ${corpus.entries.length} entries, ${corpus.teams.length} teams, ${corpus.priorities.length} priorities`,
);

async function main() {
  if (process.argv.includes("--skip-vectors")) {
    // Lint, type-check and unit-test jobs only need the file to exist so imports resolve.
    const path = join(root, "data", "kb-vectors.json");
    if (!existsSync(path)) writeFileSync(path, JSON.stringify({ model: "none", vectors: {} }));
    return;
  }
  const vectors = await embed(corpus.entries.map(searchableText));
  const round = (v: number[]) => v.map((x) => Math.round(x * 1e5) / 1e5);
  writeFileSync(
    join(root, "data", "kb-vectors.json"),
    JSON.stringify({
      model: EMBEDDING_MODEL,
      vectors: Object.fromEntries(corpus.entries.map((e, i) => [e.id, round(vectors[i])])),
    }),
  );
  console.log(`Embedded ${vectors.length} entries with ${EMBEDDING_MODEL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
