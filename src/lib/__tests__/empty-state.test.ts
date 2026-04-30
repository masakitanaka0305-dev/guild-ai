import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("EmptyState — zero-MD fallback", () => {
  it("EmptyState component declares role=status and a 44px CTA", () => {
    const src = readFileSync(
      join(ROOT, "src/components/ui/EmptyState.tsx"),
      "utf-8",
    );
    expect(src).toMatch(/role="status"/);
    expect(src).toMatch(/min-h-\[44px\]/);
    // The void wears the hexagon — geometry only
    expect(src).toMatch(/from "@\/components\/ui\/Hexagon"/);
  });

  it("/guild renders the EmptyState with the spec'd copy when weapons.length === 0", () => {
    const src = readFileSync(
      join(ROOT, "src/app/guild/page.tsx"),
      "utf-8",
    );
    expect(src).toMatch(/from "@\/components\/ui\/EmptyState"/);
    expect(src).toContain("まだ知能を登記していません");
    expect(src).toContain("GitHub から始める");
    expect(src).toContain('ctaHref="/onboarding"');
  });
});
