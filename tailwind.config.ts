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
      boxShadow: {
        card: "0px 1px 2px rgba(0,0,0,0.04), 0px 2px 6px rgba(0,0,0,0.03)",
        "card-hover": "0px 4px 12px rgba(0,0,0,0.10)",
      },
      transitionDuration: {
        "100": "100ms",
      },
    }
  },
  plugins: []
};

export default config;
