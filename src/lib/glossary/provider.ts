import type { GlossaryEntry } from "@/src/types";

// interface for every glossary data source

export interface GlossaryProvider {
  
  // returns every entry the provider knows for this term.
  // empty array = the term is not recognize
  lookup(term: string): Promise<GlossaryEntry[]>;

  // returns entries whose US name, UK name, or any alias starts with the given prefix
  search(prefix: string): Promise<GlossaryEntry[]>;
}
