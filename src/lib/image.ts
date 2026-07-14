import { useState, useEffect } from "react";

// in-memory cache keyed by the card's page URL
const imageCache = new Map<string, string>();

// path to the bundled fallback SVG in public/
export const FALLBACK_IMAGE = "/hook-fallback.png";

// build a Google favicon URL for any page URL
export function faviconUrl(pageUrl: string): string {
  try {
    const hostname = new URL(pageUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    // pageUrl was malformed, fall straight to the bundled icon
    return FALLBACK_IMAGE;
  }
}

// returns the best available image URL for a card
// resolution order:
//   1. cached result
//   2. favicon (instant)
//   3. bundled fallback SVG

// AI TODO og:image can be tried before favicon for a richer thumbnail.
// That requires a background-SW fetch of the page HTML + host_permissions,
// so it's deferred. The cache + hook structure already supports it —
// just add an async upgrade step inside the useEffect below.
export function useCardImage(url: string): string {
  const [image, setImage] = useState<string>(
    () => imageCache.get(url) ?? faviconUrl(url),
  );

  useEffect(() => {
    const cached = imageCache.get(url);
    if (cached) {
      setImage(cached);
      return;
    }

    // start with favicon as the immediate fallback
    const fallback = faviconUrl(url);
    setImage(fallback);
    imageCache.set(url, fallback);

    // AI TODO (future): try og:image via background fetch here.
    // If found, setImage(ogUrl) and imageCache.set(url, ogUrl).
  }, [url]);

  return image;
}
