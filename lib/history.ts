import { maskPii } from "@/lib/guards/pii";
import type { KbEntry } from "@/lib/kb/types";
import type { AskResponse } from "@/lib/pipeline";

/* ------------------------------------------------------------------- types */
export type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; response: AskResponse }
  | { role: "error"; text: string };

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

/** The part of localStorage the history needs, so tests can supply a fake. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const STORAGE_KEY = "triagegpt.chats.v1";
/** Oldest chats are dropped beyond this, and when the browser's storage quota is hit. */
export const MAX_CHATS = 50;
const TITLE_LENGTH = 48;

/* ------------------------------------------------------- shrinking for storage */
/**
 * A stored answer keeps what is needed to display it again (the answer, scores, gate and
 * guard details) but not the full text of each retrieved entry, which is about 90% of its size.
 * The full entry is fetched on demand when a source card is opened.
 */
export function slimEntry(e: KbEntry): KbEntry {
  return {
    id: e.id,
    section: e.section,
    title: e.title,
    category: "",
    component: "",
    defaultPriority: e.defaultPriority,
    owningTeam: e.owningTeam,
    owningTeamCode: e.owningTeamCode,
    keywords: [],
    symptoms: [],
    likelyCauses: [],
    checks: [],
    resolution: [],
    escalation: [],
    related: [],
    markdown: "",
  };
}

export function slimMessage(m: Message): Message {
  if (m.role === "user") {
    // Anything the user typed is masked before it is kept: card numbers, OTPs and CVVs never reach storage.
    return { role: "user", text: maskPii(m.text).text };
  }
  if (m.role === "assistant") {
    return {
      role: "assistant",
      response: {
        ...m.response,
        sources: m.response.sources.map((s) => ({ ...s, entry: slimEntry(s.entry) })),
      },
    };
  }
  return m;
}

export function titleFrom(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  const text = first && first.role === "user" ? maskPii(first.text).text.trim() : "";
  if (!text) return "New chat";
  return text.length > TITLE_LENGTH ? text.slice(0, TITLE_LENGTH - 1).trimEnd() + "…" : text;
}

/* -------------------------------------------------------------- list changes */
/** Insert or update a chat; the most recently updated chats are kept, capped at MAX_CHATS. */
export function upsertChat(chats: Chat[], chat: Chat): Chat[] {
  const without = chats.filter((c) => c.id !== chat.id);
  return [chat, ...without].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CHATS);
}

export const removeChat = (chats: Chat[], id: string): Chat[] => chats.filter((c) => c.id !== id);

/* ------------------------------------------------------------------ grouping */
export type Group = { label: "Today" | "Yesterday" | "Previous 7 days" | "Older"; chats: Chat[] };

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function groupByDate(chats: Chat[], now = Date.now()): Group[] {
  const today = startOfDay(now);
  const day = 24 * 60 * 60 * 1000;
  const buckets: Group[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Previous 7 days", chats: [] },
    { label: "Older", chats: [] },
  ];
  for (const c of [...chats].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const d = startOfDay(c.updatedAt);
    if (d >= today) buckets[0].chats.push(c);
    else if (d >= today - day) buckets[1].chats.push(c);
    else if (d >= today - 7 * day) buckets[2].chats.push(c);
    else buckets[3].chats.push(c);
  }
  return buckets.filter((b) => b.chats.length > 0);
}

/* ------------------------------------------------------------------- storage */
function isChat(x: unknown): x is Chat {
  if (!x || typeof x !== "object") return false;
  const c = x as Partial<Chat>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.updatedAt === "number" &&
    Array.isArray(c.messages)
  );
}

/** Reads saved chats. Anything missing, corrupt or from an unknown shape yields an empty list. */
export function loadChats(storage: StorageLike | null): Chat[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isChat).slice(0, MAX_CHATS) : [];
  } catch {
    return [];
  }
}

/**
 * Saves chats in their slimmed form. If the browser refuses (quota), the oldest chat is dropped
 * and the save retried, so history degrades gracefully instead of failing silently.
 * Returns the list that was actually stored.
 */
export function saveChats(storage: StorageLike | null, chats: Chat[]): Chat[] {
  if (!storage) return chats;
  let list = chats.map((c) => ({ ...c, messages: c.messages.map(slimMessage) }));
  for (;;) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(list));
      return list;
    } catch {
      if (list.length <= 1) return list;
      list = list.slice(0, -1);
    }
  }
}

export function safeStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function newChatId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
