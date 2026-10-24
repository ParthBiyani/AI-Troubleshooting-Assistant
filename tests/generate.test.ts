import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LlmAnswer } from "@/lib/llm/schema";

const generateTextMock = vi.fn();
vi.mock("ai", () => ({ generateText: generateTextMock, Output: { object: (o: unknown) => o } }));
vi.mock("@ai-sdk/groq", () => ({ createGroq: () => (id: string) => ({ id }) }));
vi.mock("@ai-sdk/google", () => ({ createGoogleGenerativeAI: () => (id: string) => ({ id }) }));

const full: LlmAnswer = {
  mode: "answer",
  summary: "s",
  likely_causes: [{ text: "c", source_id: "KB-PAY-002" }],
  checks: [],
  resolution: [],
  escalations: [],
  attach: [],
  priority: null,
  clarifying_questions: [],
  used_entry_ids: [],
};
const empty: LlmAnswer = { ...full, likely_causes: [] };
const usage = { inputTokens: 10, outputTokens: 5 };

beforeEach(() => {
  generateTextMock.mockReset();
  vi.stubEnv("GROQ_API_KEY", "k");
  vi.stubEnv("GEMINI_API_KEY", "k");
  vi.stubEnv("LLM_MODELS", "groq:small,groq:big,google:last");
});

describe("generateAnswer fallback chain", () => {
  it("moves on when a model returns a schema-valid but empty answer", async () => {
    const { generateAnswer } = await import("@/lib/llm/generate");
    generateTextMock
      .mockResolvedValueOnce({ output: empty, usage })
      .mockResolvedValueOnce({ output: full, usage });
    const r = await generateAnswer("sys", "prompt");
    expect(r.spec.model).toBe("big");
    expect(r.failedAttempts).toEqual([
      expect.objectContaining({
        spec: { provider: "groq", model: "small" },
        error: "Returned an empty answer",
      }),
    ]);
  });

  it("moves on after an API error such as a rate limit", async () => {
    const { generateAnswer } = await import("@/lib/llm/generate");
    generateTextMock
      .mockRejectedValueOnce(new Error("429 rate limit"))
      .mockResolvedValueOnce({ output: full, usage });
    expect((await generateAnswer("s", "p")).spec.model).toBe("big");
  });

  it("accepts a refusal, which has no statements by design", async () => {
    const { generateAnswer } = await import("@/lib/llm/generate");
    generateTextMock.mockResolvedValueOnce({ output: { ...empty, mode: "not_in_kb" }, usage });
    expect((await generateAnswer("s", "p")).spec.model).toBe("small");
  });

  it("throws when every model fails or is empty", async () => {
    const { generateAnswer, AllModelsFailed } = await import("@/lib/llm/generate");
    generateTextMock.mockResolvedValue({ output: empty, usage });
    await expect(generateAnswer("s", "p")).rejects.toBeInstanceOf(AllModelsFailed);
  });
});

describe("isUsableAnswer", () => {
  it("requires questions for clarify and grounded statements for answer", async () => {
    const { isUsableAnswer } = await import("@/lib/llm/generate");
    expect(isUsableAnswer({ ...empty, mode: "clarify" })).toBe(false);
    expect(isUsableAnswer({ ...empty, mode: "clarify", clarifying_questions: ["q"] })).toBe(true);
    expect(isUsableAnswer(empty)).toBe(false);
    expect(isUsableAnswer(full)).toBe(true);
  });
});
