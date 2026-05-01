import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  contrastRatio,
  contrastRatioRounded,
} from "@/lib/contrast";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Readability Pass (#135) — text-muted contrast lift", () => {
  it("dark text-muted (#CBD5E1) clears AAA on the L0 abyss + L1 surface", () => {
    expect(contrastRatioRounded("#CBD5E1", "#020617")).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatioRounded("#CBD5E1", "#0E1422")).toBeGreaterThanOrEqual(7.0);
  });

  it("light text-muted (#334155) clears AAA on L0 white + L1 surface", () => {
    expect(contrastRatioRounded("#334155", "#F8FAFC")).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatioRounded("#334155", "#FFFFFF")).toBeGreaterThanOrEqual(7.0);
  });

  it("text-helper (footnote-only) still clears AA on its native surface", () => {
    // Helper is intentionally lower-contrast than muted but must still
    // reach AA (≥ 4.5) for legitimate footnote use.
    expect(contrastRatioRounded("#94A3B8", "#020617")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatioRounded("#64748B", "#F8FAFC")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("Readability Pass (#135) — text-helper token wired", () => {
  it("globals.css declares --color-text-helper for both themes", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/--color-text-helper:\s*#64748B/i);
    expect(css).toMatch(/--color-text-helper:\s*#94A3B8/i);
    // tailwind.config.ts exposes a Tailwind utility for it.
    const tw = read("tailwind.config.ts");
    expect(tw).toMatch(/helper:\s*"var\(--color-text-helper\)"/);
  });
});

describe("Readability Pass (#135) — guild metric-hero amount routes to gold", () => {
  it("OwnedAssetsSection 「今のあなたの価値」 uses metric-prime-gold (not brown / not purple)", () => {
    const src = read("src/components/ui/OwnedAssetsSection.tsx");
    // Title line is now gold via the metric-prime-gold helper.
    expect(src).toMatch(/className="metric-prime-gold tabular-nums mt-1"/);
    expect(src).not.toMatch(/text-brand-primary metric-prime tabular-nums mt-1/);
    // Per-asset valuation also flips to gold (was purple).
    expect(src).toMatch(/className="metric-prime-gold tabular-nums">\s*\{formatJpy\(a\.valuationJpy\)\}/);
  });

  it("metric-prime-gold resolves to the brand-secondary token in globals.css", () => {
    const css = read("src/app/globals.css");
    // Match the .metric-prime-gold rule and verify it references
    // var(--color-action-secondary) — the actual gold value resolves
    // via that token (#F59E0B), not via the brand purple.
    expect(css).toMatch(/\.metric-prime-gold\s*\{[\s\S]*?--color-action-secondary[\s\S]*?\}/);
  });
});

describe("Readability Pass (#135) — onboarding + repos + guild copy", () => {
  it("StepCard subtitle is body-weight + theme-aware muted color", () => {
    const src = read("src/components/intelligence-deck/StepCard.tsx");
    expect(src).toMatch(/data-testid="deck-step-subtitle"/);
    expect(src).toMatch(/font-medium text-base/);
    expect(src).toMatch(/text-\[var\(--color-text-muted\)\]/);
    // No more invisible-on-light hex literal.
    expect(src).not.toMatch(/text-\[#F1F5F9\]/);
  });

  it("DeckHome registered-count copy reads on both themes (full-strength brand-primary)", () => {
    const src = read("src/components/intelligence-deck/DeckHome.tsx");
    expect(src).toMatch(/text-brand-primary[^"]*font-semibold/);
    expect(src).not.toMatch(/text-brand-primary\/80/);
    expect(src).toMatch(/text-\[var\(--color-text-muted\)\]/);
  });

  it("/onboarding/repos heading + subtitle bound to theme-aware tokens", () => {
    const src = read("src/app/onboarding/repos/page.tsx");
    expect(src).toContain('data-testid="repos-h1"');
    expect(src).toContain('data-testid="repos-subtitle"');
    expect(src).toMatch(/text-\[var\(--color-text-primary\)\][^"]*mb-2/);
    expect(src).toMatch(/text-base font-medium text-\[var\(--color-text-muted\)\]/);
    // Breadcrumb dropped legacy `text-slate-400` for the muted token.
    expect(src).not.toMatch(/text-xs text-slate-400/);
  });

  it("/guild header subtitle + asset card titles use theme-aware tokens", () => {
    const guild = read("src/app/guild/page.tsx");
    expect(guild).toMatch(/font-medium text-\[var\(--color-text-muted\)\][\s\S]{0,80}あなたの知恵カード/);
    const owned = read("src/components/ui/OwnedAssetsSection.tsx");
    expect(owned).toContain('data-testid="owned-asset-title"');
    expect(owned).toContain('data-testid="owned-asset-guildid"');
    // Title body uses primary text token; GUILD id row uses muted.
    expect(owned).toMatch(/data-testid="owned-asset-title"[\s\S]{0,200}text-\[var\(--color-text-primary\)\]/);
    expect(owned).toMatch(/data-testid="owned-asset-guildid"[\s\S]{0,200}text-\[var\(--color-text-muted\)\]/);
  });

  it("guild stats pills use theme-aware muted labels + gold prime metric", () => {
    const guild = read("src/app/guild/page.tsx");
    expect(guild).toMatch(/text-\[10px\] font-medium leading-tight mb-0\.5 text-\[var\(--color-text-muted\)\]/);
    expect(guild).toMatch(/stat\.prime[\s\S]{0,40}"metric-prime-gold"/);
  });
});

describe("Readability Pass (#135) — light/dark parity contrast", () => {
  it("muted body copy clears AA on every documented surface", () => {
    // Dark
    for (const bg of ["#020617", "#0E1422", "#1A2238"]) {
      const r = contrastRatio("#CBD5E1", bg);
      expect(r, `dark muted on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
    // Light
    for (const bg of ["#F8FAFC", "#FFFFFF", "#F1F5F9"]) {
      const r = contrastRatio("#334155", bg);
      expect(r, `light muted on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("links + brand-primary on-primary stay AAA in both themes", () => {
    expect(contrastRatioRounded("#C4B5FD", "#020617")).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatioRounded("#6D28D9", "#F8FAFC")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatioRounded("#FFFFFF", "#4C1D95")).toBeGreaterThanOrEqual(7.0);
  });
});
