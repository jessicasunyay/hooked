export type Status = "to-try" | "wip" | "completed";

export type Region = "us" | "uk";

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
  region: Region;
  customEntries: GlossaryEntry[];
  provider: GlossaryProviderId;
}
