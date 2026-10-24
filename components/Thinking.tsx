"use client";

import { useEffect, useState } from "react";

const STEPS = ["Masking sensitive data", "Searching the manual", "Writing the answer"];

/** Staged progress for the 2-6 seconds a request takes. The stages are timed, not reported by the server. */
export function Thinking() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [setTimeout(() => setStep(1), 900), setTimeout(() => setStep(2), 2200)];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card"
    >
      <ol className="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2 ${
              i < step ? "text-ok" : i === step ? "font-medium text-ink" : "text-muted/60"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                i < step ? "bg-ok" : i === step ? "animate-pulse-dot bg-brand" : "bg-line"
              }`}
            />
            {s}
          </li>
        ))}
      </ol>
      <div className="space-y-2.5">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-4 w-3/5" />
        <div className="skeleton mt-4 h-3 w-full" />
        <div className="skeleton h-3 w-11/12" />
        <div className="skeleton h-3 w-9/12" />
      </div>
    </div>
  );
}
