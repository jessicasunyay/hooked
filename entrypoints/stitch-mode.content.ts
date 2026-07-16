import { useSettingsStore } from "@/src/store/settings";
import { LocalProvider } from "@/src/lib/glossary/local";
import { onMessage } from "@/src/lib/messaging";
import type { GlossaryEntry, Terminology } from "@/src/types";
import { sortEntriesByTerminology } from "@/src/lib/glossary/ambiguous";
import { resolveTheme } from "@/src/lib/theme";
import "@/src/styles/stitch-mode.css";
import tooltipCss from "@/src/styles/tooltip.css?raw";

// scans the page's text for crochet abbreviations, wraps them in <mark> elements, and shows tooltips on hover 

// variables that persist for the lifetime of the page
let isActive = false; // wether stitch mode is currently scanning the page
let provider: LocalProvider | null = null; // the glossary provider (created on init)
let scanRegex: RegExp | null = null; // the regex built from the glossary
let unsubscribe: (() => void) | null = null; // cleanup function for the message listener

// tooltip state
let tooltipHost: HTMLDivElement | null = null; // the host element
let tooltipShadow: ShadowRoot | null = null; // the shadow root
let currentMark: HTMLElement | null = null; // which mark we're currently showing the tooltip for
let hoverTimer: number | null = null; // timer for the show-on-hover delay
const HOVER_DELAY_MS = 150; // wait this long before showing the tooltip

// mutation observer state
let observer: MutationObserver | null = null; // the MutationObserver instance
let observerTimer: number | null = null; // debounce timer
const OBSERVER_DEBOUNCE_MS = 250; // wait this long after the last mutation before re-scanning

// tag names that contain text we shouldn't touch
const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "NOSCRIPT",
]);

// chunking for faster loading
const CHUNK_SIZE = 50;

// scanning the page for terms
async function activate() {
  if (!provider || !scanRegex) return;
  isActive = true;

  console.log("[Hooked] Stitch mode activated — scanning page...");

  createTooltip();

  // add hover event to the page
  document.body.addEventListener("mouseover", onMouseOver);
  document.body.addEventListener("mouseout", onMouseOut);

  startObserver();

  // collect all text nodes into an array first
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Node): number {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest("mark.hooked-term")) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[contenteditable=""], [contenteditable="true"]')) {
          return NodeFilter.FILTER_REJECT;
        }
        const text = textNode.nodeValue ?? "";
        if (!text.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  let current: Node | null;
  while ((current = walker.nextNode())) {
    textNodes.push(current as Text);
  }

  // process text nodes in chunks, yielding between batches
  let index = 0;
  let wrapCount = 0;

  function processChunk() {
    // check isActive every chunk
    if (!isActive) return;

    const end = Math.min(index + CHUNK_SIZE, textNodes.length);
    for (; index < end; index++) {
      wrapCount += wrapMatchesInTextNode(textNodes[index], scanRegex!);
    }

    if (index < textNodes.length) {
      // more nodes to process, so schedule the next chunk and yield
      setTimeout(processChunk, 0);
    } else {
      console.log(`[Hooked] Wrapped ${wrapCount} term(s) on this page.`);
    }
  }

  processChunk();
}

// wrap matches in a single text node
// wrap each crochet term in a <mark class="hooked-term" data-key="..."> element
// returns the number of matches wrapped.

function wrapMatchesInTextNode(textNode: Text, regex: RegExp): number {
  const text = textNode.nodeValue ?? "";
  if (!text) return 0;

  // skip text nodes that contain no letters at all
  if (!/[a-z]/i.test(text)) return 0;

  // collect all matches with their indices
  const matches: { index: number; term: string }[] = [];
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ index: match.index, term: match[0] });
  }

  if (matches.length === 0) return 0;

  const parent = textNode.parentElement;
  if (!parent) return 0;

  // process in REVERSE order so earlier indices stay valid
  for (let i = matches.length - 1; i >= 0; i--) {
    const { index, term } = matches[i];

    // afterStart = new text node starting at the match (from match to end)
    // textNode is shortened to contain only text before the match.
    const afterStart = textNode.splitText(index);

    // afterMatch = a new text node with everything after the match
    const afterMatch = afterStart.splitText(term.length);

    // data-key stores the matched term (original casing) so the tooltip can look it up via provider.lookup() when the user hovers
    const mark = document.createElement("mark");
    mark.className = "hooked-term";
    mark.dataset.key = term;
    mark.textContent = afterStart.nodeValue;

    // replace afterStart (the matched text) with the <mark>
    parent.replaceChild(mark, afterStart);
  }

  return matches.length;
}

