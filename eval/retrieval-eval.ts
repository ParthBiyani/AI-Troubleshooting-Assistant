import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { retrieve, type RetrievalMode } from "../lib/retrieval";

interface Case {
  group: string;
  question: string;
  expectedMode: "answer" | "clarify" | "not_in_kb";
  expectedIds: string[];
}

const cases: Case[] = JSON.parse(readFileSync(join(__dirname, "testset.json"), "utf8"));
const answerable = cases.filter((c) => c.expectedMode === "answer");
const modes: RetrievalMode[] = ["bm25", "dense", "hybrid"];

async function main() {
  const rows: string[] = ["| Retriever | Hit@1 | Hit@3 | Hit@5 | MRR |", "|---|---|---|---|---|"];
  const misses: string[] = [];

  for (const mode of modes) {
    let h1 = 0,
      h3 = 0,
      h5 = 0,
      rr = 0;
    for (const c of answerable) {
      const { hits } = await retrieve(c.question, mode, 5);
      const rank = hits.findIndex((h) => c.expectedIds.includes(h.id)) + 1;
      if (rank === 1) h1++;
      if (rank >= 1 && rank <= 3) h3++;
      if (rank >= 1) h5++;
      if (rank > 0) rr += 1 / rank;
      else if (mode === "hybrid")
        misses.push(
          `- "${c.question}" expected ${c.expectedIds} got ${hits.map((h) => h.id).slice(0, 3)}`,
        );
    }
    const n = answerable.length;
    const pct = (x: number) => ((100 * x) / n).toFixed(1) + "%";
    rows.push(`| ${mode} | ${pct(h1)} | ${pct(h3)} | ${pct(h5)} | ${(rr / n).toFixed(3)} |`);
  }

  const report = [
    `# Retrieval evaluation (${answerable.length} answerable questions)`,
    "",
    ...rows,
    "",
    "## Hybrid misses outside the top 5",
    ...(misses.length ? misses : ["None."]),
    "",
  ].join("\n");
  writeFileSync(join(__dirname, "retrieval-report.md"), report);
  console.log(report);
}

main();
