# Hooked — Build Plan

A Google Chrome extension for crocheters: hover-to-define stitch abbreviations
and terms on any web page, and save pattern pages to a searchable, filterable
library of project cards.

---

## 1. Overview

**Hooked** has two core features:

1. **Stitch Mode** — Hover over crochet abbreviations and terms on any web page
   to see their definitions inline. Handles UK vs US terminology. Toggle on/off
   so it doesn't misfire on unrelated pages.
2. **Pattern Library** — Save any pattern webpage as a "card" with title, URL,
   status (To Try / WIP / Completed), tags, notes, and date saved. Search and
   filter the library from a docked side panel. Card images (favicon / Open
   Graph image) are resolved at display time, never stored, so each card is
   just a few hundred bytes.

Built with a provider abstraction so the glossary data source is swappable
and testable without reshaping the data model or UI.

---

## 2. Confirmed decisions

| Area | Decision |
| --- | --- |
| Build framework | **WXT** (Vite-based, MV3 first-class, clean DX, actively maintained) |
| UI | React + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand, synced to `chrome.storage.local` |
| Storage | `chrome.storage.local` for everything (10MB cap) |
| Stitch mode trigger | Manual toggle + keyboard shortcut (V1); auto-detect suggestion is V2 |
| Glossary scope | Crochet only — abbreviations + terms |
| UK/US handling | Bidirectional; user picks preferred region in settings |
| Definition content | Text only (no YouTube/external links in V1) |
| Pattern library UI | Popup = quick save + toggle; Side panel = library |
| Card fields | title, url, status, tags, notes, dateSaved (image resolved at display time) |
| Card images | Favicon → Open Graph image → bundled fallback icon (display-time, not stored) |
| Statuses | To Try, WIP, Completed |
| Save flow | Prefilled quick-form from the active page |
| Hover UX | Always highlight recognized terms; hover shows tooltip |
| PDF support | **V2** (V1 = web pages only) |

---

## 3. Stack rationale

WXT + React + TS + Tailwind + Zustand gives:

- **DOM manipulation** — content scripts via WXT's content-script entrypoints
- **Browser runtime environments** — MV3 service worker, side panel, popup
- **Local storage persistence** — `chrome.storage.local` via Zustand adapters
- **Lightweight interactive browser utilities** — tooltips, card grid, filters

This intentionally **does not overlap** with a separate planned clothes-organizer
web app, which will cover full-stack architecture, relational DB, auth, and
cloud media storage. Hooked stays client-side and extension-specific for
resume diversity.

---

## 4. Architecture

### 4.1 Entrypoints (WXT `entrypoints/` dir)

```
entrypoints/
  popup/
    index.html              # popup HTML shell
    main.tsx                # React mount
    App.tsx                 # quick-save form + stitch-mode toggle + "open library"
  sidepanel/
    index.html              # side panel HTML shell
    main.tsx                # React mount
    App.tsx                 # the patterns library (card grid, search, filters)
  background.ts             # service worker: side-panel open, og:image fetch, auto-detect, messaging
  stitch-mode.content.ts    # content script: scan DOM, highlight terms, render tooltips
```

### 4.2 Support modules (`src/` dir)

```
src/
  store/
    patterns.ts             # Zustand store: PatternCard[] (synced to storage.local)
    glossary.ts             # Zustand store: customEntries
    settings.ts             # Zustand store: stitchModeEnabled, autoDetectEnabled, region, provider
  data/
    glossary.ts             # hardcoded crochet glossary with UK<->US map
  lib/
    glossary/
      provider.ts           # GlossaryProvider interface (V2 AI slot)
      local.ts              # V1 LocalProvider (queries hardcoded + custom entries)
    detect.ts               # auto-detect heuristics (domain allowlist + keyword density)
    image.ts                # favicon / og:image / fallback resolver (display-time)
    messaging.ts            # typed wrappers around chrome.runtime messaging
  components/
    Card.tsx
    TagPill.tsx
    StatusBadge.tsx
    Tooltip.tsx
    SearchBar.tsx
    FiltersButton.tsx
    SaveForm.tsx
    EmptyState.tsx
  types.ts                  # PatternCard, GlossaryEntry, Tag, Status, Settings
```

