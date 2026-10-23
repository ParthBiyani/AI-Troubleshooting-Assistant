import type { LlmAnswer } from "@/lib/llm/schema";

export interface ValidationResult {
  answer: LlmAnswer;
  /** Human-readable list of everything we removed or rejected. */
  issues: string[];
  /** True when nothing usable survived and the caller should show raw entries. */
  failed: boolean;
}

/**
 * The model may only cite entries it was shown and only name teams that exist.
 * Anything else is dropped here, in code, rather than trusted to the prompt.
 */
export function validateAnswer(
  raw: LlmAnswer,
  retrievedIds: Set<string>,
  teamCodes: Set<string>,
): ValidationResult {
  const issues: string[] = [];
  const keep = <T extends { source_id: string }>(items: T[], label: string): T[] =>
    items.filter((item) => {
      const ok = retrievedIds.has(item.source_id);
      if (!ok) issues.push(`Dropped ${label} citing "${item.source_id}", which was not retrieved.`);
      return ok;
    });

  const answer: LlmAnswer = {
    ...raw,
    likely_causes: keep(raw.likely_causes, "cause"),
    checks: keep(raw.checks, "check"),
    resolution: keep(raw.resolution, "resolution step"),
    escalation: null,
    used_entry_ids: raw.used_entry_ids.filter((id) => retrievedIds.has(id)),
  };

  if (raw.escalation) {
    if (!teamCodes.has(raw.escalation.team_code)) {
      issues.push(`Dropped escalation to unknown team "${raw.escalation.team_code}".`);
    } else if (!retrievedIds.has(raw.escalation.source_id)) {
      issues.push(
        `Dropped escalation citing "${raw.escalation.source_id}", which was not retrieved.`,
      );
    } else {
      answer.escalation = raw.escalation;
    }
  }

  const grounded =
    answer.checks.length + answer.resolution.length + answer.likely_causes.length > 0;
  const failed =
    answer.mode === "answer"
      ? !grounded
      : answer.mode === "clarify" && answer.clarifying_questions.length === 0;

  return { answer, issues, failed };
}
