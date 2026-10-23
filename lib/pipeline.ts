import { TtlCache, queryKey } from "@/lib/cache";
import { checkInjection } from "@/lib/guards/injection";
import { maskPii } from "@/lib/guards/pii";
import { validateAnswer } from "@/lib/guards/validate";
import { corpus, getEntry, teamCodes } from "@/lib/kb/load";
import type { KbEntry } from "@/lib/kb/types";
import { AllModelsFailed, generateAnswer } from "@/lib/llm/generate";
import { PROMPT_VERSION, SYSTEM_PROMPT, buildUserMessage } from "@/lib/llm/prompts";
import type { LlmAnswer } from "@/lib/llm/schema";
import { decide, THRESHOLDS, type Decision, type GateResult } from "@/lib/retrieval/gate";
import { retrieve, type RetrievedEntry } from "@/lib/retrieval";

export const MAX_QUESTION_CHARS = 600;
/** Entries sent to the model. Kept small to stay inside Groq's tokens-per-minute limit. */
const CONTEXT_ENTRIES = 3;

export interface SourceCard {
  retrieval: RetrievedEntry;
  entry: KbEntry;
  /** True for the entries the model was actually shown. */
  usedAsContext: boolean;
}

export interface AskResponse {
  mode: Decision;
  /** Validated model output (answer and clarify modes). Null when we fall back to raw entries. */
  answer: LlmAnswer | null;
  /** Deterministic text shown instead of, or alongside, the model output. */
  message: string;
  sources: SourceCard[];
  gate: GateResult & { thresholds: typeof THRESHOLDS };
  guards: {
    maskedQuestion: string;
    piiFindings: string[];
    injection: { flagged: boolean; source: string };
    validationIssues: string[];
  };
  meta: {
    promptVersion: string;
    model: string | null;
    provider: string | null;
    modelAttempts: { model: string; error: string }[];
    tokens: { input?: number; output?: number } | null;
    latencyMs: number;
    cached: boolean;
    denseAvailable: boolean;
  };
}

const cache = new TtlCache<AskResponse>(10 * 60_000);

const emptyMeta = (start: number): AskResponse["meta"] => ({
  promptVersion: PROMPT_VERSION,
  model: null,
  provider: null,
  modelAttempts: [],
  tokens: null,
  latencyMs: Date.now() - start,
  cached: false,
  denseAvailable: true,
});

function toSources(hits: RetrievedEntry[], contextCount: number): SourceCard[] {
  return hits.flatMap((retrieval, i) => {
    const entry = getEntry(retrieval.id);
    return entry ? [{ retrieval, entry, usedAsContext: i < contextCount }] : [];
  });
}

const NOT_IN_KB_MESSAGE =
  "The knowledge base does not cover this issue, so no troubleshooting steps are suggested. " +
  "Raise a ticket to L2 Application Support (L2-APP) with the symptoms, affected merchant or MID, " +
  "error codes and the time window. Any entries shown below are only the closest matches and may not apply.";

const BLOCKED_MESSAGE =
  "This message looks like an attempt to change the assistant's instructions, so it was not processed. " +
  "Describe the technical issue you are seeing and I will search the knowledge base.";

const FALLBACK_MESSAGE =
  "The AI summary could not be produced or failed validation, so the closest knowledge base entries are shown as written.";

export async function ask(input: {
  question: string;
  previousQuestion?: string;
  useLlm?: boolean;
}): Promise<AskResponse> {
  const start = Date.now();
  const useLlm = input.useLlm ?? true;

  const masked = maskPii(input.question.slice(0, MAX_QUESTION_CHARS));
  const maskedPrevious = input.previousQuestion
    ? maskPii(input.previousQuestion.slice(0, MAX_QUESTION_CHARS)).text
    : "";
  const query = [maskedPrevious, masked.text].filter(Boolean).join(". ");

  const guards: AskResponse["guards"] = {
    maskedQuestion: masked.text,
    piiFindings: masked.findings,
    injection: { flagged: false, source: "none" },
    validationIssues: [],
  };

  const injection = await checkInjection(query);
  guards.injection = injection;
  if (injection.flagged) {
    return {
      mode: "not_in_kb",
      answer: null,
      message: BLOCKED_MESSAGE,
      sources: [],
      gate: {
        decision: "not_in_kb",
        reason: "Blocked by the prompt-injection guard before retrieval.",
        signals: { topDense: null, denseGap: null, topBm25: 0 },
        thresholds: THRESHOLDS,
      },
      guards,
      meta: emptyMeta(start),
    };
  }

  const cacheKey = `${useLlm}:${queryKey(query)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      guards: { ...cached.guards, piiFindings: masked.findings },
      meta: { ...cached.meta, cached: true, latencyMs: Date.now() - start },
    };
  }

  const { hits, denseAvailable } = await retrieve(query, "hybrid", 5);
  const gate = { ...decide(hits, denseAvailable), thresholds: THRESHOLDS };
  const meta = { ...emptyMeta(start), denseAvailable };

  let response: AskResponse;

  if (gate.decision === "not_in_kb") {
    // The model is deliberately not called: nothing it could add would be grounded.
    response = {
      mode: "not_in_kb",
      answer: null,
      message: NOT_IN_KB_MESSAGE,
      sources: toSources(hits.slice(0, 3), 0),
      gate,
      guards,
      meta: { ...meta, latencyMs: Date.now() - start },
    };
  } else {
    const sources = toSources(hits, CONTEXT_ENTRIES);
    const context = sources.filter((s) => s.usedAsContext);
    response = {
      mode: gate.decision,
      answer: null,
      message: FALLBACK_MESSAGE,
      sources,
      gate,
      guards,
      meta,
    };

    if (useLlm) {
      try {
        const result = await generateAnswer(
          SYSTEM_PROMPT,
          buildUserMessage({
            question: masked.text,
            mode: gate.decision,
            entries: context.map((s) => s.entry),
            teams: corpus.teams,
          }),
        );
        const validation = validateAnswer(
          result.answer,
          new Set(context.map((s) => s.entry.id)),
          teamCodes(),
        );
        guards.validationIssues = validation.issues;
        response.meta = {
          ...meta,
          model: result.spec.model,
          provider: result.spec.provider,
          modelAttempts: result.failedAttempts.map((a) => ({
            model: a.spec.model,
            error: a.error,
          })),
          tokens: result.tokens,
        };

        if (!validation.failed) {
          response.answer = validation.answer;
          // The model may be more conservative than the gate, never less.
          if (validation.answer.mode === "not_in_kb") {
            response.mode = "not_in_kb";
            response.message = NOT_IN_KB_MESSAGE;
            response.answer = null;
          } else {
            response.mode = validation.answer.mode === "clarify" ? "clarify" : gate.decision;
            response.message = "";
          }
        }
      } catch (err) {
        if (err instanceof AllModelsFailed) {
          response.meta.modelAttempts = err.attempts.map((a) => ({
            model: `${a.spec.provider}:${a.spec.model}`,
            error: a.error,
          }));
        } else {
          throw err;
        }
      }
    }
  }

  response.meta.latencyMs = Date.now() - start;
  // Only cache complete answers, not degraded fallbacks.
  if (response.answer || response.mode === "not_in_kb") cache.set(cacheKey, response);
  return response;
}
