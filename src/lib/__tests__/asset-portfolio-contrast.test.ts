import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src  = readFileSync(
  join(ROOT, "src/components/AssetPortfolio.tsx"),
  "utf-8",
);

describe("/guild — Asset Portfolio readability", () => {
  it("card / row title is text-white + font-semibold + base/lg + tracking-tight", () => {
    // Mobile card title
    expect(src).toMatch(/data-testid="asset-card-title"[\s\S]{0,200}font-semibold text-base sm:text-lg text-white tracking-tight/);
    // PC table row title
    expect(src).toMatch(/font-semibold text-base text-white tracking-tight max-w-\[180px\] truncate/);
  });

  it("the four status chips each declare the spec'd cyan/emerald/amber/slate ring tokens", () => {
    // ASSET_STATUS_CONFIG (運用中 / 審査中 / 停止中)
    expect(src).toContain("bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40");
    expect(src).toContain("bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40");
    expect(src).toContain("bg-slate-500/20 text-slate-300 ring-1 ring-slate-400/40");
    // LIVE_STATUS_STYLE 待機中 (cyan)
    expect(src).toContain("bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40");
  });

  it("public endpoint is rendered as font-mono with the public-endpoint a11y label", () => {
    // Both PC table and mobile card use a font-mono <code> with aria-label
    const matches = src.match(/aria-label="公開エンドポイント"[\s\S]{0,200}font-mono/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("「+ 新しく投稿する」 button is the cyan primary, rounded-full, ≥44px", () => {
    expect(src).toMatch(/data-testid="new-listing-cta"[\s\S]{0,400}rounded-full/);
    expect(src).toMatch(/data-testid="new-listing-cta"[\s\S]{0,400}bg-ai-action/);
    expect(src).toMatch(/data-testid="new-listing-cta"[\s\S]{0,400}min-h-\[44px\]/);
    // Section uses the spec'd "新しく投稿する" label, not the legacy "投稿する" verb
    expect(src).toContain("＋ 新しく投稿する");
  });
});
