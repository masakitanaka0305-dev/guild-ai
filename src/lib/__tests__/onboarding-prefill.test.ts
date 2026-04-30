import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Onboarding — Smart Pre-fill confirmation", () => {
  const src = readFileSync(
    join(ROOT, "src/app/onboarding/page.tsx"),
    "utf-8",
  );

  it("uses splitJapaneseName for family/given pre-fill", () => {
    expect(src).toContain('from "@/lib/name-split"');
    expect(src).toContain("splitJapaneseName(MOCK_OAUTH_PROFILE.fullName)");
  });

  it("renders the confirmation heading (not 「入力」)", () => {
    expect(src).toContain("内容を確認してください");
    expect(src).toContain("SMART PRE-FILL");
  });

  it("CTA reads 「確認して進む」 with the rounded-xl shape", () => {
    expect(src).toContain("確認して進む");
    expect(src).toContain("rounded-xl");
  });

  it("renders the readonly summary by default with <dl>/<dt>/<dd>", () => {
    expect(src).toContain("<dl");
    expect(src).toContain("<dt");
    expect(src).toContain("<dd");
    // editMode toggle exists
    expect(src).toContain("editMode");
    expect(src).toContain("setEditMode");
  });

  it("exposes an 「編集する」 toggle that switches to <input> mode", () => {
    expect(src).toContain("編集する");
    expect(src).toContain("キャンセル");
    // Inputs exist behind the editMode branch
    expect(src).toMatch(/defaultValue=\{(familyName|givenName|email|githubUrl|handle)\}/);
  });

  it("ships the static water-glow shadow on the CTA (no animation)", () => {
    expect(src).toContain("shadow-water-glow");
  });

  it("has a single agreement checkbox before the CTA", () => {
    expect(src).toContain("同意します");
    expect(src).toMatch(/type="checkbox"/);
  });
});
