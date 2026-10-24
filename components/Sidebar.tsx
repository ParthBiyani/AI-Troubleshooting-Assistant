"use client";

import { MessageSquare, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useState } from "react";
import { groupByDate, type Chat } from "@/lib/history";

function modeDot(chat: Chat): string {
  const last = [...chat.messages].reverse().find((m) => m.role === "assistant");
  if (!last || last.role !== "assistant") return "bg-line";
  if (last.response.mode === "answer") return "bg-ok";
  if (last.response.mode === "clarify") return "bg-warn";
  return "bg-bad";
}

function ChatRow({
  chat,
  active,
  disabled,
  onSelect,
  onDelete,
}: {
  chat: Chat;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <li className="flex items-center gap-2 rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad">
        <span className="min-w-0 flex-1 truncate">Delete this chat?</span>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md bg-bad px-2 py-0.5 text-xs font-semibold text-surface"
        >
          Delete
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-xs font-medium">
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-current={active ? "true" : undefined}
        title={chat.title}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 pr-9 text-left text-[13px] transition disabled:cursor-not-allowed disabled:opacity-50 ${
          active
            ? "bg-brand-soft font-medium text-ink"
            : "text-muted hover:bg-surface-2 hover:text-ink"
        }`}
      >
        <span className={`size-1.5 shrink-0 rounded-full ${modeDot(chat)}`} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{chat.title}</span>
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={disabled}
        aria-label={`Delete chat: ${chat.title}`}
        className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted opacity-0 transition hover:bg-surface hover:text-bad focus-visible:opacity-100 group-hover:opacity-100 disabled:hidden"
      >
        <Trash2 size={14} aria-hidden />
      </button>
    </li>
  );
}

function SidebarBody({
  chats,
  activeId,
  busy,
  onSelect,
  onNew,
  onDelete,
  onClearAll,
  onClose,
}: {
  chats: Chat[];
  activeId: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose?: () => void;
}) {
  const [clearing, setClearing] = useState(false);
  const groups = groupByDate(chats);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={onNew}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-brand-ink shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} aria-hidden /> New chat
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat history"
            className="grid size-10 place-items-center rounded-xl border border-line text-muted hover:text-ink"
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </div>

      <nav aria-label="Chat history" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 ? (
          <div className="mt-6 px-4 text-center text-[13px] leading-relaxed text-muted">
            <MessageSquare className="mx-auto mb-2 opacity-60" size={22} aria-hidden />
            Your chats will appear here. They stay in this browser only.
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.label} className="mb-3">
              <h3 className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted/80">
                {g.label}
              </h3>
              <ul className="space-y-0.5">
                {g.chats.map((c) => (
                  <ChatRow
                    key={c.id}
                    chat={c}
                    active={c.id === activeId}
                    disabled={busy}
                    onSelect={() => onSelect(c.id)}
                    onDelete={() => onDelete(c.id)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </nav>

      <div className="space-y-2 border-t border-line p-3">
        {chats.length > 0 &&
          (clearing ? (
            <div className="flex items-center gap-2 text-[13px]">
              <span className="flex-1 text-bad">Delete all {chats.length} chats?</span>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setClearing(false);
                }}
                className="rounded-md bg-bad px-2 py-1 text-xs font-semibold text-surface"
              >
                Delete all
              </button>
              <button
                type="button"
                onClick={() => setClearing(false)}
                className="text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setClearing(true)}
              disabled={busy}
              className="text-xs font-medium text-muted transition hover:text-bad disabled:opacity-50"
            >
              Clear all history
            </button>
          ))}
        <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted">
          <ShieldCheck size={13} className="mt-px shrink-0" aria-hidden />
          Saved in this browser only. Card numbers, OTPs and CVVs are masked before saving.
        </p>
      </div>
    </div>
  );
}

export function Sidebar(props: {
  chats: Chat[];
  activeId: string | null;
  busy: boolean;
  /** Desktop: inline panel that can be collapsed. */
  desktopOpen: boolean;
  /** Mobile and tablet: slide-over drawer. */
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}) {
  const { desktopOpen, drawerOpen, onCloseDrawer, ...body } = props;
  return (
    <>
      {desktopOpen && (
        <aside
          aria-label="Chat history"
          className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-72 shrink-0 self-start border-r border-line bg-surface/60 xl:block"
        >
          <SidebarBody {...body} />
        </aside>
      )}

      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Chat history"
        >
          <button
            type="button"
            aria-label="Close chat history"
            onClick={onCloseDrawer}
            className="absolute inset-0 bg-black/40"
          />
          <div className="animate-fade-up absolute inset-y-0 left-0 w-[85%] max-w-80 border-r border-line bg-surface shadow-card">
            <SidebarBody
              {...body}
              onClose={onCloseDrawer}
              onSelect={(id) => {
                body.onSelect(id);
                onCloseDrawer();
              }}
              onNew={() => {
                body.onNew();
                onCloseDrawer();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
