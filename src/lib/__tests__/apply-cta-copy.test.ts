import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Apply CTA — 案件に参画する (Compatibility Report Update)", () => {
  const src = readFileSync(
    join(ROOT, "src/components/PlugInApply.tsx"),
    "utf-8",
  );

  it("primary CTA reads 「案件に参画する」 with the matching aria-label", () => {
    expect(src).toContain('aria-label="案件に参画する"');
    expect(src).toContain("案件に参画する");
    // Loading state copy
    expect(src).toContain('"参画中..."');
  });

  it("retires the previous-iteration copy from the primary button", () => {
    expect(src).not.toMatch(/aria-label="知能をプラグイン（案件に参画）"/);
    expect(src).not.toMatch(/aria-label="エージェントをデプロイ"/);
  });

  it("Plugged-in state surfaces 「参画済み」 with CheckCircle2", () => {
    expect(src).toContain("参画済み");
    expect(src).toContain('aria-label="参画済み"');
    expect(src).toMatch(/<CheckCircle2\b/);
  });

  it("uses the lucide LogIn icon (and CheckCircle2 in the plugged-in state)", () => {
    expect(src).toContain('import { LogIn, CheckCircle2 } from "lucide-react"');
    expect(src).toMatch(/<LogIn\b/);
  });

  it("MD pre-select label uses 「この知能で参画します」 and the picker is read-only", () => {
    expect(src).toContain("この知能で参画します");
    expect(src).toContain('data-testid="apply-readonly-md"');
    // Legacy <select> picker is gone
    expect(src).not.toMatch(/<select\b/);
    expect(src).not.toContain('htmlFor="md-select"');
  });
});