function createTooltip(): void {
  tooltipHost = document.createElement("div");
  tooltipHost.id = "hooked-tooltip-host";
  tooltipHost.style.position = "fixed";
  tooltipHost.style.top = "0";
  tooltipHost.style.left = "0";
  tooltipHost.style.zIndex = "2147483647"; // max z-index
  tooltipHost.style.pointerEvents = "none"; // let clicks pass through
  tooltipHost.style.display = "none"; // hidden until we show it

  // closed so the page can't peek inside
  tooltipShadow = tooltipHost.attachShadow({ mode: "closed" });

  tooltipShadow.innerHTML = `
    <style>${tooltipCss}</style>
    <div class="hooked-tooltip"></div>
  `;

  document.body.appendChild(tooltipHost);
}

function buildTooltipContent(entries: GlossaryEntry[], terminology: Terminology): HTMLElement {
  const container = document.createElement("div");
  container.className = "hooked-tooltip";

  for (const entry of entries) {
    const entryDiv = document.createElement("div");
    entryDiv.className = "hooked-tooltip__entry";

    const namesDiv = document.createElement("div");
    namesDiv.className = "hooked-tooltip__names";

    const primaryName = document.createElement("span");
    primaryName.className = "hooked-tooltip__name hooked-tooltip__name--primary";
    primaryName.textContent = terminology === "us" ? entry.us : entry.uk;
    namesDiv.appendChild(primaryName);

    // only show the equivalent name when us !== uk
    if (entry.us !== entry.uk) {
      const equivName = document.createElement("span");
      equivName.className = "hooked-tooltip__name hooked-tooltip__name--equiv";
      const label = terminology === "us" ? "UK" : "US";
      const equivText = terminology === "us" ? entry.uk : entry.us;
      equivName.textContent = `${label}: ${equivText}`;
      namesDiv.appendChild(equivName);
    }

    entryDiv.appendChild(namesDiv);

    // definition paragraph
    const defP = document.createElement("p");
    defP.className = "hooked-tooltip__def";
    defP.textContent = entry.definition;
    entryDiv.appendChild(defP);

    container.appendChild(entryDiv);
  }

  return container;
}

// show tooltip on hover
async function showTooltipForMark(mark: HTMLElement): Promise<void> {
  if (!provider || !tooltipHost || !tooltipShadow) return;

  const term = mark.dataset.key ?? "";
  if (!term) return;

  currentMark = mark;

  const entries = await provider.lookup(term);
  if (entries.length === 0) return;

  if (currentMark !== mark) return;

  await useSettingsStore.persist.rehydrate();
  const settings = useSettingsStore.getState();
  const terminology = settings.terminology;

  // sort entries so the user's terminology interpretation comes first
  const sortedEntries = sortEntriesByTerminology(term, entries, terminology);

  const content = buildTooltipContent(sortedEntries, terminology);

  // match the tooltip to the user's theme (shadow DOM is isolated from the
  // document's `.dark` class, so we toggle a local class on the tooltip)
  if (resolveTheme(settings.theme) === "dark") {
    content.classList.add("dark");
  }

  const oldContent = tooltipShadow.querySelector(".hooked-tooltip");
  if (oldContent) {
    oldContent.replaceWith(content);
  } else {
    tooltipShadow.appendChild(content);
  }

  // position the tooltip near the mark, then make it visible
  positionTooltip(mark);
  tooltipHost.style.display = "block";
}

function positionTooltip(mark: HTMLElement): void {
  if (!tooltipHost) return;

  const rect = mark.getBoundingClientRect();
  const gap = 8; // pixels between the mark and the tooltip

  // default position
  let top = rect.bottom + gap;
  let left = rect.left;

  // check if tooltip fits
  tooltipHost.style.visibility = "hidden";
  tooltipHost.style.display = "block";
  const tooltipHeight = tooltipHost.offsetHeight;
  const tooltipWidth = tooltipHost.offsetWidth;

  if (top + tooltipHeight > window.innerHeight) {
    top = rect.top - gap - tooltipHeight;
    if (top < 0) top = gap;
  }

  if (left + tooltipWidth > window.innerWidth) {
    left = window.innerWidth - tooltipWidth - gap;
  }

  if (left < 0) left = gap;

  tooltipHost.style.top = `${top}px`;
  tooltipHost.style.left = `${left}px`;
  tooltipHost.style.visibility = "visible";
}

// hide tooltip
function hideTooltip(): void {
  if (tooltipHost) {
    tooltipHost.style.display = "none";
  }
  currentMark = null;
}

