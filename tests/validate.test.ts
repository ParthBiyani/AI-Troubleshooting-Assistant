import { describe, expect, it } from "vitest";
import { validateAnswer } from "@/lib/guards/validate";
import type { LlmAnswer } from "@/lib/llm/schema";

const base: LlmAnswer = {
  mode: "answer",
  summary: "s",
  likely_causes: [{ text: "c", source_id: "KB-PAY-002" }],
  checks: [
    { step: "ok", level: "L1", source_id: "KB-PAY-002" },
    { step: "invented", level: "L2", source_id: "KB-XXX-999" },
  ],
  resolution: [{ text: "r", source_id: "KB-PAY-002" }],
  escalation: { team_code: "PPE", when: "w", attach: ["a"], source_id: "KB-PAY-002" },
  priority: "P2",
  clarifying_questions: [],
  used_entry_ids: ["KB-PAY-002", "KB-XXX-999"],
};

const retrieved = new Set(["KB-PAY-002", "KB-PAY-001"]);
const teams = new Set(["PPE", "SRE"]);

describe("validateAnswer", () => {
  it("drops steps citing entries that were not retrieved", () => {
    const r = validateAnswer(base, retrieved, teams);
    expect(r.answer.checks.map((c) => c.step)).toEqual(["ok"]);
    expect(r.answer.used_entry_ids).toEqual(["KB-PAY-002"]);
    expect(r.issues.length).toBeGreaterThan(0);
    expect(r.failed).toBe(false);
  });

  it("drops escalations to teams outside the directory", () => {
    const r = validateAnswer(
      { ...base, escalation: { ...base.escalation!, team_code: "MADE-UP" } },
      retrieved,
      teams,
    );
    expect(r.answer.escalation).toBeNull();
  });

  it("keeps a valid escalation", () => {
    expect(validateAnswer(base, retrieved, teams).answer.escalation?.team_code).toBe("PPE");
  });

  it("fails when nothing grounded survives in answer mode", () => {
    const r = validateAnswer(
      {
        ...base,
        likely_causes: [],
        resolution: [],
        checks: [{ step: "x", level: "L1", source_id: "KB-NOPE-001" }],
      },
      retrieved,
      teams,
    );
    expect(r.failed).toBe(true);
  });

  it("fails a clarify answer with no questions", () => {
    const r = validateAnswer(
      { ...base, mode: "clarify", clarifying_questions: [] },
      retrieved,
      teams,
    );
    expect(r.failed).toBe(true);
  });
});
