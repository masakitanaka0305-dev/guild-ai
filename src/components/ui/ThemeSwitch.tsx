"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "logic-white" | "midnight";

const STORAGE_KEY = "guild_theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "logic-white";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "midnight" ? "midnight" : "logic-white";
  } catch {
    return "logic-white";
  }
}

/**
 * Small theme toggle for the header. Logic White is the default; toggling
 * switches the html `data-theme` attribute to "midnight" and persists the
 * choice via localStorage.guild_theme.
 *
 * Render is intentionally tiny — single button, no dropdown — so it never
 * dominates the chrome.
 */
export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("logic-white");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    setHydrated(true);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "logic-white" ? "midnight" : "logic-white";
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("data-theme", next);
  }

  if (!hydrated) {
    // Avoid a hydration flicker — render an empty button until we know
    // the persisted preference.
    return (
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="w-9 h-9"
      />
    );
  }

  const isMidnight = theme === "midnight";
  return (
    <button
      type="button"
      data-testid="theme-switch"
      data-theme-state={theme}
      aria-label={isMidnight ? "Logic White に切り替えます" : "Midnight に切り替えます"}
      onClick={toggle}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] focus:outline focus:outline-2 focus:outline-[var(--color-ai-action)] transition-colors"
    >
      {isMidnight ? (
        <Sun aria-hidden className="w-5 h-5 stroke-[var(--color-ai-action)]" />
      ) : (
        <Moon aria-hidden className="w-5 h-5 stroke-[var(--color-text-muted)]" />
      )}
    </button>
  );
}
