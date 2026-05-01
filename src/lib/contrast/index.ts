// GUILD AI — WCAG 2.1 contrast ratio utility (#124)
//
// Implements the standard relative luminance formula and the
// (L1 + 0.05) / (L2 + 0.05) ratio. Returns a ratio in [1, 21].
//
//   AA normal text          ≥ 4.5
//   AA large text / UI      ≥ 3.0
//   AAA normal text         ≥ 7.0
//
// Used to gate the Midnight Logic palette during CI:
//   - bg-base × text-primary    must be ≥ 4.5
//   - bg-base × text-muted      must be ≥ 4.5
//   - ai-action × on-primary    must be ≥ 4.5
//   - ai-success × on-primary   must be ≥ 4.5
//
// Pure function — safe to call in tests and at module-load time.

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Parses #RRGGBB / #RGB into 0..255 channels. Throws on invalid input. */
export function parseHex(hex: string): RGB {
  const s = hex.trim().replace(/^#/, "");
  if (s.length === 3) {
    const [r, g, b] = s.split("").map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  if (s.length === 6) {
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
    };
  }
  throw new Error(`Invalid hex color: ${hex}`);
}

/** sRGB → linear-light component (used by relative luminance). */
function channelLuminance(c8: number): number {
  const c = c8 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance L = 0.2126 R + 0.7152 G + 0.0722 B (linear). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** Contrast ratio between two hex colors (1..21). */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Convenience: rounds to 1 decimal — matches what most a11y reports show. */
export function contrastRatioRounded(fg: string, bg: string): number {
  return Math.round(contrastRatio(fg, bg) * 10) / 10;
}

// ─── Canonical Midnight Logic combinations (used by tests + docs) ────────────
//
// Cinematic Mint (#128) — Midnight base dives to abyss-black (#020617),
// action color is Deep Purple (#4C1D95), link is violet-300 (#C4B5FD).
// Dark text-primary stays at slate-100 (#F8FAFC).

export const MIDNIGHT_PAIRS = [
  { name: "bg-base × text-primary",   fg: "#F8FAFC", bg: "#020617" },
  { name: "bg-base × text-muted",     fg: "#94A3B8", bg: "#020617" },
  { name: "bg-base × text-link",      fg: "#C4B5FD", bg: "#020617" },
  { name: "ai-action × on-primary",   fg: "#FFFFFF", bg: "#4C1D95" },
  { name: "ai-flow × dark-ink",       fg: "#020617", bg: "#8B5CF6" },
  { name: "ai-success × dark-ink",    fg: "#020617", bg: "#10B981" },
  { name: "bg-surface × text-primary",fg: "#F8FAFC", bg: "#0E1422" },
] as const;

// ─── Canonical Logic White combinations (#125, repalette #128) ───────────────
//
// Every pair below MUST clear AA (≥ 4.5:1) for normal text.

export const LOGIC_WHITE_PAIRS = [
  { name: "bg-base × text-primary",     fg: "#212121", bg: "#F8FAFC" },
  { name: "bg-surface × text-primary",  fg: "#212121", bg: "#FFFFFF" },
  { name: "bg-surface × text-muted",    fg: "#475569", bg: "#FFFFFF" },
  { name: "ai-action × on-primary",     fg: "#FFFFFF", bg: "#4C1D95" },
  { name: "ai-success × on-primary",    fg: "#FFFFFF", bg: "#059669" },
  { name: "rank-gold × text-primary",   fg: "#0F172A", bg: "#F59E0B" },
] as const;

// ─── Brand Palette pairs (#128 → #133 Visual Hierarchy) ───────────────────────
//
// 18 brand-locked combinations the user-facing UI must clear at AA.
// We sweep L0 / L1 / L2 surfaces against text-primary, text-muted, link,
// on-primary, secondary, success, and negative — once for the abyss
// (dark) palette and once for Logic White (light) so the two themes
// stay in parity.

export const BRAND_PALETTE_PAIRS = [
  // ── Dark / Abyss (#020617 / #0E1422 / #1A2238) ─────────────────────────────
  { name: "L0 abyss × text-primary",       fg: "#F8FAFC", bg: "#020617" },
  { name: "L0 abyss × text-muted",         fg: "#94A3B8", bg: "#020617" },
  { name: "L0 abyss × text-link",          fg: "#C4B5FD", bg: "#020617" },
  { name: "L1 surface (dark) × text-primary",   fg: "#F8FAFC", bg: "#0E1422" },
  { name: "L2 elevated (dark) × text-primary",  fg: "#F8FAFC", bg: "#1A2238" },
  { name: "brand-primary × on-primary (dark)",  fg: "#FFFFFF", bg: "#4C1D95" },
  { name: "brand-secondary × L0 abyss",         fg: "#F59E0B", bg: "#020617" },
  { name: "ai-success × L1 (dark) text",        fg: "#10B981", bg: "#0E1422" },
  { name: "ai-negative × L1 (dark) text",       fg: "#E64545", bg: "#0E1422" },

  // ── Light / Logic White (#F8FAFC / #FFFFFF / #F1F5F9) ──────────────────────
  { name: "L0 white × text-primary",       fg: "#212121", bg: "#F8FAFC" },
  { name: "L0 white × text-muted",         fg: "#475569", bg: "#F8FAFC" },
  { name: "L0 white × text-link",          fg: "#6D28D9", bg: "#F8FAFC" },
  { name: "L1 surface (light) × text-primary",  fg: "#212121", bg: "#FFFFFF" },
  { name: "L2 elevated (light) × text-primary", fg: "#212121", bg: "#F1F5F9" },
  { name: "brand-primary × on-primary (light)", fg: "#FFFFFF", bg: "#4C1D95" },
  { name: "brand-secondary × L0 ink",           fg: "#0F172A", bg: "#F59E0B" },
  // Emerald-600 is a status pill background; chip text reads as the
  // dark slate ink (white on emerald-600 only clears AA-large).
  { name: "ai-success × dark ink (light)",      fg: "#0F172A", bg: "#059669" },
  { name: "ai-negative × on-primary (light)",   fg: "#FFFFFF", bg: "#DC2626" },
] as const;
