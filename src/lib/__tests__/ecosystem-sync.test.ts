import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Ecosystem sync — shared footer banner + nav active state", () => {
  it("AppShell renders the shared 提携・案件提供 footer band on both surfaces", () => {
    const src = read("src/components/AppShell.tsx");
    expect(src).toContain("提携・案件提供をご検討の企業様へ");
    // Mobile sticky band sits above the bottom nav
    expect(src).toMatch(/sticky bottom-16[^"]*z-30[^"]*bg-\[#162035\]/);
    // Cyan accent + underline on hover
    expect(src).toContain("text-cyan-400");
    expect(src).toContain("underline-offset-4");
    // Both mobile and desktop variants link to /business/checkout
    const linkCount = (src.match(/href="\/business\/checkout"/g) ?? []).length;
    expect(linkCount).toBeGreaterThanOrEqual(2);
  });

  it("BottomNav active tab uses text-cyan-400 + a 2px bottom rule, inactive uses text-slate-400", () => {
    const src = read("src/components/SidebarNav.tsx");
    // Active tab text
    expect(src).toMatch(/active \? "text-cyan-400" : "text-slate-400"/);
    // 2px-equivalent bottom rule (h-0.5 = 2px) in cyan-400, anchored to bottom
    expect(src).toMatch(/absolute bottom-0[^"]*h-0\.5[^"]*bg-cyan-400/);
    // Tab icons follow the same active/inactive treatment
    expect(src).toMatch(/active \? "stroke-cyan-400" : "stroke-slate-400"/);
  });

  it("NotificationBell unread indicator uses bg-cyan-400 (not bg-kaki)", () => {
    const src = read("src/components/NotificationBell.tsx");
    expect(src).toContain("bg-cyan-400");
    expect(src).not.toContain("bg-kaki");
  });
});
