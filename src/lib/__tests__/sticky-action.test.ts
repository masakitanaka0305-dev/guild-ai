import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Sticky Action — mobile-fixed Apply on /projects/[id]", () => {
  const plug = readFileSync(
    join(ROOT, "src/components/PlugInApply.tsx"),
    "utf-8",
  );
  const projectPage = readFileSync(
    join(ROOT, "src/app/projects/[id]/page.tsx"),
    "utf-8",
  );

  it("PlugInApply emits a fixed bottom bar with md:static fallback and safe-area offset when sticky=true", () => {
    expect(plug).toMatch(/sticky\s*=\s*false/);
    // Fixed mobile placement above the BottomNav (4rem) plus iOS safe-area inset.
    expect(plug).toMatch(/md:static\s+fixed\s+bottom-\[calc\(4rem\+env\(safe-area-inset-bottom\)\)\]/);
    expect(plug).toMatch(/role=\{wrapperRole\}/);
    expect(plug).toMatch(/aria-label=\{wrapperLabel\}/);
    expect(plug).toContain("主要アクション");
  });

  it("/projects/[id] mounts the sticky variant on mobile and a card on md+", () => {
    // The mobile mount stays sticky; underwater is an optional disable flag.
    expect(projectPage).toMatch(/<PlugInApply\s+projectId=\{project\.id\}\s+sticky\b/);
    expect(projectPage).toMatch(/hidden md:block/);
    // Mobile-only main padding leaves room for the sticky bar
    expect(projectPage).toMatch(/pb-44 md:pb-8/);
  });

  it("BottomNav reserves the iOS safe-area inset and 44px tap targets on each tab", () => {
    const nav = readFileSync(join(ROOT, "src/components/SidebarNav.tsx"), "utf-8");
    expect(nav).toContain("pb-[env(safe-area-inset-bottom)]");
    // Tabs and the +FAB both meet the 44px minimum
    expect(nav).toMatch(/min-h-\[44px\]/);
    expect(nav).toMatch(/min-w-\[44px\]/);
  });
});
