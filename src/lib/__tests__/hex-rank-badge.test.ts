import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Hexagonal RankBadge", () => {
  const src = readFileSync(join(ROOT, "src/components/RankBadge.tsx"), "utf-8");

  it("renders ranks through the Hexagon component (geometric badge)", () => {
    expect(src).toContain('from "@/components/ui/Hexagon"');
    expect(src).toContain("<Hexagon");
  });

  it("Mercari Lightness #126 — sources medal colors from RANK_COLOR_TOKEN (金/銀/銅/みならい)", () => {
    expect(src).toContain("RANK_COLOR_TOKEN");
    expect(src).toContain("RANK_TIER");
    // Stroke palette mirrors the medal edges (gold / silver / bronze).
    expect(src).toContain("#CA8A04"); // 金 edge
    expect(src).toContain("#94A3B8"); // 銀 edge
    expect(src).toContain("#92400E"); // 銅 edge
  });

  it("removes the legacy icon-based meta map (no Crown/Star/Leaf badges)", () => {
    expect(src).not.toMatch(/CrownIcon|StarIcon|LeafIcon/);
  });

  it("preserves the rank/sublabel a11y contract", () => {
    expect(src).toMatch(/aria-label=\{`ランク \$\{rank\} — \$\{tier\}の太鼓判`\}/);
  });
});
