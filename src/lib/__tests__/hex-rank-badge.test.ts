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

  it("S/A/B each have a distinct hex style triple (fill, stroke, label)", () => {
    expect(src).toContain('S: {');
    expect(src).toContain('A: {');
    expect(src).toContain('B: {');
    expect(src).toContain("#22D3EE"); // accent — used by S fill / A stroke
    expect(src).toContain("#0B1121"); // ink letter on S
    expect(src).toContain("#162035"); // surface — used by A & B fill
  });

  it("removes the legacy icon-based meta map (no Crown/Star/Leaf badges)", () => {
    expect(src).not.toMatch(/CrownIcon|StarIcon|LeafIcon/);
  });

  it("preserves the rank/sublabel a11y contract", () => {
    expect(src).toMatch(/aria-label=\{`ランク \$\{rank\} — \$\{style\.sublabel\}`\}/);
  });
});
