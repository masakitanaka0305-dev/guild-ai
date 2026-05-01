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
        // ─── Midnight Logic — Pro tier palette (#124, canonical) ────
        // bg-base #0F172A / bg-surface #1E293B / bg-elevated #293548
        // ai-action #06B6D4 / ai-flow #8B5CF6 / ai-success #10B981
        midnight: {
          base:    "#0F172A",
          surface: "#1E293B",
          panel:   "#1E293B",   // alias for "card panel"
          elevated:"#293548",
        },
        ai: {
          action:  "#06B6D4",   // Electric Cyan — primary CTA
          flow:    "#8B5CF6",   // Electric Violet — generation / multi-dim
          success: "#10B981",   // Neon Mint — live / OK
          warn:    "#F59E0B",
          negative:"#E64545",
        },
        text: {
          primary: "#F8FAFC",
          muted:   "#94A3B8",
        },
        // ─── Water Guild legacy alias (now resolves to Midnight) ─────
        // Existing components keep referencing `bg-water-bg` etc. — the
        // hex below mirrors the canonical Midnight tokens above.
        water: {
          bg:             "#0F172A",
          surface:        "#1E293B",
          "surface-2":    "#293548",
          accent:         "#06B6D4",
          "accent-hover": "#0891B2",
          text:           "#F8FAFC",
          muted:          "#94A3B8",
          divider:        "rgba(248,250,252,0.10)",
        },
        // ─── ギルドAI — role color tokens (#123) ────────────────────
        // The dashboard mixes these three so the surface communicates
        // "intelligence is cross-functional, not siloed".
        roleDev:    "#06B6D4", // ai-action — was cyan-400 #22D3EE
        roleDesign: "#8B5CF6", // ai-flow   — was violet-400 #A78BFA
        rolePM:     "#FDE047", // amber/yellow-300 (太鼓判 gold tone)
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
