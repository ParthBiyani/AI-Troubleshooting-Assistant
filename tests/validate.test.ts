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
  escalations: [
    { team_code: "PPE", when: "w", source_id: "KB-PAY-002" },
    { team_code: "ABP", when: "bank side", source_id: "KB-PAY-002" },
  ],
  attach: ["a"],
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
      { ...base, escalations: [{ team_code: "MADE-UP", when: "w", source_id: "KB-PAY-002" }] },
      retrieved,
      teams,
    );
    expect(r.answer.escalations).toEqual([]);
    expect(r.issues.join(" ")).toContain("MADE-UP");
  });

  it("drops escalations citing entries that were not retrieved", () => {
    const r = validateAnswer(
      { ...base, escalations: [{ team_code: "PPE", when: "w", source_id: "KB-XXX-999" }] },
      retrieved,
      teams,
    );
    expect(r.answer.escalations).toEqual([]);
  });

  it("keeps every valid escalation route, in order", () => {
    // ABP is not in this test's directory, so only PPE survives; both are kept when listed.
    const both = validateAnswer(base, retrieved, new Set(["PPE", "ABP"]));
    expect(both.answer.escalations.map((e) => e.team_code)).toEqual(["PPE", "ABP"]);
    expect(
      validateAnswer(base, retrieved, teams).answer.escalations.map((e) => e.team_code),
    ).toEqual(["PPE"]);
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
