import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TAP_CLASS } from "@/lib/motion";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Mercari Lightness (#126) — Tap scale + reduced-motion guard", () => {
  it("TAP_CLASS exposes the canonical scale-[0.98] string with motion-reduce guard", () => {
    expect(TAP_CLASS).toContain("active:scale-[0.98]");
    expect(TAP_CLASS).toContain("motion-reduce:active:scale-100");
    expect(TAP_CLASS).toContain("transition-transform");
  });

  it("Major CTAs adopt TAP_CLASS via the lib/motion helper", () => {
    const mint = read("src/app/mint/page.tsx");
    const apply = read("src/components/PlugInApply.tsx");
    const guild = read("src/app/guild/page.tsx");
    const projects = read("src/app/projects/page.tsx");

    for (const src of [mint, apply, guild, projects]) {
      expect(src).toContain('from "@/lib/motion"');
      expect(src).toContain("TAP_CLASS");
    }
  });

  it("Mint advance + PlugInApply call useTactile for haptic feedback", () => {
    const mint = read("src/app/mint/page.tsx");
    const apply = read("src/components/PlugInApply.tsx");
    expect(mint).toContain('useTactile("coin")');
    expect(apply).toContain('useTactile("quest")');
    expect(mint).toMatch(/tap\(\)/);
    expect(apply).toMatch(/tap\(\)/);
  });
});
