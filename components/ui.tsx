"use client";

import { Ban, CircleHelp, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { AskResponse } from "@/lib/pipeline";

export const MANUAL_PDF = "/Northwind_Support_Knowledge_Manual.pdf";

/* ------------------------------------------------------------- mode badge */
const MODE: Record<
  AskResponse["mode"],
  { label: string; icon: ReactNode; cls: string; hint: string }
> = {
  answer: {
    label: "Answer from KB",
    icon: <ShieldCheck size={14} aria-hidden />,
    cls: "bg-ok-soft text-ok",
    hint: "Grounded in the cited knowledge base entries",
  },
  clarify: {
    label: "Need more info",
    icon: <CircleHelp size={14} aria-hidden />,
    cls: "bg-warn-soft text-warn",
    hint: "Several entries are plausible; more detail is needed",
  },
  not_in_kb: {
    label: "Not in KB",
    icon: <Ban size={14} aria-hidden />,
    cls: "bg-bad-soft text-bad",
    hint: "The knowledge base does not cover this",
  },
};

export function ModeBadge({
  mode,
  degraded = false,
}: {
  mode: AskResponse["mode"];
  /** True when the model produced nothing usable and only raw entries are shown. */
  degraded?: boolean;
}) {
  const m = degraded
    ? {
        label: "Closest entries",
        icon: <TriangleAlert size={14} aria-hidden />,
        cls: "bg-warn-soft text-warn",
        hint: "The AI summary was unavailable, so the retrieved entries are shown as written",
      }
    : MODE[mode];
  return (
    <span
      title={m.hint}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

/* --------------------------------------------------------- priority badge */
const PRIORITY: Record<string, { label: string; cls: string }> = {
  P1: { label: "Critical", cls: "bg-bad-soft text-bad" },
  P2: { label: "High", cls: "bg-warn-soft text-warn" },
  P3: { label: "Medium", cls: "bg-info-soft text-info" },
  P4: { label: "Low", cls: "bg-surface-2 text-muted" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITY[priority] ?? PRIORITY.P4;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${p.cls}`}
    >
      {priority}
      <span className="font-medium opacity-80">{p.label}</span>
    </span>
  );
}

/* ----------------------------------------------------------- level pill */
export function LevelPill({ level }: { level: "L1" | "L2" }) {
  return (
    <span
      title={level === "L1" ? "Can be run by L1 support" : "Needs L2 / production read access"}
      className={`inline-flex h-5 min-w-8 items-center justify-center rounded-md px-1.5 text-[11px] font-bold tracking-wide ${
        level === "L1" ? "bg-info-soft text-info" : "bg-brand-soft text-brand"
      }`}
    >
      {level}
    </span>
  );
}

/* ----------------------------------------------------------- source chip */
export function SourceChip({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(id)}
      title={`Open ${id}`}
      className="ml-1.5 inline-flex items-center rounded-md border border-line bg-surface-2 px-1.5 py-px align-middle font-mono text-[11px] text-muted transition hover:border-brand hover:text-brand"
    >
      {id}
    </button>
  );
}

/* --------------------------------------------------------- team avatar */
export function TeamAvatar({ code }: { code: string }) {
  const initials = code.replace(/[^A-Z0-9]/g, "").slice(0, 3);
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-xs font-bold text-brand-ink"
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------ score bar */
export function ScoreBar({
  label,
  value,
  max,
  display,
  tone = "brand",
}: {
  label: string;
  value: number | null;
  max: number;
  display: string;
  tone?: "brand" | "accent";
}) {
  const pct = value === null ? 0 : Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-[11px] text-muted">
      <span>{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <span
          className={`block h-full rounded-full ${tone === "brand" ? "bg-brand" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-right font-mono tabular-nums">{display}</span>
    </div>
  );
}

/* ---------------------------------------------------------- used by AI */
export function UsedByAi() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
      <Sparkles size={10} aria-hidden />
      Used by AI
    </span>
  );
}

/* --------------------------------------------------------- section title */
export function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h4 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
      <span className="text-brand">{icon}</span>
      {children}
    </h4>
  );
}

/* ----------------------------------------------- inline markdown in text */
/** Entries use `code` and *emphasis*; render those instead of showing the marks. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 2 ? (
          <code
            key={i}
            className="rounded bg-surface-2 px-1 py-px font-mono text-[0.85em] text-brand"
          >
            {p.slice(1, -1)}
          </code>
        ) : p.startsWith("**") && p.endsWith("**") && p.length > 4 ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? (
          <em key={i}>{p.slice(1, -1)}</em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
