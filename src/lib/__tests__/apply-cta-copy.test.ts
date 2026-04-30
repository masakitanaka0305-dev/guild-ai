import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Apply CTA — wealth-operator copy v3", () => {
  const src = readFileSync(
    join(ROOT, "src/components/PlugInApply.tsx"),
    "utf-8",
  );

  it("renders 「この案件に応募する」 as the primary CTA label and aria-label", () => {
    expect(src).toContain('aria-label="この案件に応募する"');
    expect(src).toMatch(/"応募中\.\.\." : "この案件に応募する"/);
  });

  it("does NOT use the deprecated 「資産で応募する」 literal in the rendered tree", () => {
    // The old phrase only survives in jargon-lint comments (which test
    // strips). In the rendered button we expect the new copy only.
    expect(src).not.toMatch(/[^/]\s*資産で応募する/);
    // Also ensure the bare "Apply" English-only label is gone
    expect(src).not.toContain('"Applying…"');
    expect(src).not.toContain("Apply with selected MD");
  });

  it("renders the skill-certificate caption beneath the button", () => {
    expect(src).toContain("選んだ知能資産があなたのスキル証明になります");
  });
});
