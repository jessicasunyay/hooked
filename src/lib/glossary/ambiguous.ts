import type { GlossaryEntry, Terminology } from "@/src/types";

const US_INTERPRETATION_KEY: Record<string, string> = {
  dc: "double-crochet",
  tr: "treble",
  dtr: "double-treble",
  trtr: "triple-treble",
  fpdc: "front-post-double-crochet",
  fptr: "front-post-treble",
  bpdc: "back-post-double-crochet",
  bptr: "back-post-treble",
  fdc: "foundation-double-crochet",
  ftr: "foundation-treble",
};

function getEntryInterpretation(
  term: string,
  entry: GlossaryEntry,
  baseTerm: string,
): "us" | "uk" | null {
  const normalizedTerm = term.toLowerCase().trim();
  const usName = entry.us.toLowerCase().trim();
  const ukName = entry.uk.toLowerCase().trim();

  // name matching
  if (normalizedTerm === usName) return "us";
  if (normalizedTerm === ukName) return "uk";

  // abbreviation map
  const usKey = US_INTERPRETATION_KEY[baseTerm];
  if (!usKey) return null; 

  if (entry.key === usKey || entry.key.startsWith(usKey + "-")) {
    return "us";
  }

  return "uk";
}

// sort glossary entries so the entry matching the user's terminology appears first
export function sortEntriesByTerminology(
  term: string,
  entries: GlossaryEntry[],
  terminology: Terminology,
): GlossaryEntry[] {
  if (entries.length <= 1) return entries;

  const normalizedTerm = term.toLowerCase().trim();

  // try to extract a base term from compound terms
  const compoundMatch = normalizedTerm.match(/^([a-z]+)\d+tog$/);
  const baseTerm = compoundMatch ? compoundMatch[1] : normalizedTerm;

  return [...entries].sort((a, b) => {
    const aInterp = getEntryInterpretation(term, a, baseTerm);
    const bInterp = getEntryInterpretation(term, b, baseTerm);

    if (aInterp === null || bInterp === null) return 0;

    if (terminology === "us") {
      // US interpretation first.
      if (aInterp === "us" && bInterp === "uk") return -1;
      if (aInterp === "uk" && bInterp === "us") return 1;
    } else {
      // UK interpretation first.
      if (aInterp === "us" && bInterp === "uk") return 1;
      if (aInterp === "uk" && bInterp === "us") return -1;
    }
    return 0; // keep original order
  });
}
