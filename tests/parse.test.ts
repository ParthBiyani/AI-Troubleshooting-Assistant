import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCorpus } from "@/lib/kb/parse";

const markdown = readFileSync(
  join(__dirname, "..", "data", "Northwind_Support_Knowledge_Manual.md"),
  "utf8",
);
const corpus = parseCorpus(markdown);

describe("knowledge base parser", () => {
  it("parses all 67 entries with unique ids", () => {
    expect(corpus.entries).toHaveLength(67);
    expect(new Set(corpus.entries.map((e) => e.id)).size).toBe(67);
  });

  it("fills every field of every entry", () => {
    for (const e of corpus.entries) {
      expect(e.title, e.id).not.toBe("");
      expect(e.category, e.id).not.toBe("");
      expect(e.component, e.id).not.toBe("");
      expect(e.defaultPriority, e.id).toMatch(/^P[1-4]/);
      expect(e.owningTeamCode, e.id).not.toBe("");
      expect(e.keywords.length, e.id).toBeGreaterThan(0);
      expect(e.symptoms.length, e.id).toBeGreaterThan(0);
      expect(e.likelyCauses.length, e.id).toBeGreaterThan(0);
      expect(e.checks.length, e.id).toBeGreaterThan(0);
      expect(e.resolution.length, e.id).toBeGreaterThan(0);
      expect(e.escalation.length, e.id).toBeGreaterThan(0);
    }
  });

  it("resolves every related entry reference", () => {
    const ids = new Set(corpus.entries.map((e) => e.id));
    for (const e of corpus.entries)
      for (const r of e.related) expect(ids.has(r), `${e.id}->${r}`).toBe(true);
  });

  it("keeps the L1/L2 check tags and the approval gate wording", () => {
    const checks = corpus.entries.flatMap((e) => e.checks);
    expect(checks.every((c) => c.level === "L1" || c.level === "L2")).toBe(true);
    const gated = corpus.entries
      .flatMap((e) => e.resolution)
      .filter((r) => r.includes("L2 + approval"));
    expect(gated.length).toBeGreaterThan(0);
  });

  it("parses the escalation directory and priority table", () => {
    expect(corpus.teams).toHaveLength(15);
    expect(corpus.teams.map((t) => t.code)).toContain("PPE");
    expect(corpus.priorities.map((p) => p.code)).toEqual(["P1", "P2", "P3", "P4"]);
  });

  it("only uses owning teams that exist in the directory", () => {
    const codes = new Set(corpus.teams.map((t) => t.code));
    for (const e of corpus.entries) expect(codes.has(e.owningTeamCode), e.id).toBe(true);
  });

  it("extracts the first entry correctly", () => {
    const e = corpus.entries[0];
    expect(e.id).toBe("KB-PAY-001");
    expect(e.keywords).toContain("INTERNAL_ERROR");
    expect(e.markdown).toContain("**Symptoms**");
  });
});
