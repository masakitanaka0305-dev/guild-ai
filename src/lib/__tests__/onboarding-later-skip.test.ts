import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(
  join(ROOT, "src/app/onboarding/page.tsx"),
  "utf-8",
);

describe("Onboarding — later-skip for birthday/address", () => {
  it("ships an optional 任意項目 panel with a 「後で設定する →」 cyan secondary CTA", () => {
    expect(src).toMatch(/data-testid="onboarding-optional-fields"/);
    expect(src).toMatch(/data-testid="onboarding-later-skip"/);
    expect(src).toContain("後で設定する →");
    // Cyan secondary, ring-only, full tap target
    expect(src).toMatch(/data-testid="onboarding-later-skip"[\s\S]{0,500}text-brand-primary/);
    expect(src).toMatch(/data-testid="onboarding-later-skip"[\s\S]{0,500}min-h-11/);
    expect(src).toMatch(/data-testid="onboarding-later-skip"[\s\S]{0,500}rounded-full/);
  });

  it("birthday and address inputs render only after opt-in (default skipped)", () => {
    expect(src).toContain('id="birthday"');
    expect(src).toContain('id="address"');
    // Both inputs live behind a !showOptional ? skip : inputs branch
    expect(src).toContain("showOptional");
    expect(src).toMatch(/setShowOptional/);
    // No `required` attribute on the optional inputs
    expect(src).not.toMatch(/id="birthday"[^>]*\srequired/);
    expect(src).not.toMatch(/id="address"[^>]*\srequired/);
  });

  it("confirm screen footer mentions /profile editability", () => {
    expect(src).toContain("/profile でも編集できます");
  });
});
