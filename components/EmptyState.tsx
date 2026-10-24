"use client";

import { Ban, CircleHelp, Lock, ShieldCheck, ShieldHalf, ListTree } from "lucide-react";
import type { ReactNode } from "react";
import { EXAMPLE_GROUPS, type ExampleGroup } from "./examples";

const ICON: Record<ExampleGroup["key"], ReactNode> = {
  kb: <ShieldCheck size={16} aria-hidden />,
  vague: <CircleHelp size={16} aria-hidden />,
  scope: <Ban size={16} aria-hidden />,
  guard: <Lock size={16} aria-hidden />,
};

const TONE: Record<ExampleGroup["key"], string> = {
  kb: "bg-ok-soft text-ok",
  vague: "bg-warn-soft text-warn",
  scope: "bg-bad-soft text-bad",
  guard: "bg-info-soft text-info",
};

const PRINCIPLES = [
  {
    icon: <ListTree size={18} aria-hidden />,
    title: "Grounded",
    text: "Every step cites the manual entry it came from, and code removes any citation that was not retrieved.",
  },
  {
    icon: <ShieldHalf size={18} aria-hidden />,
    title: "Honest when unsure",
    text: "Unclear issues get follow-up questions. Issues outside the manual are refused, never invented.",
  },
  {
    icon: <Lock size={18} aria-hidden />,
    title: "Private",
    text: "Card numbers, OTPs and CVVs are masked before anything is stored or sent to a model.",
  },
];

export function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="animate-fade-up">
      <div className="pb-8 pt-6 text-center sm:pt-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What is broken?</h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Describe an issue in plain language. TriageGPT searches the support manual, writes the
          checks and escalation, and shows exactly which entry each step came from.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXAMPLE_GROUPS.map((g) => (
          <section
            key={g.key}
            className="rounded-2xl border border-line bg-surface p-4 shadow-card"
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span className={`grid size-8 place-items-center rounded-lg ${TONE[g.key]}`}>
                {ICON[g.key]}
              </span>
              <div className="leading-tight">
                <h3 className="text-sm font-semibold">{g.label}</h3>
                <p className="text-xs text-muted">{g.blurb}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {g.chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onPick(c)}
                  className="rounded-lg border border-line bg-canvas/60 px-3 py-2 text-left text-[13px] leading-snug transition hover:border-brand hover:bg-brand-soft"
                >
                  {c}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="rounded-xl px-1 py-2 text-sm">
            <div className="mb-1 flex items-center gap-2 font-semibold text-brand">
              {p.icon}
              {p.title}
            </div>
            <p className="leading-relaxed text-muted">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
