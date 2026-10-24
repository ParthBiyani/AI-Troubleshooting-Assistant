"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import { Composer } from "@/components/Composer";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { SourcesPanel } from "@/components/SourcesPanel";
import { Thinking } from "@/components/Thinking";
import {
  loadChats,
  newChatId,
  removeChat,
  safeStorage,
  saveChats,
  titleFrom,
  upsertChat,
  type Chat,
  type Message,
} from "@/lib/history";
import type { AskResponse } from "@/lib/pipeline";

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showInternals, setShowInternals] = useState(false);
  const [desktopSidebar, setDesktopSidebar] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const autoRan = useRef(false);
  /** True only after the user adds something, so merely opening a saved chat never reorders history. */
  const dirty = useRef(false);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  const latest = [...messages].reverse().find((m) => m.role === "assistant");
  const latestResponse = latest?.role === "assistant" ? latest.response : null;

  /* ------------------------------------------------------------ history */
  useEffect(() => {
    setChats(loadChats(safeStorage()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveChats(safeStorage(), chats);
  }, [chats, hydrated]);

  // Save the open chat once an exchange has finished.
  useEffect(() => {
    if (!hydrated || loading || !dirty.current || messages.length === 0) return;
    dirty.current = false;
    const id = activeRef.current ?? newChatId();
    if (!activeRef.current) setActiveId(id);
    const now = Date.now();
    setChats((prev) => {
      const existing = prev.find((c) => c.id === id);
      return upsertChat(prev, {
        id,
        title: existing?.title ?? titleFrom(messages),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        messages,
      });
    });
  }, [messages, loading, hydrated]);

  const startNewChat = useCallback(() => {
    if (loading) return;
    dirty.current = false;
    setActiveId(null);
    setMessages([]);
    setInput("");
    setOpenId(null);
    window.scrollTo({ top: 0 });
  }, [loading]);

  function selectChat(id: string) {
    if (loading) return;
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;
    dirty.current = false;
    setActiveId(id);
    setMessages(chat.messages);
    setInput("");
    setOpenId(null);
    window.scrollTo({ top: 0 });
  }

  function deleteChat(id: string) {
    setChats((prev) => removeChat(prev, id));
    if (id === activeId) startNewChat();
  }

  function clearAll() {
    setChats([]);
    startNewChat();
  }

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1280px)").matches) setDesktopSidebar((v) => !v);
    else setDrawerOpen(true);
  }

  /* --------------------------------------------------------------- ask */
  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (question.length < 2 || loading) return;

      // After a "need more info" reply, the next message is a follow-up to the last question.
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const previousQuestion =
        latestResponse?.mode === "clarify" && lastUser?.role === "user" ? lastUser.text : undefined;

      dirty.current = true;
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
      } catch (err) {
        setMessages((m) => [
          ...m,
          { role: "error", text: err instanceof Error ? err.message : "Request failed" },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, latestResponse],
  );

  // A shareable link: /?q=payment+failing asks that question on load.
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "1") setShowInternals(true);
    const q = params.get("q");
    if (q) void send(q);
  }, [send]);

  useEffect(() => {
    if (messages.length === 0) return;
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function openEntry(id: string) {
    setOpenId(id);
    setTimeout(
      () =>
        document
          .getElementById(`source-${id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      60,
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        showInternals={showInternals}
        onToggleInternals={setShowInternals}
        onToggleSidebar={toggleSidebar}
        onNewChat={startNewChat}
        canStartNew={messages.length > 0}
        busy={loading}
      />

      <div className="flex flex-1">
        <Sidebar
          chats={chats}
          activeId={activeId}
          busy={loading}
          desktopOpen={desktopSidebar}
          drawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
          onSelect={selectChat}
          onNew={startNewChat}
          onDelete={deleteChat}
          onClearAll={clearAll}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="grid w-full flex-1 grid-cols-1 gap-x-8 gap-y-6 px-4 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[1fr_auto] lg:px-8 2xl:grid-cols-[minmax(0,1fr)_440px]">
            <section className="w-full min-w-0 max-w-5xl space-y-4" aria-label="Conversation">
              {messages.length === 0 && !loading && (
                <EmptyState
                  onPick={(q) => {
                    setInput("");
                    void send(q);
                  }}
                />
              )}

              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="animate-fade-up flex justify-end">
                    <p className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[15px] leading-relaxed text-brand-ink shadow-card">
                      {m.text}
                    </p>
                  </div>
                ) : m.role === "error" ? (
                  <div
                    key={i}
                    role="alert"
                    className="animate-fade-up rounded-2xl border border-bad/40 bg-bad-soft p-4 text-sm text-bad"
                  >
                    {m.text}
                  </div>
                ) : (
                  <AnswerCard key={i} response={m.response} onOpenEntry={openEntry} />
                ),
              )}

              {loading && <Thinking />}
              <div ref={bottom} />
            </section>

            <aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <div className="lg:sticky lg:top-[4.75rem] lg:max-h-[calc(100vh-5.75rem)] lg:overflow-y-auto lg:pb-4 lg:pr-1">
                <SourcesPanel
                  response={latestResponse}
                  openId={openId}
                  onOpen={setOpenId}
                  showInternals={showInternals}
                />
              </div>
            </aside>

            <div className="sticky bottom-0 z-20 -mx-4 bg-gradient-to-t from-canvas via-canvas/95 to-transparent px-4 pb-4 pt-6 sm:-mx-6 sm:px-6 lg:col-start-1 lg:row-start-2 lg:mx-0 lg:px-0">
              <div className="w-full max-w-5xl">
                <Composer
                  value={input}
                  onChange={setInput}
                  onSubmit={() => void send(input)}
                  loading={loading}
                  placeholder={
                    latestResponse?.mode === "clarify"
                      ? "Reply with the details above…"
                      : "Describe the issue, e.g. payments timing out with 504…"
                  }
                />
              </div>
            </div>
          </main>

          <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
            Sample data: Northwind Payments is a fictional company and the knowledge base is
            simulated. Answers come only from that manual.
          </footer>
        </div>
      </div>
    </div>
  );
}