---

## 5. Feature 1: Stitch Mode

### 5.1 Glossary data

Each entry:

```ts
interface GlossaryEntry {
  key: string                // stable id, e.g. "sc"
  us: string                 // US name, e.g. "single crochet"
  uk: string                 // UK name, e.g. "double crochet"
  aliases: string[]          // other spellings/abbreviations, e.g. ["ss", "sl st"]
  definition: string         // text-only definition
  category: string           // "abbreviation" | "term" | "technique"
}
```

A merged lookup index is built at runtime from keys + aliases + US names + UK
names so `sc`, `single crochet`, `dc` (UK), and `slst` all resolve to the
correct entry.

### 5.2 Settings

```ts
interface Settings {
  stitchModeEnabled: boolean
  autoDetectEnabled: boolean
  terminology: "us" | "uk"
  customEntries: GlossaryEntry[]
  provider: "local"
}
```

The user's chosen `terminology` (US or UK crochet terms — a preference, not
geography) sets the primary name displayed in tooltips for non-ambiguous
same-name-different-word entries (e.g. gauge/tension, yo/yoh). Ambiguous
abbreviations (dc, tr, etc.) are handled by page-level terminology detection
(Phase 4) or fall back to showing both interpretations.

### 5.3 Content script behavior (when stitch mode is ON)

1. Build a word-boundary regex from the merged lookup index.
2. Walk visible text nodes, skipping `<script>`, `<style>`, `<textarea>`,
   `contenteditable`, and already-wrapped nodes.
3. Wrap matches in `<mark class="hooked-term" data-key="...">` with a subtle
   dotted underline.
