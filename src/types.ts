export type Status = "to-try" | "wip" | "completed";

export type Terminology = "us" | "uk";

export type Theme = "light" | "dark" | "system";

export type GlossaryProviderId = "local";

export interface PatternCard {
  id: string;
  title: string;
  url: string;
  status: Status;
  tags: string[];
  notes: string;
  dateSaved: number;
}

export interface GlossaryEntry {
  key: string;
  us: string;
  uk: string;
  aliases: string[];
  definition: string;
  category: "abbreviation" | "term" | "technique";
}

export interface Settings {
  stitchModeEnabled: boolean;
  autoDetectEnabled: boolean;
  terminology: Terminology;
  defaultStatus: Status;
  customEntries: GlossaryEntry[];
  provider: GlossaryProviderId;
  theme: Theme;
}
