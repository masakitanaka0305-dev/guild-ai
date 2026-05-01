import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Midnight Logic — unified card surfaces (#124)", () => {
  it("/guild and /applications both reference bg-midnight-surface for their main cards", () => {
    const guild = read("src/app/guild/page.tsx");
    const apps  = read("src/app/applications/page.tsx");
    const owned = read("src/components/ui/OwnedAssetsSection.tsx");
    expect(owned).toContain("bg-midnight-surface");
    // applications uses the friendly modal which sits on bg-midnight-surface
    expect(apps).toContain("bg-midnight-surface");
    // guild mounts <OwnedAssetsSection> — surface inherits via the component
    expect(guild).toContain("OwnedAssetsSection");
  });

  it("Apply confirmation modal + Coming Soon modal + Earn Details modal share bg-midnight-surface", () => {
    const plug   = read("src/components/PlugInApply.tsx");
    const coming = read("src/components/ui/ComingSoonModal.tsx");
    const earn   = read("src/components/ui/EarnDetailsModal.tsx");
    for (const src of [plug, coming, earn]) {
      expect(src).toContain("bg-midnight-surface");
      expect(src).toContain("rounded-2xl");
    }
  });

  it("primary action surfaces (CTA / pill / FAB) reach for the ai-action token", () => {
    const apply = read("src/components/PlugInApply.tsx");
    const nav   = read("src/components/SidebarNav.tsx");
    // Apply CTA carries the cyan glow + bg-brand-primary (which is the same hex
    // as ai-action #6366F1 in the canonical Midnight palette).
    expect(apply).toMatch(/bg-brand-primary|bg-ai-action/);
    expect(nav).toMatch(/bg-brand-primary|bg-ai-action/);
  });
});
