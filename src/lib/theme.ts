import { useEffect } from "react";
import { useSettingsStore } from "@/src/store/settings";
import type { Theme } from "@/src/types";

// Resolves the active theme to a concrete light/dark value. "system" follows
// the OS prefers-color-scheme media query; "light"/"dark" are used as-is.
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

// React hook that keeps the `.dark` class on <html> in sync with the user's
// theme setting. Mount once near the root of each UI (popup + side panel).
// When theme is "system", it also subscribes to OS changes so the UI swaps
// live without needing to reopen the panel.
export function useTheme(): void {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const resolved = resolveTheme(theme);
      root.classList.toggle("dark", resolved === "dark");
    };

    apply();

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}