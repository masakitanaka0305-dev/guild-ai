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
        primary: {
          DEFAULT: "#06B6D4",  // cyan-500
          hover: "#0891B2",    // cyan-600
          soft: "#164E63",     // cyan-950 dark
          foreground: "#020617",  // slate-950
        },
        // retain for negative indicators only
        negative: "#E64545",
        // Legacy tokens retained for existing components (not used in new Water theme UI)
        kuroko: "#1A1628",
        kaki: "#1A6BB5",
        "accent-green": "#0FA968",
        kami: "#FAFAFA",
        "surface-inset": "#F4F4F5",
        // ─── Nameraka Theme (legacy, retained for compat) ─────────────
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
        // ─── Water Guild — Hexagonal Robustness (active) ────────────
        water: {
          bg:             "#0B1121",
          surface:        "#162035",
          "surface-2":    "#1E293B",
          accent:         "#22D3EE",
          "accent-hover": "#06B6D4",
          text:           "#E2E8F0",
          muted:          "#94A3B8",
          divider:        "rgba(226,232,240,0.10)",
        },
        // ─── ギルドAI — role color tokens (#123) ────────────────────
        // The dashboard mixes these three so the surface communicates
        // "intelligence is cross-functional, not siloed".
        roleDev:    "#22D3EE", // cyan-400
        roleDesign: "#A78BFA", // violet-400
        rolePM:     "#FDE047", // amber/yellow-300
      },
      boxShadow: {
        card: "0px 1px 2px rgba(0,0,0,0.04), 0px 2px 6px rgba(0,0,0,0.03)",
        "card-hover": "0px 4px 12px rgba(0,0,0,0.10)",
        "water-glow": "0 0 0 1px rgba(34,211,238,0.35), 0 8px 24px -12px rgba(34,211,238,0.45)",
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
      },
      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "100": "100ms",
      },
    }
  },
  plugins: []
};

export default config;