// hover event handlers
function onMouseOver(e: MouseEvent): void {
  const target = e.target as Element | null;
  if (!target) return;
  const mark = target.closest("mark.hooked-term");
  if (!(mark instanceof HTMLElement)) return;

  // clear any pending hide
  if (hoverTimer !== null) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }

  // show tooltip after a short delay
  hoverTimer = window.setTimeout(() => {
    showTooltipForMark(mark);
    hoverTimer = null;
  }, HOVER_DELAY_MS);
}

function onMouseOut(e: MouseEvent): void {
  const target = e.target as Element | null;
  if (!target) return;
  const mark = target.closest("mark.hooked-term");
  if (!mark) return;

  // clear any pending show
  if (hoverTimer !== null) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }

  hideTooltip();
}

function startObserver(): void {
  if (!scanRegex) return;

  observer = new MutationObserver((mutations: MutationRecord[]) => {
    const hasAddedNodes = mutations.some(
      (m) => m.addedNodes.length > 0,
    );
    if (!hasAddedNodes) return;

    if (observerTimer !== null) {
      clearTimeout(observerTimer);
    }
    observerTimer = window.setTimeout(() => {
      observerTimer = null;
      if (!isActive) return; // user toggled off during the debounce window.
      scanMutatedNodes(mutations);
    }, OBSERVER_DEBOUNCE_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function scanMutatedNodes(mutations: MutationRecord[]): void {
  if (!scanRegex) return;

  let scanCount = 0;

  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        scanCount += wrapMatchesInTextNode(node as Text, scanRegex);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.id === "hooked-tooltip-host") continue;
        if (element.closest("mark.hooked-term")) continue;

        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode(n: Node): number {
              const textNode = n as Text;
              const parent = textNode.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
              if (parent.closest("mark.hooked-term")) return NodeFilter.FILTER_REJECT;
              if (parent.closest('[contenteditable=""], [contenteditable="true"]')) {
                return NodeFilter.FILTER_REJECT;
              }
              const text = textNode.nodeValue ?? "";
              if (!text.trim()) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            },
          },
        );

        let current: Node | null;
        while ((current = walker.nextNode())) {
          scanCount += wrapMatchesInTextNode(current as Text, scanRegex);
        }
      }
    }
  }

  if (scanCount > 0) {
    console.log(`[Hooked] MutationObserver wrapped ${scanCount} new term(s).`);
  }
}

// deactivate stitch mode
function deactivate() {
  isActive = false;

  // clear any pending hover timer
  if (hoverTimer !== null) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }

  if (observerTimer !== null) {
    clearTimeout(observerTimer);
    observerTimer = null;
  }
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // remove hover event listeners
  document.body.removeEventListener("mouseover", onMouseOver);
  document.body.removeEventListener("mouseout", onMouseOut);

  if (tooltipHost) {
    tooltipHost.remove();
    tooltipHost = null;
    tooltipShadow = null;
  }
  currentMark = null;

  const marks = document.querySelectorAll("mark.hooked-term");
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;

    const textNode = document.createTextNode(mark.textContent ?? "");
    parent.replaceChild(textNode, mark);

    parent.normalize();
  });

  console.log(`[Hooked] Stitch mode deactivated — unwrapped ${marks.length} term(s).`);
}

// content script entrypoint
export default defineContentScript({
  // run on every page
  matches: ["<all_urls>"],
  // AI: Run in every frame, including iframes. tabs.sendMessage without a
  // frameId reaches all frames, so the STITCH_MODE_TOGGLE message auto-
  // propagates. Cost when stitch mode is OFF is minimal (one listener per
  // frame). Crochet sites rarely put pattern text in iframes, but this
  // covers the edge case for aggregator/embed layouts.
  allFrames: true,

  async main() {
    // read settings from storage
    await useSettingsStore.persist.rehydrate();
    const settings = useSettingsStore.getState();

    // create the glossary provider with the user's custom entries merged
    provider = new LocalProvider(settings.customEntries);
    scanRegex = provider.getScanRegex();

    // register message listener
    // when the user flips the toggle in the popup:
    //   1. popup updates its store (persists to chrome.storage.local)
    //   2. popup sends STITCH_MODE_TOGGLE to the background
    //   3. background relays it to this content script via tabs.sendMessage
    //   4. we receive it here and activate/deactivate without a page refresh

    unsubscribe = onMessage((message) => {
      switch (message.type) {
        case "STITCH_MODE_TOGGLE":
          if (message.enabled) {
            activate();
          } else {
            deactivate();
          }
          break;
      }
    });

    // if stitch mode was already enabled, activate immediately on page load
    if (settings.stitchModeEnabled) {
      activate();
    }
  },
});
