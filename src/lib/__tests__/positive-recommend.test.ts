import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Mercari Lightness (#126) — positive recommend + clone caption", () => {
  it("/projects/[id] missing requirement reads as a positive nudge", () => {
    const src = read("src/app/projects/[id]/page.tsx");
    expect(src).toContain('data-testid="missing-positive-recommend"');
    expect(src).toContain("まだ持っていません。似た知恵を出品してみよう");
  });

  it("PlugInApply clone caption is the emphasized headline", () => {
    const src = read("src/components/PlugInApply.tsx");
    expect(src).toContain('data-testid="apply-clone-caption"');
    // Bigger type + semibold so the line carries weight on the page.
    expect(src).toMatch(/text-base sm:text-lg font-semibold/);
    expect(src).toContain("あなたの思考をコピーしたAIが、企業のプロジェクトに参加します");
  });
});
