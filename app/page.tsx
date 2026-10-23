"use client";

import { useRef, useState } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import { SourcesPanel } from "@/components/SourcesPanel";
import { EXAMPLE_GROUPS } from "@/components/examples";
import type { AskResponse } from "@/lib/pipeline";

type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; response: AskResponse }
  | { role: "error"; text: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showInternals, setShowInternals] = useState(false);
  const [teams, setTeams] = useState<Record<string, string>>({});
  const bottom = useRef<HTMLDivElement>(null);

  const latest = [...messages].reverse().find((m) => m.role === "assistant");
  const latestResponse = latest?.role === "assistant" ? latest.response : null;

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    // After a "need more info" reply, the next message is treated as a follow-up to the last question.
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const wasClarifying = latestResponse?.mode === "clarify";
    const previousQuestion = wasClarifying && lastUser?.role === "user" ? lastUser.text : undefined;

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    setOpenId(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, previousQuestion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessages((m) => [...m, { role: "assistant", response: data as AskResponse }]);
      setTeams((t) => {
        const next = { ...t };
        for (const s of (data as AskResponse).sources)
          next[s.entry.owningTeamCode] = s.entry.owningTeam.replace(/\s*\(.*\)$/, "");
        return next;
      });
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "error", text: err instanceof Error ? err.message : "Request failed" },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">TriageGPT</h1>
            <p className="text-xs text-zinc-500">
              L1/L2 troubleshooting assistant grounded in a support knowledge base
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showInternals}
              onChange={(e) => setShowInternals(e.target.checked)}
            />
            Under the hood
          </label>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-4 lg:grid-cols-[3fr_2fr]">
        <section className="flex min-h-[60vh] flex-col">
          <div className="flex-1 space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Describe an issue in plain language. Answers come only from the knowledge base and
                  cite the entry they used. Try an example:
                </p>
                {EXAMPLE_GROUPS.map((g) => (
                  <div key={g.label}>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {g.label}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.chips.map((c) => (
                        <button
                          key={c}
                          onClick={() => send(c)}
                          className="rounded-full border border-zinc-300 px-3 py-1 text-left text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {m.text}
                </div>
              ) : m.role === "error" ? (
                <div
                  key={i}
                  className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                >
                  {m.text}
                </div>
              ) : (
                <AnswerCard
                  key={i}
                  response={m.response}
                  teamName={(code) => teams[code] ?? code}
                  onOpenEntry={setOpenId}
                />
              ),
            )}
            {loading && <p className="text-sm text-zinc-500">Searching the knowledge base…</p>}
            <div ref={bottom} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="sticky bottom-0 flex gap-2 bg-[var(--background)] pb-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={600}
              placeholder="Describe the issue…"
              className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-200"
            />
            <button
              disabled={loading || input.trim().length < 2}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Ask
            </button>
          </form>
        </section>

        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <SourcesPanel
            response={latestResponse}
            openId={openId}
            onOpen={setOpenId}
            showInternals={showInternals}
          />
        </aside>
      </main>

      <footer className="border-t border-zinc-200 px-4 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Sample data: Northwind Payments is a fictional company and the knowledge base is simulated.
        ·{" "}
        <a className="underline" href="https://github.com/ParthBiyani/AI-Troubleshooting-Assistant">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}