4. On hover, render a Shadow-DOM tooltip (CSS-isolated) showing:
   - Primary name (per user's terminology preference)
   - Other-region equivalent (only when us !== uk)
   - Definition text
5. `MutationObserver` watches for SPA/dynamic content; debounced and skips
   already-wrapped nodes for performance.

### 5.4 Toggle + auto-detect

- **Manual toggle** in popup flips `stitchModeEnabled` and messages the active
  tab's content script to activate/deactivate. Rendered as a compact toggle
  pill (Phase 4 redesign).
- **Keyboard shortcut** (Phase 4) toggles stitch mode without opening the
  popup, via the Chrome commands API.
- **Auto-detect** (V2 — deferred) would run in the background service worker
  on navigation: if the URL matches a known pattern-site domain allowlist
  (Ravelry, Etsy patterns, LoveCrafts, etc.), OR the page has high
  crochet-keyword density, message the popup to *suggest* enabling. Never
  silent auto-enable. Deferred because the suggestion UX risks feeling
  intrusive/naggy for V1's minimal settings surface, and manual toggle +
  keyboard shortcut already cover the core flow.

### 5.5 GlossaryProvider abstraction

All lookups go through a `GlossaryProvider` interface:

```ts
interface GlossaryProvider {
  lookup(term: string): Promise<GlossaryEntry[]>
  search(prefix: string): Promise<GlossaryEntry[]>
}
```

V1 ships `LocalProvider` (queries hardcoded glossary + user's `customEntries`).
The interface earns its keep through:

- **Testability** — tests can swap in a fake provider with deterministic data.
- **Separation of concerns** — "where definitions come from" is decoupled
  from "how we scan pages and render tooltips."
- **Future flexibility** — a different data source could be added later
  without touching call sites.

**AI provider deliberately not planned.** The crochet community has documented
concerns about AI (Ravelry banned AI-generated patterns in 2023). For a tool
built for crocheters, "AI-powered" can be an active negative signal to the
target audience rather than a positive one. The `provider` field stays in
`Settings` as a harmless slot, but no `AIProvider` is on the roadmap.

---

## 6. Feature 2: Pattern Library

### 6.1 Quick-save flow (popup)

1. User clicks the toolbar icon on any pattern page.
2. Popup opens a form prefilled with:
   - `title` — from `document.title`
   - `url` — from `chrome.tabs.query({ active, currentWindow })`
3. User picks a status, types/creates tags inline, adds notes.
4. Save → a lean card is written to storage:

```json
{
  "id": "<uuid>",
  "title": "Easy Granny Square",
  "url": "https://example.com/pattern",
  "status": "to-try",
  "tags": ["granny-square"],
  "notes": "",
  "dateSaved": 1719600000000
}
```

5. Toast confirmation. No image bytes are stored.

### 6.2 Side panel library

- **Card grid**: each card shows the display-time image (see 6.4), title,
  source hostname (parsed from `url`), status badge, and tag pills.
- **Top bar**:
  - Text search (matches title, notes, tags, source hostname)
  - Status filter (To Try / WIP / Completed / All)
  - Tag dropdown filter (multi-select; shows all tags currently in use)
- **Card click** → detail view: full notes, open URL button, edit, delete.

### 6.3 Tags

- Free-form, user-created inline while saving or editing.
- Stored as a normalized `string[]` on each card.
- The tag dropdown aggregates all tags currently in use across cards.

### 6.4 Card image resolution (display-time, not stored)

Card images are resolved when a card is rendered, never stored on the card.
This keeps each card to just a few hundred bytes.

Fallback chain (in order):
1. **Favicon** — `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
   loaded directly as an `<img src>` (no fetch/permission needed).
2. **Open Graph image** — fetch the page HTML via the background service worker
   (host permissions allow cross-origin fetches), parse
   `<meta property="og:image" content="...">`, and load that URL. The resolved
   og:image URL is cached in memory (Zustand) per card to avoid re-fetching on
   every render.
3. **Fallback icon** — a bundled generic crochet-hook SVG asset.

> Note: Google's favicon service usually returns *something*, so if we want the
> richer og:image preview to actually appear we should try og:image *first* and
> fall back to favicon. The order above matches the brainstorm; we'll confirm
> priority during implementation.

---

## 7. Data models

```ts
type Status = "to-try" | "wip" | "completed"

interface PatternCard {
  id: string
  title: string
  url: string
  status: Status
  tags: string[]
  notes: string
  dateSaved: number          // ms epoch; also used for sort + display
}

interface GlossaryEntry {
  key: string
  us: string
  uk: string
  aliases: string[]
  definition: string
  category: "abbreviation" | "term" | "technique"
}

interface Settings {
  stitchModeEnabled: boolean
  autoDetectEnabled: boolean
  terminology: "us" | "uk"
  customEntries: GlossaryEntry[]
  provider: "local"
}
```

Cards store **no image bytes**. The display-time image (favicon / og:image /
fallback) is resolved in the side panel via `src/lib/image.ts`.

---

## 8. Build phases (milestones)

### Phase 1 — Scaffold
- `pnpm dlx wxt@latest init` (select the React template — TS by default)
- Add Tailwind (WXT Tailwind recipe)
- Add Zustand + storage adapters wrapping `chrome.storage.local`
- Define `src/types.ts`
- Stub popup + side panel shells that can open each other
- Verify dev build (`pnpm dev`) loads in Chrome via `chrome://extensions`

### Phase 2 — Glossary + Stitch Mode V1
- Hardcode the crochet glossary (`src/data/glossary.ts`)
- Implement `GlossaryProvider` interface + `LocalProvider`
- Build the content script: DOM scan, highlight, Shadow-DOM tooltip
- Popup toggle for stitch mode + terminology selector
- Wire messaging between popup ↔ background ↔ content script
- Test on a real crochet pattern page

### Phase 3 — Pattern Library
- Quick-save form in popup (prefilled from active tab)
- `PatternCard` store with CRUD
- `src/lib/image.ts` favicon/og:image/fallback resolver + in-memory cache
- Side panel card grid + detail/edit/delete views
- Search bar + status filter + tag dropdown filter
- Empty states

### Phase 4 — Polish
- **Popup redesign:** collapse SaveForm behind a "Save this page" button (form
  no longer dominates the popup or auto-fills on blank tabs). Replace the
  stitch-mode checkbox with a compact toggle pill. Replace the terminology
  `<select>` with a US|UK segmented control. Both controls fit on one row,
  freeing vertical space.
- **Keyboard shortcut** for stitch-mode toggle (Chrome commands API) — toggle
  without opening the popup. `Ctrl+Shift+H` (Mac: `Cmd+Shift+H`), user can
  reassign at `chrome://extensions/shortcuts`.
- **Edge cases:** iframes (content script currently doesn't run in them —
  consider `all_frames: true` tradeoff), SPA navigation gaps (MutationObserver
  should catch new content but needs real-world testing).
- **Branding & visual polish:** warm/yarn-inspired theme (creams, soft browns,
  terracotta, sage green), friendly rounded shapes, logo + fallback card
  image (user-supplied), finalize `stitch-mode.css` + `tooltip.css` (currently
  placeholders).

> **Page-level terminology detection — deferred.** Originally planned for
> Phase 4: scan page text for "US terms"/"UK terms" phrases, then show only
> the detected interpretation for ambiguous abbreviations (dc, tr, etc.).
> Dropped because of false-positive risk: a page saying "this is NOT in US
> terms" or "I prefer US terms" would silently flip tooltips to the wrong
> interpretation, which is worse than the current behavior (show both,
> user's preferred first). Strict-phrase matching ("written in US terms")
> would reduce false positives but adds complexity for a small UX gain
> (one fewer line in the tooltip). The current "show both, user-pref first"
> behavior ships as V1. Detection could return in V2 with smarter context
> analysis or as an opt-in feature.

### Phase 5 — V2 (later)
- **Auto-detect** heuristics (domain allowlist + keyword density) +
  suggest-to-enable UX. Deferred from V1 because the suggestion banner risks
  feeling intrusive on V1's minimal settings surface. Ships when there's
  enough settings infrastructure to make the preference feel polished.
- **Page-level terminology detection** — if revisited, likely with stricter
  phrase matching or as an opt-in toggle ("Detect terminology automatically"
  in settings, off by default).
- PDF support via bundled PDF.js viewer page (extension page) so the content
  script can run inside PDFs (native Chrome PDF viewer blocks content scripts)
- Export/import library data
- Optional: progress %, hook/yarn used fields on cards

---

## 9. Known limitations (V1)

- **PDFs** — Chrome's native PDF viewer blocks content scripts, so stitch mode
  cannot run on PDF patterns in V1. Workaround planned for V2: detect PDF URLs
  and offer to reopen them in a bundled PDF.js viewer page where the content
  script can run.
- **Display-time images** — Favicon loads from Google's service (network); og:image
  requires a background-SW fetch of the page HTML (host permissions). Failed/slow
  fetches degrade gracefully to the fallback icon. Offline browsing shows favicons
  only if cached by the browser.
- **Text-only definitions** — No YouTube/external links in V1. The data model
  can accommodate a `url?` field later without migration.
- **Custom entries & ambiguity sorting** — When stitch mode encounters an
  ambiguous term (e.g. "dc", "double crochet"), the tooltip shows both
  interpretations, ordered by the user's terminology preference. The ordering
  logic (`src/lib/glossary/ambiguous.ts`) handles built-in glossary entries
  via two strategies: name matching (derivation from `us`/`uk` fields, works
  for full phrases) and a hardcoded abbreviation map (for abbreviations like
  "dc", since `aliases` is a flat `string[]` with no region tags). Future
  custom entries added by the user will work correctly for full-phrase
  ambiguity (name matching covers them) but NOT for custom ambiguous
  abbreviations (the hardcoded map only covers built-in terms). This is an
  edge case (a custom entry would need an abbreviation colliding with an
  existing ambiguous abbreviation AND meaning a different stitch). If it
  becomes relevant when custom entries ship, the fix is either enriching
  `aliases` to `Array<{ value: string; region?: "us" | "uk" | "both" }>` or
  letting users flag ambiguous custom entries in the form.

---

## 10. Resume positioning

Hooked demonstrates:
- DOM manipulation (content-script text wrapping, MutationObserver)
- Browser runtime environments (MV3 service worker, popup, side panel)
- Local storage persistence (`chrome.storage.local` + Zustand adapters)
- Lightweight interactive browser utilities (tooltips, card grid, filters)
- Provider-pattern abstraction (swappable, testable glossary data source)

Intentionally distinct from the planned clothes-organizer web app, which will
demonstrate full-stack architecture, relational database, authentication, and
cloud media storage.
