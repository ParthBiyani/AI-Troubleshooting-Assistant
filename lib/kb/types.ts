export type CheckLevel = "L1" | "L2";

export interface DiagnosticCheck {
  text: string;
  level: CheckLevel;
}

export interface KbEntry {
  id: string;
  section: string;
  title: string;
  category: string;
  component: string;
  defaultPriority: string;
  owningTeam: string;
  owningTeamCode: string;
  keywords: string[];
  symptoms: string[];
  likelyCauses: string[];
  checks: DiagnosticCheck[];
  resolution: string[];
  escalation: string[];
  related: string[];
  /** The entry exactly as written in the manual, for the full-entry viewer. */
  markdown: string;
}

export interface PriorityDefinition {
  code: "P1" | "P2" | "P3" | "P4";
  label: string;
  definition: string;
  examples: string;
  responseTarget: string;
  updateCadence: string;
}

export interface EscalationTeam {
  name: string;
  code: string;
  owns: string;
  channel: string;
  hours: string;
}

export interface KbCorpus {
  entries: KbEntry[];
  priorities: PriorityDefinition[];
  teams: EscalationTeam[];
}
