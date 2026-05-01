import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Apply CTA — エージェントをデプロイ copy", () => {
  const src = readFileSync(
    join(ROOT, "src/components/PlugInApply.tsx"),
    "utf-8",
  );

  it("renders 「エージェントをデプロイ」 as the primary CTA label and aria-label", () => {
    expect(src).toContain('aria-label="エージェントをデプロイ"');
    expect(src).toMatch(/"派遣中\.\.\." : "エージェントをデプロイ"/);
  });

  it("does NOT ship the deprecated 「この案件に応募する」 literal", () => {
    // The old phrase only survives in jargon-lint comments (which the lint
    // strips). In the rendered button we expect the new copy only.
    expect(src).not.toMatch(/[^/]\s*この案件に応募する/);
    // Sanity: legacy English-only label and 資産で応募する remain forbidden
    expect(src).not.toContain('"Applying…"');
    expect(src).not.toContain("Apply with selected MD");
    expect(src).not.toMatch(/[^/]\s*資産で応募する/);
  });

  it("renders the thought-copy caption beneath the button", () => {
    expect(src).toContain("あなたの思考をコピーした AI が、企業のプロジェクトに参加します");
    expect(src).toContain("text-cyan-400/70");
  });

  it("uses lucide Send icon inside the CTA", () => {
    expect(src).toContain('import { Send } from "lucide-react"');
    expect(src).toMatch(/<Send[^/]*\/>/);
  });

  it("MD select label uses 「知能をプラグイン — 知能資産を選ぶ」", () => {
    expect(src).toContain("知能をプラグイン — 知能資産を選ぶ");
  });
});
