import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ask } from "../lib/pipeline";
import { judgeGroundedness } from "./judge";

interface Case {
  group: string;
  question: string;
  expectedMode: "answer" | "clarify" | "not_in_kb";
  expectedIds: string[];
}

const MODES = ["answer", "clarify", "not_in_kb"] as const;
const args = process.argv.slice(2);
const withLlm = args.includes("--llm");
const withJudge = args.includes("--judge");
/** `--set=heldout` scores eval/heldout.json, which was never used to choose thresholds or prompts. */
const setName = args.find((a) => a.startsWith("--set="))?.slice(6) ?? "testset";
/** Groq's free tier allows ~8K tokens/min per model; a ~3K-token prompt needs spacing. */
const THROTTLE_MS = Number(process.env.EVAL_THROTTLE_MS ?? 9000);

const cases: Case[] = JSON.parse(readFileSync(join(__dirname, `${setName}.json`), "utf8"));
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
  let top3 = 0;
  let answerable = 0;
  let citationIssues = 0;
  let llmAnswers = 0;
  let falseAnswersOnOos = 0;
  let judged = 0;
  let statementsTotal = 0;
  let statementsSupported = 0;
  const unsupportedLog: string[] = [];

  for (const c of cases) {
    const r = await ask({ question: c.question, useLlm: withLlm });
    matrix[c.expectedMode][r.mode]++;
    latencies.push(r.meta.latencyMs);

    if (c.expectedMode === "answer") {
      answerable++;
      const ids = r.sources.map((s) => s.entry.id);
      if (c.expectedIds.includes(ids[0])) top1++;
      if (ids.slice(0, 3).some((id) => c.expectedIds.includes(id))) top3++;
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
      if (withJudge && r.answer.mode === "answer") {
        try {
          const context = r.sources.filter((s) => s.usedAsContext).map((s) => s.entry);
          const verdict = await judgeGroundedness(r.answer, context);
          judged++;
          statementsTotal += verdict.total;
          statementsSupported += verdict.supported;
          for (const u of verdict.unsupported) {
            unsupportedLog.push(`- "${c.question}": ${u.text} (${u.reason})`);
          }
        } catch (err) {
          console.warn("judge failed for", c.question, err instanceof Error ? err.message : err);
        }
        await sleep(THROTTLE_MS);
      }
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

  const mode = withLlm ? "with LLM" : "gate only, no LLM";
  const report = [
    `# End-to-end evaluation: \`${setName}\` (${cases.length} questions, ${mode})`,
    "",
    `Decision accuracy: **${correct}/${cases.length}** (${((100 * correct) / cases.length).toFixed(1)}%)`,
    `False answers on out-of-scope questions: **${falseAnswersOnOos}**`,
    `Correct source at rank 1 / in top 3 (answerable questions): **${top1}/${answerable}** / **${top3}/${answerable}**`,
    withLlm
      ? `Model answers: ${llmAnswers}; citations/teams removed by the validator: ${citationIssues}`
      : "",
    withJudge
      ? `Groundedness (judge model, ${judged} answers): **${statementsSupported}/${statementsTotal}** statements supported (${statementsTotal ? ((100 * statementsSupported) / statementsTotal).toFixed(1) : "n/a"}%)`
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
    ...(withJudge
      ? [
          "",
          "## Statements the judge marked unsupported",
          "",
          ...(unsupportedLog.length ? unsupportedLog : ["None."]),
        ]
      : []),
    "",
  ]
    .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
    .join("\n");

  const base =
    setName === "testset"
      ? withLlm
        ? "report"
        : "report-gate-only"
      : `report-${setName}${withLlm ? "" : "-gate-only"}`;
  writeFileSync(join(__dirname, `${base}.md`), report + "\n");
  console.log(report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
