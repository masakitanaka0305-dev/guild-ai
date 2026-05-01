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
        // ─── Brand Palette (#127) — Final Polish ───────────────────
        // Three-color UI lock: Mercari Purple primary, お礼 Gold accent,
        // Cyan helper (warn/helper only — never a CTA).
        brand: {
          primary:        "var(--color-action-primary)",         // #6366F1
          "primary-hover": "var(--color-action-primary-hover)",  // #4F46E5
          "primary-soft": "var(--color-action-primary-soft)",    // #E0E7FF
          secondary:      "var(--color-action-secondary)",       // #FBBF24
          "secondary-soft": "var(--color-action-secondary-soft)",// #FEF3C7
          "cyan-helper":  "var(--color-cyan-helper)",            // #06B6D4 (warn/helper only)
        },
        primary: {
          DEFAULT: "var(--color-action-primary)",
          hover:   "var(--color-action-primary-hover)",
          soft:    "var(--color-action-primary-soft)",
          foreground: "#FFFFFF",
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
        // ─── Logic White (#125) is the default; Midnight Logic stays
        //     as the dark pro toggle. Both palettes flow through the
        //     same semantic CSS variables, so `bg-midnight-base` /
        //     `text-text-primary` / `bg-ai-action` automatically swap
        //     with the html `data-theme` attribute.
        midnight: {
          base:    "var(--color-bg-base)",
          surface: "var(--color-bg-surface)",
          panel:   "var(--color-bg-surface)",
          elevated:"var(--color-bg-elevated)",
        },
        ai: {
          action:  "var(--color-ai-action)",   // Royal Blue (white) / Cyan (midnight)
          flow:    "var(--color-ai-flow)",
          success: "var(--color-ai-success)",
          warn:    "var(--color-ai-warn)",
          negative:"var(--color-ai-negative)",
        },
        text: {
          primary:      "var(--color-text-primary)",
          muted:        "var(--color-text-muted)",
          "on-primary": "var(--color-text-on-primary)",
        },
        // Water Guild legacy alias — also routes through CSS variables
        // so `bg-water-bg` etc. tracks the active theme.
        water: {
          bg:             "var(--color-bg-base)",
          surface:        "var(--color-bg-surface)",
          "surface-2":    "var(--color-bg-elevated)",
          accent:         "var(--color-ai-action)",
          "accent-hover": "#4338CA",
          text:           "var(--color-text-primary)",
          muted:          "var(--color-text-muted)",
          divider:        "var(--color-border-subtle)",
        },
        // ─── ギルドAI — role color tokens (#123) ────────────────────
        // The dashboard mixes these three so the surface communicates
        // "intelligence is cross-functional, not siloed".
        roleDev:    "#6366F1", // ai-action — Mercari Purple (#127)
        roleDesign: "#7C3AED", // ai-flow   — Violet
        rolePM:     "#FBBF24", // 金 (brand-secondary gold, #127)
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
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "purple-ripple": {
          "0%":   { opacity: "0.6", transform: "scale(0.95)" },
          "60%":  { opacity: "0.35", transform: "scale(1.04)" },
          "100%": { opacity: "0",   transform: "scale(1.05)" },
        },
      },
      animation: {
        "fade-in": "fade-in 320ms ease-out both",
        "purple-ripple": "purple-ripple 220ms ease-out forwards",
      },
    }
  },
  plugins: []
};

export default config;
