import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateText, Output, type LanguageModel } from "ai";
import { answerSchema, type LlmAnswer } from "./schema";

export interface ModelSpec {
  provider: "groq" | "google";
  model: string;
}

/** Model ids change often, so the fallback chain lives in an env var. */
export const DEFAULT_CHAIN =
  "groq:openai/gpt-oss-120b,groq:qwen/qwen3.8-27b,groq:openai/gpt-oss-20b,google:gemini-3.5-flash-lite";

export function parseChain(raw = process.env.LLM_MODELS ?? DEFAULT_CHAIN): ModelSpec[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf(":");
      const provider = s.slice(0, i);
      if (provider !== "groq" && provider !== "google")
        throw new Error(`Unknown provider in "${s}"`);
      return { provider, model: s.slice(i + 1) };
    });
}

function resolveModel(spec: ModelSpec): LanguageModel | null {
  if (spec.provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    return apiKey ? createGroq({ apiKey })(spec.model) : null;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? createGoogleGenerativeAI({ apiKey })(spec.model) : null;
}

export interface GenerateResult {
  answer: LlmAnswer;
  spec: ModelSpec;
  /** Models tried before this one succeeded. */
  failedAttempts: { spec: ModelSpec; error: string }[];
  tokens: { input?: number; output?: number };
}

export class AllModelsFailed extends Error {
  constructor(public attempts: { spec: ModelSpec; error: string }[]) {
    super("All configured models failed or were unavailable.");
  }
}

/**
 * A schema-valid answer that says nothing (mode "answer" with no causes, checks or resolution,
 * or "clarify" with no questions) is a failed attempt, not a success. Smaller models do this.
 */
export function isUsableAnswer(a: LlmAnswer): boolean {
  if (a.mode === "not_in_kb") return true;
  if (a.mode === "clarify") return a.clarifying_questions.length > 0;
  return a.likely_causes.length + a.checks.length + a.resolution.length > 0;
}

/** Try each model in order. A 429, a schema failure or an empty answer moves on to the next one. */
export async function generateAnswer(system: string, prompt: string): Promise<GenerateResult> {
  const failedAttempts: GenerateResult["failedAttempts"] = [];

  for (const spec of parseChain()) {
    const model = resolveModel(spec);
    if (!model) {
      failedAttempts.push({ spec, error: "API key not configured" });
      continue;
    }
    try {
      const result = await generateText({
        model,
        system,
        prompt,
        temperature: 0.1,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(25_000),
        output: Output.object({ schema: answerSchema }),
      });
      if (!isUsableAnswer(result.output)) {
        failedAttempts.push({ spec, error: "Returned an empty answer" });
        continue;
      }
      return {
        answer: result.output,
        spec,
        failedAttempts,
        tokens: { input: result.usage?.inputTokens, output: result.usage?.outputTokens },
      };
    } catch (err) {
      failedAttempts.push({
        spec,
        error: err instanceof Error ? err.message.slice(0, 200) : String(err),
      });
    }
  }
  throw new AllModelsFailed(failedAttempts);
}
