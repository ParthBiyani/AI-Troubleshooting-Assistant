import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { LlmAnswer } from "../lib/llm/schema";
import type { KbEntry } from "../lib/kb/types";
import { formatEntry } from "../lib/llm/prompts";

/**
 * A different model than the answer writer, so it is not grading its own work.
 * Format: provider:model, same as LLM_MODELS.
 */
export const JUDGE_MODEL = process.env.JUDGE_MODEL ?? "groq:openai/gpt-oss-20b";

function judgeModel() {
  const [provider, ...rest] = JUDGE_MODEL.split(":");
  const id = rest.join(":");
  return provider === "google"
    ? createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })(id)
    : createGroq({ apiKey: process.env.GROQ_API_KEY })(id);
}

const verdictSchema = z.object({
  statements: z.array(
    z.object({
      id: z.number(),
      supported: z.boolean().describe("True only if the entries say this or something equivalent."),
      reason: z.string().describe("One short sentence."),
    }),
  ),
});

export interface JudgeResult {
  total: number;
  supported: number;
  unsupported: { text: string; reason: string }[];
}

export function listStatements(a: LlmAnswer): string[] {
  return [
    ...a.likely_causes.map((c) => `Cause: ${c.text}`),
    ...a.checks.map((c) => `Check (${c.level}): ${c.step}`),
    ...a.resolution.map((r) => `Resolution: ${r.text}`),
    ...(a.escalation
      ? [
          `Escalation: to ${a.escalation.team_code}. ${a.escalation.when}.${
            a.escalation.attach.length ? ` Attach: ${a.escalation.attach.join("; ")}` : ""
          }`,
        ]
      : []),
  ];
}

export async function judgeGroundedness(
  answer: LlmAnswer,
  entries: KbEntry[],
): Promise<JudgeResult> {
  const statements = listStatements(answer);
  if (statements.length === 0) return { total: 0, supported: 0, unsupported: [] };

  const { output } = await generateText({
    model: judgeModel(),
    temperature: 0,
    output: Output.object({ schema: verdictSchema }),
    system:
      "You are a strict fact checker. For each numbered statement, decide whether the knowledge base entries support it. " +
      "A statement is supported only if the entries state it or clearly imply it. Added detail, invented steps, invented " +
      "thresholds or a wrong support level (L1 vs L2) make it unsupported.",
    prompt: `<entries>\n${entries.map(formatEntry).join("\n")}\n</entries>\n\n<statements>\n${statements
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n")}\n</statements>`,
  });

  const unsupported = output.statements
    .filter((v) => !v.supported)
    .map((v) => ({ text: statements[v.id - 1] ?? `#${v.id}`, reason: v.reason }));
  return {
    total: statements.length,
    supported: statements.length - unsupported.length,
    unsupported,
  };
}
