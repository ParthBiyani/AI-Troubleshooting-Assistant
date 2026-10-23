import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ask } from "../lib/pipeline";

interface Case {
  group: string;
  question: string;
  expectedMode: "answer" | "clarify" | "not_in_kb";
  expectedIds: string[];
}

const MODES = ["answer", "clarify", "not_in_kb"] as const;
const withLlm = process.argv.includes("--llm");
/** Groq's free tier allows ~8K tokens/min per model; a ~3K-token prompt needs spacing. */
const THROTTLE_MS = Number(process.env.EVAL_THROTTLE_MS ?? 9000);

const cases: Case[] = JSON.parse(readFileSync(join(__dirname, "testset.json"), "utf8"));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const percentile = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
};

async function main() {
  const matrix: Record<string, Record<string, number>> = {};
  for (const m of MODES) matrix[m] = { answer: 0, clarify: 0, not_in_kb: 0 };

  const failures: string[] = [];
  const latencies: number[] = [];
  let top1 = 0;
  let answerable = 0;
  let citationIssues = 0;
  let llmAnswers = 0;
  let falseAnswersOnOos = 0;

  for (const c of cases) {
    const r = await ask({ question: c.question, useLlm: withLlm });
    matrix[c.expectedMode][r.mode]++;
    latencies.push(r.meta.latencyMs);

    if (c.expectedMode === "answer") {
      answerable++;
      if (c.expectedIds.includes(r.sources[0]?.entry.id)) top1++;
    }
    if (c.expectedMode === "not_in_kb" && r.mode === "answer") falseAnswersOnOos++;
    if (r.mode !== c.expectedMode) {
      failures.push(
        `- [${c.group}] "${c.question}" expected \`${c.expectedMode}\`, got \`${r.mode}\` (${r.gate.reason})`,
      );
    }
    if (r.answer) {
      llmAnswers++;
      citationIssues += r.guards.validationIssues.length;
    }
    if (withLlm && !r.meta.cached && r.mode !== "not_in_kb") await sleep(THROTTLE_MS);
  }

  const correct = MODES.reduce((n, m) => n + matrix[m][m], 0);
  const table = [
    "| expected \\ got | answer | clarify | not_in_kb |",
    "|---|---|---|---|",
    ...MODES.map(
      (m) => `| **${m}** | ${matrix[m].answer} | ${matrix[m].clarify} | ${matrix[m].not_in_kb} |`,
    ),
  ].join("\n");

  const report = [
    `# End-to-end evaluation (${cases.length} questions, ${withLlm ? "with LLM" : "gate only, no LLM"})`,
    "",
    `Decision accuracy: **${correct}/${cases.length}** (${((100 * correct) / cases.length).toFixed(1)}%)`,
    `False answers on out-of-scope questions: **${falseAnswersOnOos}**`,
    `Top-1 source correct on answerable questions: **${top1}/${answerable}**`,
    withLlm
      ? `Model answers: ${llmAnswers}; citations/teams removed by the validator: ${citationIssues}`
      : "",
    `Latency p50 / p95: ${percentile(latencies, 0.5)} ms / ${percentile(latencies, 0.95)} ms`,
    "",
    "## Decision confusion matrix",
    "",
    table,
    "",
    "## Misclassified questions",
    "",
    ...(failures.length ? failures : ["None."]),
    "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  writeFileSync(join(__dirname, withLlm ? "report.md" : "report-gate-only.md"), report + "\n");
  console.log(report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
