import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(join(ROOT, "src/components/ui/HexRankBadge.tsx"), "utf-8");

describe("HexRankBadge — Intelligence Proof colors + sub-labels", () => {
  it("uses RANK_COLOR_TOKEN from grading lib for fill color", () => {
    expect(src).toContain('from "@/lib/grading"');
    expect(src).toContain("RANK_COLOR_TOKEN");
  });

  it("renders an svg with role=img + aria-label including the rank and sub-label", () => {
    expect(src).toMatch(/role="img"/);
    expect(src).toMatch(/aria-label=\{ariaLabel\}/);
    expect(src).toMatch(/`\$\{rank\}ランク \$\{RANK_SUB_LABEL\[rank\]\}`/);
  });

  it("optionally shows the tier + sub-label caption beneath the hex", () => {
    expect(src).toContain("RANK_TIER");
    expect(src).toContain("RANK_SUB_LABEL");
    expect(src).toContain("showSubLabel");
  });

  it("data-rank attribute carries the rank for QA / styling hooks", () => {
    expect(src).toContain('data-rank={rank}');
    expect(src).toContain('data-testid="hex-rank-badge"');
  });
});
