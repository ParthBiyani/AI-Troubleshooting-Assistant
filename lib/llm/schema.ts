import { z } from "zod";

const sourceId = z.string().describe("ID of the KB entry this item came from, e.g. KB-PAY-002");

export const answerSchema = z.object({
  mode: z.enum(["answer", "clarify", "not_in_kb"]),
  summary: z
    .string()
    .describe("One or two sentences restating the issue and the most likely explanation."),
  likely_causes: z.array(z.object({ text: z.string(), source_id: sourceId })),
  checks: z.array(z.object({ step: z.string(), level: z.enum(["L1", "L2"]), source_id: sourceId })),
  resolution: z.array(z.object({ text: z.string(), source_id: sourceId })),
  escalations: z
    .array(
      z.object({
        team_code: z.string().describe("Team code from the escalation directory, e.g. PPE"),
        when: z
          .string()
          .describe("The condition under which to escalate to this team, from the entry."),
        source_id: sourceId,
      }),
    )
    .describe("Every escalation route the entry lists, one item per team."),
  attach: z
    .array(z.string())
    .describe("The evidence to attach, as listed in the entry's Escalation section."),
  priority: z.enum(["P1", "P2", "P3", "P4"]).nullable(),
  clarifying_questions: z.array(z.string()),
  used_entry_ids: z.array(z.string()),
});

export type LlmAnswer = z.infer<typeof answerSchema>;
