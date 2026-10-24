"use client";

import {
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  ExternalLink,
  FileSearch,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AskResponse } from "@/lib/pipeline";
import { meaningfulTerms } from "@/lib/ui-text";
import { MANUAL_PDF, PriorityBadge, ScoreBar, SectionTitle, UsedByAi } from "./ui";

function SourceCard({
  source,
  rank,
  open,
  onToggle,
  question,
}: {
  source: AskResponse["sources"][number];
  rank: number;
  open: boolean;
  onToggle: () => void;
  question: string;
}) {
  const { entry, retrieval, usedAsContext } = source;
  // Chats reopened from history keep only a slim copy of each entry; fetch the full text on demand.
  const [markdown, setMarkdown] = useState(entry.markdown);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    if (!open || markdown || loadFailed) return;
    let cancelled = false;
    fetch(`/api/entries/${entry.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { markdown: string }) => !cancelled && setMarkdown(j.markdown))
      .catch(() => !cancelled && setLoadFailed(true));
    return () => {
      cancelled = true;
    };
  }, [open, markdown, loadFailed, entry.id]);
  const priority = entry.defaultPriority.slice(0, 2);
  return (
    <div
      id={`source-${entry.id}`}
      className={`overflow-hidden rounded-xl border bg-surface transition ${
        open ? "border-brand shadow-card" : "border-line hover:border-muted/60"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="block w-full p-3.5 text-left"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-surface-2 text-xs font-bold text-muted">
            {rank}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-xs text-muted">{entry.id}</span>
              {usedAsContext && <UsedByAi />}
              <ChevronDown
                size={16}
                aria-hidden
                className={`ml-auto shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
              />
            </div>
            <div className="mt-1 text-[15px] font-semibold leading-snug">{entry.title}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>{entry.owningTeam}</span>
              {/^P[1-4]$/.test(priority) && <PriorityBadge priority={priority} />}
            </div>
            <div className="mt-3 space-y-1.5">
              <ScoreBar
                label="Semantic"
                value={retrieval.denseScore}
                max={1}
                display={retrieval.denseScore?.toFixed(3) ?? "–"}
              />
              <ScoreBar
                label="Keyword"
                value={retrieval.bm25Score}
                max={1200}
                display={retrieval.bm25Score?.toFixed(0) ?? "–"}
                tone="accent"
              />
            </div>
            {meaningfulTerms(retrieval.matchedTerms, question).length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {meaningfulTerms(retrieval.matchedTerms, question)
                  .slice(0, 8)
                  .map((t) => (
                    <mark
                      key={t}
                      className="rounded bg-warn-soft px-1.5 py-px text-[11px] font-medium text-warn"
                    >
                      {t}
                    </mark>
                  ))}
              </div>
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-line bg-canvas/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Full entry
            </span>
            <a
              href={MANUAL_PDF}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              View in manual (PDF) <ExternalLink size={12} aria-hidden />
            </a>
          </div>
          <div className="entry-md">
            {markdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            ) : loadFailed ? (
              <p className="text-muted">The full entry could not be loaded. Try again later.</p>
            ) : (
              <div className="space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-5/6" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------- pipeline view */
type StepState = "done" | "skipped" | "failed";
function Step({ state, title, detail }: { state: StepState; title: string; detail: string }) {
  const icon =
    state === "done" ? (
      <CheckCircle2 size={16} className="text-ok" aria-hidden />
    ) : state === "failed" ? (
      <XCircle size={16} className="text-bad" aria-hidden />
    ) : (
      <MinusCircle size={16} className="text-muted" aria-hidden />
    );
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 text-[13px] leading-snug">
        <div className="font-semibold">{title}</div>
        <div className="mt-0.5 text-muted">{detail}</div>
      </div>
    </li>
  );
}

function UnderTheHood({ response }: { response: AskResponse }) {
  const { gate, guards, meta } = response;
  const modelCalled = meta.model !== null;
  const t = gate.thresholds;
  return (
    <section className="animate-fade-up rounded-xl border border-dashed border-line bg-surface p-4">
      <SectionTitle icon={<FileSearch size={16} aria-hidden />}>Under the hood</SectionTitle>
      <ol className="space-y-3">
        <Step
          state={guards.injection.flagged ? "failed" : "done"}
          title="Guards"
          detail={`${
            guards.piiFindings.length
              ? `Masked ${guards.piiFindings.join(", ")}. `
              : "No sensitive data found. "
          }Injection check: ${guards.injection.flagged ? "flagged" : "clear"} (${guards.injection.source}).`}
        />
        <Step
          state={meta.denseAvailable ? "done" : "failed"}
          title="Retrieval"
          detail={`${response.sources.length} candidates, ${
            meta.denseAvailable
              ? "keyword and semantic search fused"
              : "keyword only (semantic search unavailable)"
          }.`}
        />
        <Step
          state="done"
          title={`Gate: ${gate.decision === "clarify" ? "uncertain" : gate.decision === "answer" ? "confident" : "refuse"}`}
          detail={`${gate.reason} Best semantic ${gate.signals.maxDense?.toFixed(3) ?? "n/a"} (refuse below ${t.denseFloor}); top entry semantic ${
            gate.signals.topEntryDense?.toFixed(3) ?? "n/a"
          } (confident at ${t.denseAnswer}) and keyword ${gate.signals.topEntryBm25.toFixed(0)} (at ${t.keywordAnswer}).`}
        />
        <Step
          state={modelCalled ? "done" : "skipped"}
          title="Model"
          detail={
            modelCalled
              ? `${meta.provider}:${meta.model}, prompt ${meta.promptVersion}, ${
                  meta.tokens
                    ? `${meta.tokens.input ?? "?"} tokens in / ${meta.tokens.output ?? "?"} out`
                    : "tokens n/a"
                }.${meta.modelAttempts.length ? ` Fell back after: ${meta.modelAttempts.map((a) => a.model).join(", ")}.` : ""}`
              : gate.decision === "not_in_kb"
                ? "Not called: nothing in the KB was close."
                : "Not available; raw entries shown instead."
          }
        />
        <Step
          state={guards.validationIssues.length ? "failed" : modelCalled ? "done" : "skipped"}
          title="Validation"
          detail={
            guards.validationIssues.length
              ? guards.validationIssues.join(" ")
              : modelCalled
                ? "Every citation and team checked against what was retrieved."
                : "Nothing to validate."
          }
        />
      </ol>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-muted">
        <span>
          {meta.latencyMs} ms{meta.cached ? " (cached)" : ""}
        </span>
        <span>prompt {meta.promptVersion}</span>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- panel */
export function SourcesPanel({
  response,
  openId,
  onOpen,
  showInternals,
}: {
  response: AskResponse | null;
  openId: string | null;
  onOpen: (id: string | null) => void;
  showInternals: boolean;
}) {
  if (!response) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-6 text-center">
        <CircleDashed className="mx-auto mb-3 text-muted" size={28} aria-hidden />
        <h2 className="text-sm font-semibold">Sources appear here</h2>
        <p className="mt-1 text-sm text-muted">
          Every answer lists the manual entries it came from, with retrieval scores, so you can
          check it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Sources</h2>
        <span className="text-xs text-muted">{response.sources.length} retrieved</span>
      </div>

      {response.sources.length === 0 && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
          Nothing was retrieved for this message.
        </p>
      )}

      {response.sources.map((s, i) => (
        <SourceCard
          key={s.entry.id}
          source={s}
          rank={i + 1}
          open={openId === s.entry.id}
          onToggle={() => onOpen(openId === s.entry.id ? null : s.entry.id)}
          question={response.guards.maskedQuestion}
        />
      ))}

      {showInternals && <UnderTheHood response={response} />}
    </div>
  );
}
