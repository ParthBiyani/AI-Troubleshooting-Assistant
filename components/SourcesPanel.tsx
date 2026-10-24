"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AskResponse } from "@/lib/pipeline";

export const MANUAL_PDF = "/Northwind_Support_Knowledge_Manual.pdf";

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
      <p className="text-sm text-zinc-500">
        Knowledge base entries used for an answer appear here, with their retrieval scores.
      </p>
    );
  }

  const opened = response.sources.find((s) => s.entry.id === openId);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Sources</h2>
      {response.sources.length === 0 && (
        <p className="text-sm text-zinc-500">
          No knowledge base entries were retrieved for this message.
        </p>
      )}

      {response.sources.map(({ entry, retrieval, usedAsContext }) => (
        <button
          key={entry.id}
          onClick={() => onOpen(openId === entry.id ? null : entry.id)}
          className={`block w-full rounded-lg border p-3 text-left text-sm transition hover:border-zinc-400 ${
            openId === entry.id
              ? "border-zinc-900 dark:border-zinc-200"
              : "border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-zinc-500">{entry.id}</span>
            {usedAsContext && (
              <span className="rounded bg-zinc-100 px-1.5 text-[10px] uppercase dark:bg-zinc-800">
                used by AI
              </span>
            )}
          </div>
          <div className="mt-0.5 font-medium">{entry.title}</div>
          <div className="mt-1 text-xs text-zinc-500">
            {entry.owningTeam} · {entry.defaultPriority.split(" ")[0]}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-zinc-500">
            <span>fused {retrieval.fusedScore.toFixed(4)}</span>
            <span>keyword {retrieval.bm25Score?.toFixed(0) ?? "–"}</span>
            <span>semantic {retrieval.denseScore?.toFixed(3) ?? "–"}</span>
          </div>
          {retrieval.matchedTerms.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {retrieval.matchedTerms.slice(0, 8).map((t) => (
                <mark
                  key={t}
                  className="rounded bg-yellow-100 px-1 text-[11px] dark:bg-yellow-900/50 dark:text-yellow-100"
                >
                  {t}
                </mark>
              ))}
            </div>
          )}
        </button>
      ))}

      {opened && (
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Full entry</h3>
            <a
              href={MANUAL_PDF}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline"
            >
              View in manual (PDF)
            </a>
          </div>
          <div className="prose-sm max-w-none space-y-2 text-sm [&_h3]:text-base [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_table]:my-2 [&_table]:w-full [&_td]:border [&_td]:border-zinc-200 [&_td]:p-1 [&_th]:border [&_th]:border-zinc-200 [&_th]:p-1 dark:[&_td]:border-zinc-700 dark:[&_th]:border-zinc-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{opened.entry.markdown}</ReactMarkdown>
          </div>
        </div>
      )}

      {showInternals && (
        <div className="rounded-lg border border-dashed border-zinc-300 p-3 text-xs dark:border-zinc-700">
          <h3 className="mb-1 font-semibold">Under the hood</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <dt className="text-zinc-500">Gate decision</dt>
            <dd>{response.gate.decision}</dd>
            <dt className="text-zinc-500">Reason</dt>
            <dd>{response.gate.reason}</dd>
            <dt className="text-zinc-500">Best semantic</dt>
            <dd>
              {response.gate.signals.maxDense?.toFixed(3) ?? "n/a"} (refuse below{" "}
              {response.gate.thresholds.denseFloor})
            </dd>
            <dt className="text-zinc-500">Top entry semantic</dt>
            <dd>
              {response.gate.signals.topEntryDense?.toFixed(3) ?? "n/a"} (confident at or above{" "}
              {response.gate.thresholds.denseAnswer})
            </dd>
            <dt className="text-zinc-500">Top entry keyword</dt>
            <dd>
              {response.gate.signals.topEntryBm25.toFixed(0)} (confident at or above{" "}
              {response.gate.thresholds.keywordAnswer})
            </dd>
            <dt className="text-zinc-500">Model</dt>
            <dd>
              {response.meta.model
                ? `${response.meta.provider}:${response.meta.model}`
                : "not called"}
            </dd>
            <dt className="text-zinc-500">Prompt</dt>
            <dd>{response.meta.promptVersion}</dd>
            <dt className="text-zinc-500">Tokens</dt>
            <dd>
              {response.meta.tokens
                ? `${response.meta.tokens.input ?? "?"} in / ${response.meta.tokens.output ?? "?"} out`
                : "–"}
            </dd>
            <dt className="text-zinc-500">Latency</dt>
            <dd>
              {response.meta.latencyMs} ms{response.meta.cached ? " (cached)" : ""}
            </dd>
            <dt className="text-zinc-500">Semantic search</dt>
            <dd>{response.meta.denseAvailable ? "available" : "unavailable, keyword only"}</dd>
            <dt className="text-zinc-500">Injection guard</dt>
            <dd>
              {response.guards.injection.flagged ? "flagged" : "clear"} (
              {response.guards.injection.source})
            </dd>
            {response.guards.validationIssues.length > 0 && (
              <>
                <dt className="text-zinc-500">Validator</dt>
                <dd>{response.guards.validationIssues.join(" ")}</dd>
              </>
            )}
            {response.meta.modelAttempts.length > 0 && (
              <>
                <dt className="text-zinc-500">Fallbacks</dt>
                <dd>
                  {response.meta.modelAttempts.map((a) => `${a.model}: ${a.error}`).join(" | ")}
                </dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
