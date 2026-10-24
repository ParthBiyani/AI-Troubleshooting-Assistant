"use client";

import { BookOpen, Moon, PanelLeft, ScanSearch, SquarePen, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { MANUAL_PDF } from "./ui";

const REPO_URL = "https://github.com/ParthBiyani/AI-Troubleshooting-Assistant";

function GithubMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("theme");
    } catch {
      /* storage unavailable */
    }
    // Light unless the visitor has chosen dark with the toggle; the system setting is ignored.
    // A link can pick the theme (?theme=dark), which is handy for demos and screenshots.
    const fromLink = new URLSearchParams(window.location.search).get("theme");
    const choice = fromLink === "dark" || fromLink === "light" ? fromLink : saved;
    const next = choice === "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    setDark(next);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-muted transition hover:border-brand hover:text-brand"
    >
      {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  );
}

export function Header({
  showInternals,
  onToggleInternals,
  onToggleSidebar,
  onNewChat,
  canStartNew,
  busy,
}: {
  showInternals: boolean;
  onToggleInternals: (v: boolean) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  /** A chat with messages is open, so "New chat" does something. */
  canStartNew: boolean;
  busy: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle chat history"
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted transition hover:border-brand hover:text-brand"
        >
          <PanelLeft size={16} aria-hidden />
        </button>

        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-ink shadow-card">
            <ScanSearch size={20} aria-hidden />
          </span>
          <div className="leading-tight">
            <h1 className="text-[17px] font-bold tracking-tight">TriageGPT</h1>
            <p className="hidden text-xs text-muted sm:block">Grounded answers for L1/L2 support</p>
          </div>
        </div>

        <span className="ml-1 hidden rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted md:inline">
          Sample data · fictional company
        </span>

        <div className="ml-auto flex items-center gap-2">
          {canStartNew && (
            <button
              type="button"
              onClick={onNewChat}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SquarePen size={14} aria-hidden />
              <span className="hidden sm:inline">New chat</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
          <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-muted transition hover:border-brand">
            <input
              type="checkbox"
              role="switch"
              checked={showInternals}
              onChange={(e) => onToggleInternals(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-4 w-7 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand after:absolute after:left-0.5 after:top-0.5 after:size-3 after:rounded-full after:bg-surface after:transition peer-checked:after:translate-x-3" />
            <span className="hidden sm:inline">Under the hood</span>
            <span className="sm:hidden">Debug</span>
          </label>
          <a
            href={MANUAL_PDF}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-muted transition hover:border-brand hover:text-brand md:inline-flex"
          >
            <BookOpen size={14} aria-hidden /> Manual
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Source on GitHub"
            className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-muted transition hover:border-brand hover:text-brand"
          >
            <GithubMark />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
