import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(
  join(ROOT, "src/app/onboarding/page.tsx"),
  "utf-8",
);

describe("Onboarding wizard — Step A (GitHub) → Step B (role) → Step 0 (confirm)", () => {
  it("Step A renders the GitHub-connect card with a single primary CTA", () => {
    expect(src).toMatch(/data-testid="onboarding-step-a"/);
    expect(src).toContain("Step A — GitHub 連携");
    expect(src).toContain("GitHub から始める");
    expect(src).toMatch(/data-testid="onboarding-github-connect"/);
    expect(src).toContain('aria-label="GitHub と連携する"');
  });

  it("Step B renders 3 role tiles (engineer / designer / pdm) with role=radio + aria-checked", () => {
    expect(src).toMatch(/data-testid="onboarding-step-b"/);
    expect(src).toContain("Step B — 職種選択");
    expect(src).toContain("ROLE_TILES");
    expect(src).toMatch(/data-testid=\{`role-tile-\$\{t\.id\}`\}/);
    expect(src).toMatch(/role="radio"/);
    expect(src).toMatch(/aria-checked=\{selected\}/);
    // The 3 role ids exist in the ROLE_TILES table
    expect(src).toMatch(/id:\s*"engineer"/);
    expect(src).toMatch(/id:\s*"designer"/);
    expect(src).toMatch(/id:\s*"pdm"/);
    // Tap on a tile pushes the wizard forward and stamps the role
    expect(src).toMatch(/onClick=\{\(\) => \{[\s\S]*?setRole\(t\.id\)[\s\S]*?setWizardStep\("confirm"\)/);
  });

  it("Wizard supports a ?role= deep link that skips Step B", () => {
    expect(src).toContain('searchParams.get("role")');
    expect(src).toContain("validQueryRole");
    expect(src).toMatch(/initialWizard:\s*"github"\s*\|\s*"role"\s*\|\s*"confirm"/);
  });

  it("Step 0 (confirm) stays guarded by wizardStep === \"confirm\"", () => {
    expect(src).toMatch(/phase === "form" && wizardStep === "confirm"/);
    expect(src).toContain("内容を確認してください");
    expect(src).toContain("確認して進む");
  });
});
