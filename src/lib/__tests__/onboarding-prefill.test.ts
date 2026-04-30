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
    expect(src).toContain("Smart Pre-fill");
  });

  it("CTA reads 「確認して進む」 with the rounded-xl shape", () => {
    expect(src).toContain("確認して進む");
    expect(src).toContain("rounded-xl");
  });

  it("uses defaultValue (pre-fill) on the four confirmation inputs", () => {
    const matches = src.match(/defaultValue=\{(familyName|givenName|email|githubUrl|handle)\}/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(5);
  });

  it("ships the static water-glow shadow on the CTA (no animation)", () => {
    expect(src).toContain("shadow-water-glow");
  });
});
