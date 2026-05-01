import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Apply CTA — 知能をプラグイン (Hybrid Plug-in System)", () => {
  const src = readFileSync(
    join(ROOT, "src/components/PlugInApply.tsx"),
    "utf-8",
  );

  it("primary CTA reads 「知能をプラグイン（案件に参画）」 with the matching aria-label", () => {
    expect(src).toContain('aria-label="知能をプラグイン（案件に参画）"');
    expect(src).toContain("知能をプラグイン（案件に参画）");
    // Loading state copy
    expect(src).toContain('"プラグイン中..."');
  });

  it("retires the legacy エージェントをデプロイ CTA from the primary button", () => {
    // The literal CTA copy is gone (it lived in a button label + aria-label).
    expect(src).not.toMatch(/aria-label="エージェントをデプロイ"/);
    // Plugged-in label is the only emerald CTA on the surface
    expect(src).toContain("Plugged-in / デプロイ済み");
  });

  it("uses the lucide Plug icon (and CheckCircle2 in the plugged-in state)", () => {
    expect(src).toContain('import { Plug, CheckCircle2 } from "lucide-react"');
    expect(src).toMatch(/<Plug\b/);
    expect(src).toMatch(/<CheckCircle2\b/);
  });

  it("MD select label uses 「知能をプラグイン — 知能資産を選ぶ」", () => {
    expect(src).toContain("知能をプラグイン — 知能資産を選ぶ");
  });
});
