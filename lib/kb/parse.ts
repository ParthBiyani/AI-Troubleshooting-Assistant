import type {
  CheckLevel,
  DiagnosticCheck,
  EscalationTeam,
  KbCorpus,
  KbEntry,
  PriorityDefinition,
} from "./types";

const ENTRY_HEADING = /^### (KB-([A-Z]+)-\d{3}) — (.+)$/;
const SUB_HEADING = /^\*\*(Symptoms|Likely causes|Diagnostic checks|Resolution|Escalation)\*\*\s*$/;
const RELATED_LINE = /^\*\*Related entries:\*\*\s*(.*)$/;
const LIST_ITEM = /^(?:\d+\.|-)\s+(.*)$/;
const CHECK_TAG = /^\*\((L1|L2)\)\*\s*/;

const stripFrontMatter = (md: string) => md.replace(/^---\n[\s\S]*?\n---\n/, "");

function tableRows(lines: string[]): string[][] {
  return lines
    .filter((l) => l.startsWith("|"))
    .map((l) =>
      l
        .replace(/^\||\|\s*$/g, "")
        .split("|")
        .map((c) => c.trim()),
    )
    .filter((cells) => !cells.every((c) => /^-+$/.test(c)))
    .slice(1); // drop header row
}

/** Collapse a markdown list into one string per item, joining wrapped lines. */
function listItems(lines: string[]): string[] {
  const items: string[] = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const m = LIST_ITEM.exec(line.trim());
    if (m) items.push(m[1].trim());
    else if (items.length) items[items.length - 1] += " " + line.trim();
    else items.push(line.trim());
  }
  return items;
}

function parseCheck(text: string): DiagnosticCheck {
  const m = CHECK_TAG.exec(text);
  if (!m) throw new Error(`Diagnostic check without an (L1)/(L2) tag: "${text}"`);
  return {
    text: text.replace(CHECK_TAG, "").trim(),
    level: m[1] as CheckLevel,
  };
}

export function stripCode(s: string): string {
  return s.replace(/`/g, "");
}

function parseEntry(id: string, section: string, title: string, block: string[]): KbEntry {
  const fieldLines: string[] = [];
  const buckets: Record<string, string[]> = {};
  let current: string | null = null;
  let related: string[] = [];

  for (const line of block) {
    const sub = SUB_HEADING.exec(line.trim());
    const rel = RELATED_LINE.exec(line.trim());
    if (sub) {
      current = sub[1];
      buckets[current] = [];
    } else if (rel) {
      current = null;
      related = rel[1].match(/KB-[A-Z]+-\d{3}/g) ?? [];
    } else if (current) {
      buckets[current].push(line);
    } else {
      fieldLines.push(line);
    }
  }

  const fields = Object.fromEntries(tableRows(fieldLines).map(([k, v]) => [k, v]));
  const owner = fields["Owning team"] ?? "";
  const ownerCode = /\(([A-Z0-9-]+)\)\s*$/.exec(owner)?.[1] ?? "";

  const need = (name: string) => {
    if (!fields[name]) throw new Error(`${id}: missing field "${name}"`);
    return fields[name];
  };

  return {
    id,
    section,
    title: title.trim(),
    category: need("Category"),
    component: need("Component"),
    defaultPriority: need("Default priority"),
    owningTeam: need("Owning team"),
    owningTeamCode: ownerCode,
    keywords: need("Keywords")
      .split(",")
      .map((k) => stripCode(k).trim())
      .filter(Boolean),
    symptoms: listItems(buckets["Symptoms"] ?? []),
    likelyCauses: listItems(buckets["Likely causes"] ?? []),
    checks: listItems(buckets["Diagnostic checks"] ?? []).map(parseCheck),
    resolution: listItems(buckets["Resolution"] ?? []),
    escalation: listItems(buckets["Escalation"] ?? []),
    related,
    markdown: [`### ${id} — ${title.trim()}`, ...block].join("\n").trim(),
  };
}

function sectionBlock(lines: string[], heading: RegExp): string[] {
  const start = lines.findIndex((l) => heading.test(l));
  if (start < 0) throw new Error(`Section not found: ${heading}`);
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end);
}

export function parsePriorities(lines: string[]): PriorityDefinition[] {
  return tableRows(sectionBlock(lines, /^## 3\. Incident Priority Definitions/)).map((c) => {
    const [label, definition, examples, responseTarget, updateCadence] = c.map((x) =>
      x.replace(/\*\*/g, ""),
    );
    return {
      code: label.slice(0, 2) as PriorityDefinition["code"],
      label,
      definition,
      examples,
      responseTarget,
      updateCadence,
    };
  });
}

export function parseTeams(lines: string[]): EscalationTeam[] {
  return tableRows(sectionBlock(lines, /^## 4\. Escalation Directory/)).map(
    ([name, code, owns, channel, hours]) => ({ name, code, owns, channel, hours }),
  );
}

export function parseCorpus(markdown: string): KbCorpus {
  const lines = stripFrontMatter(markdown.replace(/\r\n/g, "\n")).split("\n");
  const entries: KbEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const m = ENTRY_HEADING.exec(lines[i]);
    if (!m) continue;
    let end = i + 1;
    while (end < lines.length && !/^(### |## )/.test(lines[end]) && lines[end].trim() !== "---") {
      end++;
    }
    entries.push(parseEntry(m[1], m[2], m[3], lines.slice(i + 1, end)));
    i = end - 1;
  }

  const ids = new Set(entries.map((e) => e.id));
  if (ids.size !== entries.length) throw new Error("Duplicate KB entry ids");
  for (const e of entries) {
    for (const r of e.related) {
      if (!ids.has(r)) throw new Error(`${e.id} references unknown entry ${r}`);
    }
  }

  return { entries, priorities: parsePriorities(lines), teams: parseTeams(lines) };
}
