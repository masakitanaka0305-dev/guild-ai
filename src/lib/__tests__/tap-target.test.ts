import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Tap-target audit — 44px floor on primary CTAs", () => {
  it("each Water Guild primary CTA component declares min-h-[44px]", () => {
    const targets = [
      "src/components/PlugInApply.tsx",
      "src/components/ui/BackArrow.tsx",
      "src/components/ui/EmptyState.tsx",
    ];
    for (const rel of targets) {
      const c = readFileSync(join(ROOT, rel), "utf-8");
      expect(c, `${rel} should set min-h-[44px] on its primary affordance`).toMatch(
        /min-h-\[44px\]/,
      );
    }
  });

  it("BottomNav tabs and the +FAB both meet the 44px min", () => {
    const nav = readFileSync(
      join(ROOT, "src/components/SidebarNav.tsx"),
      "utf-8",
    );
    // Tab links carry min-h-[44px] for thumb-friendly targets
    const tabRegex = /role="tab"[\s\S]*?min-h-\[44px\]/;
    expect(nav).toMatch(tabRegex);
    // FAB carries both min-w and min-h
    expect(nav).toMatch(/min-w-\[44px\]\s+min-h-\[44px\]/);
  });
});
