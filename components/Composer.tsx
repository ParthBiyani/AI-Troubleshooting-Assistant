"use client";

import { ArrowUp, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

const MAX = 600;

export function Composer({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the content, up to a few lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  const canSend = value.trim().length >= 2 && !loading;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className="rounded-2xl border border-line bg-surface p-2 shadow-card transition focus-within:border-brand"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          value={value}
          rows={1}
          maxLength={MAX}
          disabled={loading}
          placeholder={placeholder}
          aria-label="Describe the issue"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSubmit();
            }
          }}
          className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted/70"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Ask"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <ArrowUp size={18} aria-hidden />
          )}
        </button>
      </div>
      <div className="flex items-center justify-between px-3 pb-1 pt-1 text-[11px] text-muted">
        <span>
          <kbd className="rounded border border-line bg-surface-2 px-1 font-mono">Enter</kbd> to
          send · <kbd className="rounded border border-line bg-surface-2 px-1 font-mono">Shift</kbd>
          +<kbd className="rounded border border-line bg-surface-2 px-1 font-mono">Enter</kbd> for a
          new line
        </span>
        {value.length > 450 && (
          <span className={value.length >= MAX ? "text-bad" : ""}>
            {value.length}/{MAX}
          </span>
        )}
      </div>
    </form>
  );
}
