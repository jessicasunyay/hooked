import type { GlossaryEntry, Terminology } from "@/src/types";

// AI: PURPOSE OF THIS FILE
// ──────────────────────────────────────────────────────────────────────────
// When an ambiguous term (like "dc" or "double crochet") resolves to multiple
// glossary entries, the tooltip shows both. This module sorts those entries
// so the one matching the user's terminology preference appears FIRST.
//
// Example: "dc" resolves to two entries:
//   - single-crochet  (us: "single crochet",  uk: "double crochet")
//   - double-crochet  (us: "double crochet",  uk: "treble")
//
// A US user seeing "dc" is most likely on a US pattern where "dc" means
// "double crochet" → show double-crochet entry first.
// A UK user seeing "dc" is most likely on a UK pattern where "dc" means
// "double crochet" (UK) = US single crochet → show single-crochet entry first.
//
// THE SAME AMBIGUITY APPLIES TO FULL PHRASES, not just abbreviations:
//   "double crochet" is the US name for double crochet AND the UK name for
//   single crochet. So lookup("double crochet") also returns two entries.
//
// HOW WE DETERMINE WHICH ENTRY IS THE US INTERPRETATION:
//   - For FULL PHRASES (us/uk names): we can DERIVE it. If the matched term
//     equals entry.us, that entry is the US interpretation. If it equals
//     entry.uk, that entry is the UK interpretation. No hardcoding needed.
//   - For ABBREVIATIONS (dc, tr, fpdc...): we CAN'T derive it because aliases
//     are a flat string[] with no region tags (we chose this in planning).
//     So we use a hardcoded map of abbreviation → US interpretation entry key.
//
// This hybrid approach handles ALL ambiguous terms: full phrases via
// derivation, abbreviations via the map.
// ──────────────────────────────────────────────────────────────────────────

// AI: Maps each ambiguous ABBREVIATION to the entry key that represents the US
// interpretation. For UK users, the OTHER entry comes first.
//
// This covers both:
//   - Simple ambiguous abbreviations (dc, tr, fpdc, fdc, ...)
//   - Compound decrease abbreviations (dc2tog, tr2tog, ...)
//     Compound entries have keys like "double-crochet-2-together", which
//     starts with the base entry's key + "-". So checking
//     key === usKey || key.startsWith(usKey + "-") covers both cases.
//
// WHY ISN'T "sc" IN THIS MAP?
// "sc" is only used in US terminology (UK uses "dc" for that stitch). So
// "sc" only resolves to ONE entry — no ambiguity, no sorting needed. The map
// only needs entries for abbreviations that BOTH regions use for different
// stitches.
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

// AI: Determine whether an entry is the US or UK interpretation of the term.
// Returns "us", "uk", or null (if the term isn't ambiguous / can't be
// determined).
//
// TWO STRATEGIES (tried in order):
//   1. NAME MATCHING — if the term equals the entry's us name, it's the US
//      interpretation. If it equals the uk name, it's the UK interpretation.
//      This handles full phrases like "double crochet", "treble",
//      "front post double crochet", "double crochet 2 together", etc.
//   2. ABBREVIATION MAP — if name matching didn't identify the entry (the
//      term is an abbreviation like "dc" that's in the aliases array, not a
//      us/uk name), fall back to the hardcoded map.
function getEntryInterpretation(
  term: string,
  entry: GlossaryEntry,
  baseTerm: string,
): "us" | "uk" | null {
  const normalizedTerm = term.toLowerCase().trim();
  const usName = entry.us.toLowerCase().trim();
  const ukName = entry.uk.toLowerCase().trim();

  // AI: Strategy 1 — name matching. Works for full phrases.
  if (normalizedTerm === usName) return "us";
  if (normalizedTerm === ukName) return "uk";

  // AI: Strategy 2 — abbreviation map. Works for abbreviations like "dc".
  const usKey = US_INTERPRETATION_KEY[baseTerm];
  if (!usKey) return null; // AI: Not an ambiguous term.

  // AI: Check if this entry's key identifies it as the US interpretation.
  // Matches exact keys ("double-crochet") and compound keys
  // ("double-crochet-2-together", "double-crochet-4-together").
  if (entry.key === usKey || entry.key.startsWith(usKey + "-")) {
    return "us";
  }
  // AI: The other entry is the UK interpretation.
  return "uk";
}

// AI: Sort glossary entries so the entry matching the user's terminology
// appears first. For non-ambiguous terms (1 entry), returns as-is.
//
// For compound abbreviations like "dc4tog", extracts the base ("dc") and
// uses the same map — compound synthesized entries have keys like
// "double-crochet-4-together", which inherits the base's ambiguity.
export function sortEntriesByTerminology(
  term: string,
  entries: GlossaryEntry[],
  terminology: Terminology,
): GlossaryEntry[] {
  if (entries.length <= 1) return entries;

  const normalizedTerm = term.toLowerCase().trim();

  // AI: Try to extract a compound base (e.g. "dc" from "dc4tog").
  // If the term isn't a compound, baseTerm is just the term itself.
  const compoundMatch = normalizedTerm.match(/^([a-z]+)\d+tog$/);
  const baseTerm = compoundMatch ? compoundMatch[1] : normalizedTerm;

  return [...entries].sort((a, b) => {
    const aInterp = getEntryInterpretation(term, a, baseTerm);
    const bInterp = getEntryInterpretation(term, b, baseTerm);

    // AI: If we can't determine interpretation for either, keep original order.
    if (aInterp === null || bInterp === null) return 0;

    if (terminology === "us") {
      // AI: US interpretation first.
      if (aInterp === "us" && bInterp === "uk") return -1;
      if (aInterp === "uk" && bInterp === "us") return 1;
    } else {
      // AI: UK interpretation first.
      if (aInterp === "us" && bInterp === "uk") return 1;
      if (aInterp === "uk" && bInterp === "us") return -1;
    }
    return 0; // AI: Both same interpretation — keep original order.
  });
}
