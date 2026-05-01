import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(
  join(ROOT, "src/app/admin/model-settings/page.tsx"),
  "utf-8",
);

describe("/admin/model-settings — Logic White (#125)", () => {
  it("page mounts the four spec form sections (base / prompt / guardrails / output)", () => {
    expect(src).toContain("1. ベースモデル");
    expect(src).toContain("2. プロンプト方針");
    expect(src).toContain("3. 安全装置（ガードレール）");
    expect(src).toContain("4. 出力形式");
    // Each <FormSection> rolls into a <details> wrapper with a stable testid.
    const sections = src.match(/data-testid=\{`model-settings-section-\$\{title\}`\}/g) ?? [];
    expect(sections.length).toBeGreaterThanOrEqual(1);
  });

  it("primary CTA reads 「設定を保存して評価へ進みます」 with matching aria-label", () => {
    expect(src).toContain('data-testid="model-settings-primary"');
    expect(src).toContain('aria-label="設定を保存して評価へ進みます"');
    // Polite professional copy — verb form 「進みます」.
    expect(src).toContain("設定を保存して評価へ進みます");
    // Royal Blue CTA via the semantic token
    expect(src).toMatch(/bg-\[var\(--color-ai-action\)\]/);
    expect(src).toMatch(/text-white/);
  });

  it("PipelineStepper sits at the top with the three-stage spec labels", () => {
    expect(src).toContain('import { PipelineStepper } from "@/components/ui/PipelineStepper"');
    expect(src).toMatch(/<PipelineStepper\b/);
    expect(src).toContain('label: "学習"');
    expect(src).toContain('label: "評価"');
    expect(src).toContain('label: "デプロイ"');
  });
});
