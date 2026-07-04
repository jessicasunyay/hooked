import type { GlossaryEntry } from "@/src/types";
import { glossary } from "@/src/data/glossary";
import type { GlossaryProvider } from "./provider";

// answers glossary lookups purely from local data
// fallback chain for lookups
//   1. explicit map: prebuilt lookup from hardcoded lowercased alias → entries.
//   2. compound matcher: a regex synthesizes a GlossaryEntry on the fly from the base stitch, inherits ambiguity
//   3. Empty array: not recognized

export class LocalProvider implements GlossaryProvider {
  
  // merged lookup index
  // keys are lowercased aliases / US names / UK names, values are the array entries that key resolves to

  private readonly index: Map<string, GlossaryEntry[]>;

  // anchored regex for the compound-decrease fallback
  // used to pull out the base stitch abbreviation and the number
  
  private readonly compoundRegex: RegExp;

  // standard base-stitch abbreviations the compound matcher recognizes
  // sorted longest-first so the regex alternation doesn't prematurely match a shorter base

  private readonly compoundBases: string[] = [
    "trtr",
    "tr",
    "dtr",
    "hdc",
    "htr",
    "dc",
    "sc",
  ];

  // runs on new LocalProvider()
  constructor(extraEntries: GlossaryEntry[] = []) {
    this.index = this.buildIndex([...glossary, ...extraEntries]); //merges glossary with custom entries
    this.compoundRegex = new RegExp(
      `^(?<base>${this.compoundBases.join("|")})(?<count>\\d+)tog$`, //dynamic stitch regex
      "i",
    );
  }

  // builds the merged index from a list of entries
  // for each entry, every alias + the US name + the UK name (lowercased, trimmed) becomes a key pointing to that entry
  // if a key already exists (ambiguous alias), we APPEND to its array rather than overwriting
  
  private buildIndex(entries: GlossaryEntry[]): Map<string, GlossaryEntry[]> {
    const index = new Map<string, GlossaryEntry[]>();
    for (const entry of entries) {
      // for each stitch, build a list of all the terms that should point to it
      const terms = [entry.key, ...entry.aliases, entry.us, entry.uk].map((t) =>
        t.toLowerCase().trim(),
      );
      for (const term of terms) {
        if (!term) continue; //skips empty strings
        const existing = index.get(term);
        if (existing) { // check if another stitch has already claimed this alias
          if (!existing.includes(entry)) existing.push(entry); // if yes, add the stitch to the term key
        } else {
          index.set(term, [entry]); // if no, create a new array with the stitch as the first entry
        }
      }
    }
    return index;
  }

  // returns every entry the provider knows for this term
  async lookup(term: string): Promise<GlossaryEntry[]> {
    const normalized = term.toLowerCase().trim();
    if (!normalized) return [];

    // explicit map for hardcoded entries
    const direct = this.index.get(normalized);
    if (direct && direct.length > 0) return direct;

    // compound-stitch pattern matcher
    const compound = this.matchCompound(normalized);
    if (compound.length > 0) return compound;

    // not recognized
    return [];
  }

  // prefix search across every key in the index
  async search(prefix: string): Promise<GlossaryEntry[]> {
    const p = prefix.toLowerCase().trim();
    if (!p) return [];
    const seen = new Set<GlossaryEntry>();
    for (const [term, entries] of this.index) {
      if (term.startsWith(p)) {
        for (const e of entries) seen.add(e);
      }
    }
    return [...seen];
  }

  // regex-extract the base and the count of compound stitches
  // look up the base through the SAME index, so we inherit ambiguity

  private matchCompound(term: string): GlossaryEntry[] {
    const match = this.compoundRegex.exec(term);
    if (!match) return [];
    const base = match.groups!.base.toLowerCase();
    const count = Number(match.groups!.count);

    const baseEntries = this.index.get(base);
    if (!baseEntries || baseEntries.length === 0) return [];

    const synthesized: GlossaryEntry[] = [];
    for (const baseEntry of baseEntries) {
      synthesized.push({
        key: `${baseEntry.key}-${count}-together`,
        us: `${baseEntry.us} ${count} together`,
        uk: `${baseEntry.uk} ${count} together`,
        aliases: [term],
        definition: this.synthesizeDefinition(baseEntry.us, count),
        category: "abbreviation",
      });
    }
    return synthesized;
  }

  // build a text-only definition for a synthesized compound decrease.
  private synthesizeDefinition(baseUsName: string, count: number): string {
    return `Decrease by working ${count} ${baseUsName} across the next ${count} stitches and joining them at the top.`;
  }

  getScanRegex(): RegExp {
    // escape every regex-special character in a term 
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // longest-first
    const sortedTerms = [...this.index.keys()].sort(
      (a, b) => b.length - a.length,
    );
    const escapedTerms = sortedTerms.map(escape);

    // compound-decrease pattern
    const compoundBase = `(?:${this.compoundBases.join("|")})\\d+tog`;

    const pattern = `\\b(${escapedTerms.join("|")})\\b|\\b(${compoundBase})\\b`;
    return new RegExp(pattern, "gi");
  }
}
