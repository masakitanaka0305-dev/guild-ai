import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Apply CTA — 知能をプラグインする (Rezon Protocol)", () => {
  const src = readFileSync(
    join(ROOT, "src/components/PlugInApply.tsx"),
    "utf-8",
  );

  it("primary CTA reads 「知能をプラグインする（Plugin My Intelligence）」 with the matching aria-label", () => {
    expect(src).toContain('aria-label="知能をプラグインする"');
    expect(src).toContain("知能をプラグインする（Plugin My Intelligence）");
    expect(src).toContain('"プラグイン中..."');
  });

  it("retires the previous-iteration aria-label CTAs", () => {
    expect(src).not.toMatch(/aria-label="案件に参画する"/);
    expect(src).not.toMatch(/aria-label="知能をプラグイン（案件に参画）"/);
    expect(src).not.toMatch(/aria-label="エージェントをデプロイ"/);
  });

  it("Plugged-in state reads 「プラグイン済み（Plugged-in）」 with CheckCircle2", () => {
    expect(src).toContain("プラグイン済み（Plugged-in）");
    expect(src).toContain('aria-label="プラグイン済み"');
    expect(src).toMatch(/<CheckCircle2\b/);
  });

  it("uses the lucide LogIn icon (and CheckCircle2 in the plugged-in state)", () => {
    expect(src).toContain('import { LogIn, CheckCircle2 } from "lucide-react"');
    expect(src).toMatch(/<LogIn\b/);
  });

  it("MD pre-select label uses 「この知能で参画します」 and the picker stays read-only", () => {
    expect(src).toContain("この知能で参画します");
    expect(src).toContain('data-testid="apply-readonly-md"');
    expect(src).not.toMatch(/<select\b/);
  });

  it("subcaption beneath the CTA reads 「= 案件に参画する」", () => {
    expect(src).toContain("= 案件に参画する");
  });
});
