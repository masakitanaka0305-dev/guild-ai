import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("FAB placement — single source, no floating duplicate", () => {
  it("AppShell no longer ships a fixed bottom-right desktop FAB", () => {
    const src = read("src/components/AppShell.tsx");
    // The previous floating FAB used `fixed right-8 bottom-8`. Make sure no
    // such fixed positioning lives in the shell anymore.
    expect(src).not.toMatch(/fixed\s+right-\d+\s+bottom-\d+/);
    expect(src).not.toMatch(/fixed\s+bottom-\d+\s+right-\d+/);
    expect(src).not.toMatch(/aria-label="出す"[\s\S]{0,400}fixed/);
  });

  it("BottomNav center FAB is the only ＋ entry on mobile, with z-30 above the footer band", () => {
    const nav = read("src/components/SidebarNav.tsx");
    expect(nav).toMatch(/data-testid="bottom-nav-fab"/);
    // Center placement + z-30 so it sits above the footer band (z-20)
    expect(nav).toMatch(/absolute left-1\/2 -translate-x-1\/2 -top-6 z-30/);
    // safe-area inset preserved
    expect(nav).toContain("pb-[env(safe-area-inset-bottom)]");
  });

  it("Z-index ladder: footer band z-20, FAB z-30, BottomNav z-40", () => {
    const shell = read("src/components/AppShell.tsx");
    const nav   = read("src/components/SidebarNav.tsx");
    expect(shell).toMatch(/data-testid="enterprise-cta-mobile"[\s\S]{0,200}z-20/);
    expect(nav).toMatch(/data-testid="bottom-nav-fab"[\s\S]{0,200}z-30/);
    expect(nav).toMatch(/lg:hidden[^"]*relative[^"]*z-40/);
  });
});
