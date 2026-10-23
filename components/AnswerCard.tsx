import type { AskResponse } from "@/lib/pipeline";

const MODE_STYLE: Record<AskResponse["mode"], { label: string; cls: string }> = {
  answer: {
    label: "Answer from KB",
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  clarify: {
    label: "Need more info",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  not_in_kb: {
    label: "Not in KB",
    cls: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
};

function SourceChip({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  return (
    <button
      onClick={() => onOpen(id)}
      className="ml-1 rounded border border-zinc-300 px-1 font-mono text-[11px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      {id}
    </button>
  );
}

export function AnswerCard({
  response,
  teamName,
  onOpenEntry,
}: {
  response: AskResponse;
  teamName: (code: string) => string;
  onOpenEntry: (id: string) => void;
}) {
  const { answer } = response;
  const mode = MODE_STYLE[response.mode];

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${mode.cls}`}>
          {mode.label}
        </span>
        {answer?.priority && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium dark:bg-zinc-800">
            Priority {answer.priority}
          </span>
        )}
        {response.guards.piiFindings.length > 0 && (
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300">
            Masked: {response.guards.piiFindings.join(", ")}
          </span>
        )}
      </div>

      {response.message && <p className="text-zinc-700 dark:text-zinc-300">{response.message}</p>}

      {answer && (
        <>
          <p className="font-medium">{answer.summary}</p>

          {answer.clarifying_questions.length > 0 && (
            <div>
              <h4 className="mb-1 font-semibold">To narrow this down, please tell me:</h4>
              <ul className="list-disc space-y-1 pl-5">
                {answer.clarifying_questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {answer.likely_causes.length > 0 && (
            <div>
              <h4 className="mb-1 font-semibold">Likely causes</h4>
              <ol className="list-decimal space-y-1 pl-5">
                {answer.likely_causes.map((c) => (
                  <li key={c.text}>
                    {c.text}
                    <SourceChip id={c.source_id} onOpen={onOpenEntry} />
                  </li>
                ))}
              </ol>
            </div>
          )}

          {answer.checks.length > 0 && (
            <div>
              <h4 className="mb-1 font-semibold">Checks</h4>
              <ol className="list-decimal space-y-1.5 pl-5">
                {answer.checks.map((c) => (
                  <li key={c.step}>
                    <span
                      className={`mr-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                        c.level === "L1"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300"
                      }`}
                    >
                      {c.level}
                    </span>
                    {c.step}
                    <SourceChip id={c.source_id} onOpen={onOpenEntry} />
                  </li>
                ))}
              </ol>
            </div>
          )}

          {answer.resolution.length > 0 && (
            <div>
              <h4 className="mb-1 font-semibold">Resolution</h4>
              <ul className="list-disc space-y-1 pl-5">
                {answer.resolution.map((r) => (
                  <li key={r.text}>
                    {r.text}
                    <SourceChip id={r.source_id} onOpen={onOpenEntry} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {answer.escalation && (
            <div className="rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/40">
              <h4 className="font-semibold">
                Escalate to {teamName(answer.escalation.team_code)} ({answer.escalation.team_code})
                <SourceChip id={answer.escalation.source_id} onOpen={onOpenEntry} />
              </h4>
              <p className="mt-1">{answer.escalation.when}</p>
              {answer.escalation.attach.length > 0 && (
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Attach: {answer.escalation.attach.join("; ")}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
