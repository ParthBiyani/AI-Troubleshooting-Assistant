import { describe, expect, it } from "vitest";
import {
  MAX_CHATS,
  STORAGE_KEY,
  groupByDate,
  loadChats,
  removeChat,
  saveChats,
  slimMessage,
  titleFrom,
  upsertChat,
  type Chat,
  type Message,
  type StorageLike,
} from "@/lib/history";
import type { AskResponse } from "@/lib/pipeline";
import type { KbEntry } from "@/lib/kb/types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-24T15:00:00").getTime();

const chat = (id: string, updatedAt: number, text = `question ${id}`): Chat => ({
  id,
  title: text,
  createdAt: updatedAt,
  updatedAt,
  messages: [{ role: "user", text }],
});

class FakeStorage implements StorageLike {
  data = new Map<string, string>();
  /** Reject writes larger than this many characters, like a full browser quota. */
  limit = Infinity;
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (v.length > this.limit) throw new DOMException("full", "QuotaExceededError");
    this.data.set(k, v);
  }
}

const fullEntry: KbEntry = {
  id: "KB-PAY-002",
  section: "PAY",
  title: "Payments API timeouts",
  category: "Payment API and Gateway",
  component: "Payments API",
  defaultPriority: "P2",
  owningTeam: "Payments Platform Engineering (PPE)",
  owningTeamCode: "PPE",
  keywords: ["504"],
  symptoms: ["a"],
  likelyCauses: ["b"],
  checks: [{ text: "c", level: "L1" }],
  resolution: ["d"],
  escalation: ["e"],
  related: ["KB-DB-001"],
  markdown: "### KB-PAY-002 ... a long block of manual text",
};

const response = {
  mode: "answer",
  answer: null,
  message: "",
  sources: [
    {
      retrieval: {
        id: "KB-PAY-002",
        fusedScore: 0.03,
        bm25Score: 1,
        denseScore: 0.7,
        bm25Rank: 1,
        denseRank: 1,
        matchedTerms: ["504"],
      },
      entry: fullEntry,
      usedAsContext: true,
    },
  ],
  teams: {},
} as unknown as AskResponse;

describe("titleFrom", () => {
  it("uses the first question, shortened", () => {
    const long =
      "payment is hitting a timeout again and again on the checkout page for many merchants";
    const t = titleFrom([{ role: "user", text: long }]);
    expect(t.length).toBeLessThanOrEqual(48);
    expect(t.endsWith("…")).toBe(true);
  });

  it("never puts a card number in the title", () => {
    const t = titleFrom([{ role: "user", text: "card 4111 1111 1111 1111 declined" }]);
    expect(t).not.toContain("4111 1111 1111 1111");
    expect(t).toContain("XXXX XXXX XXXX 1111");
  });

  it("falls back for an empty chat", () => {
    expect(titleFrom([])).toBe("New chat");
  });
});

describe("slimMessage", () => {
  it("masks card numbers, OTPs and CVVs before they are stored", () => {
    const m = slimMessage({ role: "user", text: "card 4111 1111 1111 1111 otp is 482913 cvv 123" });
    expect(m.role === "user" && m.text).not.toMatch(/4111 1111 1111 1111|482913|\b123\b/);
  });

  it("drops the full entry text but keeps what the source card shows", () => {
    const m = slimMessage({ role: "assistant", response });
    if (m.role !== "assistant") throw new Error("unexpected role");
    const e = m.response.sources[0].entry;
    expect(e.markdown).toBe("");
    expect(e.symptoms).toEqual([]);
    expect(e.title).toBe("Payments API timeouts");
    expect(e.owningTeam).toContain("PPE");
    expect(e.defaultPriority).toBe("P2");
    expect(m.response.sources[0].retrieval.denseScore).toBe(0.7);
  });

  it("is much smaller than the original", () => {
    const m = slimMessage({ role: "assistant", response });
    expect(JSON.stringify(m).length).toBeLessThan(
      JSON.stringify({ role: "assistant", response }).length,
    );
  });
});

describe("upsertChat and removeChat", () => {
  it("puts the most recently updated chat first and replaces by id", () => {
    let list = upsertChat([], chat("a", 1));
    list = upsertChat(list, chat("b", 2));
    list = upsertChat(list, chat("a", 3, "updated"));
    expect(list.map((c) => c.id)).toEqual(["a", "b"]);
    expect(list[0].title).toBe("updated");
  });

  it("keeps at most MAX_CHATS, dropping the oldest", () => {
    let list: Chat[] = [];
    for (let i = 0; i < MAX_CHATS + 5; i++) list = upsertChat(list, chat(`c${i}`, i));
    expect(list).toHaveLength(MAX_CHATS);
    expect(list.some((c) => c.id === "c0")).toBe(false);
    expect(list[0].id).toBe(`c${MAX_CHATS + 4}`);
  });

  it("removes a chat by id", () => {
    expect(removeChat([chat("a", 1), chat("b", 2)], "a").map((c) => c.id)).toEqual(["b"]);
  });
});

describe("groupByDate", () => {
  it("buckets chats into Today, Yesterday, Previous 7 days and Older, newest first", () => {
    const groups = groupByDate(
      [
        chat("old", NOW - 20 * DAY),
        chat("today", NOW - 1000),
        chat("week", NOW - 4 * DAY),
        chat("yday", NOW - DAY),
      ],
      NOW,
    );
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", "Previous 7 days", "Older"]);
    expect(groups.map((g) => g.chats[0].id)).toEqual(["today", "yday", "week", "old"]);
  });

  it("omits empty groups", () => {
    expect(groupByDate([chat("a", NOW)], NOW).map((g) => g.label)).toEqual(["Today"]);
  });
});

describe("loadChats and saveChats", () => {
  it("round-trips chats", () => {
    const s = new FakeStorage();
    saveChats(s, [chat("a", 2), chat("b", 1)]);
    expect(loadChats(s).map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("returns an empty list for missing, corrupt or wrongly shaped data", () => {
    const s = new FakeStorage();
    expect(loadChats(s)).toEqual([]);
    s.setItem(STORAGE_KEY, "{not json");
    expect(loadChats(s)).toEqual([]);
    s.setItem(STORAGE_KEY, JSON.stringify({ a: 1 }));
    expect(loadChats(s)).toEqual([]);
    s.setItem(STORAGE_KEY, JSON.stringify([{ id: 1 }, chat("ok", 1)]));
    expect(loadChats(s).map((c) => c.id)).toEqual(["ok"]);
  });

  it("works without storage at all", () => {
    expect(loadChats(null)).toEqual([]);
    expect(saveChats(null, [chat("a", 1)])).toHaveLength(1);
  });

  it("drops the oldest chats when the browser quota is exceeded", () => {
    const s = new FakeStorage();
    const chats = [chat("new", 3), chat("mid", 2), chat("old", 1)];
    s.limit = JSON.stringify(chats.slice(0, 2)).length + 50;
    const stored = saveChats(s, chats);
    expect(stored.map((c) => c.id)).toEqual(["new", "mid"]);
    expect(loadChats(s).map((c) => c.id)).toEqual(["new", "mid"]);
  });

  it("stores the masked text, never the raw card number", () => {
    const s = new FakeStorage();
    const messages: Message[] = [{ role: "user", text: "card 4111 1111 1111 1111 declined" }];
    saveChats(s, [{ ...chat("a", 1), messages }]);
    expect(s.getItem(STORAGE_KEY)).not.toContain("4111 1111 1111 1111");
  });
});
