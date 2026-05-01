import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RANK_RARITY, getRarity, rarityShareTotal } from "@/lib/rank-rarity";

const ROOT = process.cwd();

describe("Rank rarity (#130) — distribution + captions", () => {
  it("each rank ships a recentSharePercent in (0, 100] and the totals add up to 100", () => {
    for (const r of ["S", "A", "B", "D"] as const) {
      const e = getRarity(r);
      expect(e.rank).toBe(r);
      expect(e.recentSharePercent).toBeGreaterThan(0);
      expect(e.recentSharePercent).toBeLessThanOrEqual(100);
    }
    expect(rarityShareTotal()).toBe(100);
    // S is the rarest, B/D the broadest tiers — sanity check.
    expect(RANK_RARITY.S.recentSharePercent).toBeLessThan(RANK_RARITY.A.recentSharePercent);
    expect(RANK_RARITY.A.recentSharePercent).toBeLessThan(RANK_RARITY.B.recentSharePercent);
  });

  it("captions are friendly (no fabricated %); particle counts decline with rarity", () => {
    expect(RANK_RARITY.S.caption).toContain("希少");
    expect(RANK_RARITY.S.caption).toContain("直近 100 件で 8%");
    expect(RANK_RARITY.A.caption).toContain("確かな実力");
    expect(RANK_RARITY.B.caption).toContain("着実な一歩");
    expect(RANK_RARITY.D.caption).toContain("次は太鼓判を狙いましょう");
    // Particles: S=6, A=2, B=0, D=0.
    expect(RANK_RARITY.S.particleCount).toBe(6);
    expect(RANK_RARITY.A.particleCount).toBe(2);
    expect(RANK_RARITY.B.particleCount).toBe(0);
    expect(RANK_RARITY.D.particleCount).toBe(0);
    // No FOMO copy.
    for (const r of Object.values(RANK_RARITY)) {
      expect(r.caption).not.toMatch(/急騰|暴落|％\s*上昇/);
    }
  });
});

describe("CinematicMint Phase 4 — rank-aware effects", () => {
  const cm = readFileSync(
    join(ROOT, "src/components/mint/CinematicMint.tsx"),
    "utf-8",
  );

  it("Phase 4 surfaces a rank-aware glow size + particle count", () => {
    expect(cm).toContain("getRarity(rank)");
    // glowSize varies with rank.
    expect(cm).toMatch(/glowSize\s*=\s*rank === "S"\s*\?\s*380/);
    expect(cm).toMatch(/data-rarity-percent=\{rarity\.recentSharePercent\}/);
    expect(cm).toMatch(/data-particle-count=\{rarity\.particleCount\}/);
    expect(cm).toContain('data-testid="cinematic-rank-particles"');
  });

  it("rarity caption is rendered under the valuation line", () => {
    expect(cm).toContain('data-testid="cinematic-rarity-caption"');
    expect(cm).toContain("{rarity.caption}");
  });
});
