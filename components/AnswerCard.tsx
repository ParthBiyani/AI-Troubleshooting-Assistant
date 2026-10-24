"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Lightbulb,
  ListChecks,
  MessageCircleQuestion,
  PhoneForwarded,
  SearchX,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import type { AskResponse } from "@/lib/pipeline";
import {
  Inline,
  LevelPill,
  ModeBadge,
  PriorityBadge,
  SectionTitle,
  SourceChip,
  TeamAvatar,
} from "./ui";
import { stripLevelTag } from "@/lib/ui-text";

/** Plain-text version of an answer, for pasting into a ticket. */
export function toTicketNote(response: AskResponse): string {
  const a = response.answer;
  if (!a) return response.message;
  const lines: string[] = [a.summary, ""];
  if (a.priority) lines.push(`Priority: ${a.priority}`, "");
  if (a.clarifying_questions.length) {
    lines.push("Questions:", ...a.clarifying_questions.map((q) => `- ${q}`), "");
  }
  if (a.likely_causes.length) {
    lines.push(
      "Likely causes:",
      ...a.likely_causes.map((c, i) => `${i + 1}. ${c.text} [${c.source_id}]`),
      "",
    );
  }
  if (a.checks.length) {
    lines.push(
      "Checks:",
      ...a.checks.map((c, i) => `${i + 1}. (${c.level}) ${stripLevelTag(c.step)} [${c.source_id}]`),
      "",
    );
  }
  if (a.resolution.length) {
    lines.push("Resolution:", ...a.resolution.map((r) => `- ${r.text} [${r.source_id}]`), "");
  }
  if (a.escalations.length) {
    lines.push(
      "Escalation:",
      ...a.escalations.map(
        (e) =>
          `- ${response.teams[e.team_code] ?? e.team_code} (${e.team_code}): ${e.when} [${e.source_id}]`,
      ),
    );
    if (a.attach.length) lines.push(`Attach: ${a.attach.join("; ")}`);
    lines.push("");
  }
  lines.push(`Sources: ${a.used_entry_ids.join(", ")}`);
  return lines.join("\n").trim();
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          /* clipboard unavailable: leave the button as it was */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-muted transition hover:border-brand hover:text-brand"
    >
      {done ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {done ? "Copied" : "Copy as ticket note"}
    </button>
  );
}

export function AnswerCard({
  response,
  onOpenEntry,
}: {
  response: AskResponse;
  onOpenEntry: (id: string) => void;
}) {
  const { answer } = response;
  const modelUnavailable = !answer && response.mode !== "not_in_kb";
  const blocked = response.guards.injection.flagged;

  return (
    <article className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <ModeBadge mode={response.mode} degraded={modelUnavailable} />
        {answer?.priority && <PriorityBadge priority={answer.priority} />}
        {response.guards.piiFindings.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">
            <ShieldAlert size={13} aria-hidden />
            Masked: {response.guards.piiFindings.join(", ")}
          </span>
        )}
        <span className="ml-auto">
          <CopyButton text={toTicketNote(response)} />
        </span>
      </header>

      {response.mode === "not_in_kb" && (
        <div className="flex gap-3 rounded-xl bg-surface-2 p-4">
          {blocked ? (
            <ShieldAlert className="mt-0.5 shrink-0 text-bad" size={20} aria-hidden />
          ) : (
            <SearchX className="mt-0.5 shrink-0 text-bad" size={20} aria-hidden />
          )}
          <p className="text-[15px] leading-relaxed">{response.message}</p>
        </div>
      )}

      {modelUnavailable && (
        <div className="flex gap-3 rounded-xl bg-warn-soft p-4 text-warn">
          <AlertTriangle className="mt-0.5 shrink-0" size={20} aria-hidden />
          <p className="text-[15px] leading-relaxed">{response.message}</p>
        </div>
      )}

      {answer && (
        <div className="space-y-6">
          <p className="text-[17px] font-medium leading-snug">
            <Inline text={answer.summary} />
          </p>

          {answer.clarifying_questions.length > 0 && (
            <section>
              <SectionTitle icon={<MessageCircleQuestion size={16} aria-hidden />}>
                To narrow this down
              </SectionTitle>
              <ul className="space-y-2">
                {answer.clarifying_questions.map((q) => (
                  <li
                    key={q}
                    className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-[15px] text-ink"
                  >
                    {q}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">Reply below with the details.</p>
            </section>
          )}

          {answer.likely_causes.length > 0 && (
            <section>
              <SectionTitle icon={<Lightbulb size={16} aria-hidden />}>Likely causes</SectionTitle>
              <ol className="space-y-2">
                {answer.likely_causes.map((c, i) => (
                  <li key={c.text} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-muted">
                      {i + 1}
                    </span>
                    <span>
                      <Inline text={c.text} />
                      <SourceChip id={c.source_id} onOpen={onOpenEntry} />
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {answer.checks.length > 0 && (
            <section>
              <SectionTitle icon={<ListChecks size={16} aria-hidden />}>Checks</SectionTitle>
              <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[0.69rem] before:top-2 before:w-px before:bg-line">
                {answer.checks.map((c, i) => (
                  <li key={c.step} className="relative flex gap-3 text-[15px] leading-relaxed">
                    <span className="z-10 grid size-6 shrink-0 place-items-center rounded-full border border-line bg-surface text-[11px] font-semibold text-muted">
                      {i + 1}
                    </span>
                    <span className="min-w-0 pt-px">
                      <LevelPill level={c.level} />{" "}
                      <span className="ml-1">
                        <Inline text={stripLevelTag(c.step)} />
                      </span>
                      <SourceChip id={c.source_id} onOpen={onOpenEntry} />
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {answer.resolution.length > 0 && (
            <section>
              <SectionTitle icon={<Wrench size={16} aria-hidden />}>Resolution</SectionTitle>
              <ul className="space-y-2">
                {answer.resolution.map((r) => (
                  <li key={r.text} className="flex gap-3 text-[15px] leading-relaxed">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-ok" size={18} aria-hidden />
                    <span>
                      <Inline text={r.text} />
                      <SourceChip id={r.source_id} onOpen={onOpenEntry} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {answer.escalations.length > 0 && (
            <section>
              <SectionTitle icon={<PhoneForwarded size={16} aria-hidden />}>
                Escalation
              </SectionTitle>
              <div className="overflow-hidden rounded-xl border border-line bg-surface-2/60">
                <ul className="divide-y divide-line">
                  {answer.escalations.map((e) => (
                    <li key={e.team_code + e.when} className="flex gap-3 p-3.5">
                      <TeamAvatar code={e.team_code} />
                      <div className="min-w-0 text-[15px] leading-snug">
                        <div className="font-semibold">
                          {response.teams[e.team_code] ?? e.team_code}{" "}
                          <span className="font-mono text-xs font-medium text-muted">
                            {e.team_code}
                          </span>
                        </div>
                        <div className="mt-0.5 text-muted">
                          <Inline text={e.when} />
                          <SourceChip id={e.source_id} onOpen={onOpenEntry} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {answer.attach.length > 0 && (
                  <div className="border-t border-line bg-surface p-3.5">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      Attach to the ticket
                    </div>
                    <ul className="flex flex-wrap gap-1.5">
                      {answer.attach.map((a) => (
                        <li key={a} className="rounded-md bg-surface-2 px-2 py-1 text-[13px]">
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
