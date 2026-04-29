"use client";

import { useEffect, useState } from "react";

export type Theme = "nameraka" | "pro" | "kawaii";
const THEMES: Theme[] = ["nameraka", "pro", "kawaii"];
const STORAGE_KEY = "guild_theme";

const THEME_LABELS: Record<Theme, string> = {
  nameraka: "なめらか",
  pro: "Pro",
  kawaii: "Kawaii",
};

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("nameraka");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored && THEMES.includes(stored) ? stored : "nameraka";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }

  return [theme, setTheme];
}

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="テーマ切替"
      className="flex items-center rounded-xl overflow-hidden border border-[var(--n-divider,#1F3A66)] text-[11px] font-sans"
    >
      {THEMES.map((t) => (
        <button
          key={t}
          role="radio"
          aria-checked={theme === t}
          onClick={() => setTheme(t)}
          className={`px-2.5 py-1.5 transition-colors ${
            theme === t
              ? "bg-[var(--n-gold,#D4AF37)] text-[#0A192F] font-bold"
              : "bg-[var(--n-surface,#0E2240)] text-[var(--n-muted,#9FB1C8)] hover:text-[var(--n-text,#F1F4F9)]"
          }`}
        >
          {THEME_LABELS[t]}
        </button>
      ))}
    </div>
  );
}

export function ThemeInitScript() {
  const script = `(function(){try{var t=localStorage.getItem('guild_theme');if(t&&['nameraka','pro','kawaii'].includes(t)){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme','nameraka');}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
