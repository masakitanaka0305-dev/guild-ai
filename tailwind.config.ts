import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        kuroko: "#1A1628",
        kaki: "#1A6BB5",
        "accent-green": "#0FA968",
        kami: "#FAFAFA",
        "surface-inset": "#F4F4F5",
        // ─── Friendly Intelligence Bank (kawaii) ──────────────────
        snow: "#FFFFFF",
        "snow-soft": "#FAFAF7",
        gold: "#D4A437",
        "gold-soft": "#F2DFA0",
        "gold-light": "#FFF8DC",
        "timee-yellow": "#FFCC00",
        ink: "#1A1628",
        "ink-muted": "#6F6884",
        // ─── Pro Theme (旧 terminal) ───────────────────────────────
        obsidian: "#0B0D10",
        "obsidian-2": "#11141A",
        slate: "#1B2027",
        "slate-2": "#232934",
        "slate-3": "#2E3540",
        "t-text": "#E8EBF0",
        "t-muted": "#98A1B0",
        divider: "#2A2F38",
        "t-gold": "#D4AF37",
        "t-gold-soft": "#B58E1A",
        positive: "#4DA968",
        negative: "#C45757",
        // ─── Nameraka Theme (なめらか ライト — デフォルト) ─────────────
        "n-bg": "#FAFAF7",
        "n-surface": "#FFFFFF",
        "n-surface-2": "#F5F3EE",
        "n-divider": "#EBEBEB",
        "n-text": "#1A1714",
        "n-muted": "#6B6456",
        "n-primary": "#E64545",
        "n-primary-hover": "#CC3A3A",
        "n-gold": "#D4AF37",
        "n-gold-soft": "#F2DFA0",
        "n-positive": "#0E9F4F",
        "n-negative": "#E64545",
        // ─── Midnight Theme (旧 nameraka ダーク) ─────────────────────
        "m-bg": "#0A192F",
        "m-surface": "#0E2240",
        "m-text": "#F1F4F9",
        "m-muted": "#9FB1C8",
        "m-primary": "#D4AF37",
      },
      fontFamily: {
        sans: ["var(--font-noto-jp)", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        card: "16px",
        sm:    "6px",
        DEFAULT: "8px",
        md:    "10px",
        lg:    "14px",
        xl:    "18px",
        "2xl": "22px",
        "3xl": "28px",
        full:  "9999px",
        // terminal overrides via CSS variables
        "t-sm": "var(--radius-sm, 2px)",
        "t-md": "var(--radius-md, 4px)",
        "t-lg": "var(--radius-lg, 6px)",
      },
      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        card: "0px 1px 2px rgba(0,0,0,0.04), 0px 2px 6px rgba(0,0,0,0.03)",
        "card-hover": "0px 4px 12px rgba(0,0,0,0.10)",
        "t-card": "0 0 0 1px var(--divider, #2A2F38)",
      },
      transitionDuration: {
        "100": "100ms",
      },
    }
  },
  plugins: []
};

export default config;
