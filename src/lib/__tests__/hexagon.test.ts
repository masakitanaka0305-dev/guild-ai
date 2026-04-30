import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Hexagon component", () => {
  const file = join(ROOT, "src/components/ui/Hexagon.tsx");
  const src = readFileSync(file, "utf-8");

  it("defines a polygon with exactly 6 vertices", async () => {
    const mod = await import("@/components/ui/Hexagon");
    const points = mod.HEXAGON_POLYGON_POINTS.split(/\s+/).filter(Boolean);
    expect(points).toHaveLength(6);
    for (const p of points) {
      expect(p).toMatch(/^\d+(?:\.\d+)?,\d+(?:\.\d+)?$/);
    }
  });

  it("uses a 0 0 100 100 viewBox (regular hexagon canvas)", () => {
    expect(src).toContain('viewBox="0 0 100 100"');
  });

  it("contains no animation or transition references (static motif)", () => {
    expect(src).not.toMatch(/animate|@keyframes|transition\s*:/i);
  });

  it("renders an aria-label when provided (a11y contract)", () => {
    expect(src).toContain("ariaLabel");
    expect(src).toContain('role={role}');
    expect(src).toMatch(/role\s*=\s*ariaLabel\s*\?\s*"img"/);
  });
});
