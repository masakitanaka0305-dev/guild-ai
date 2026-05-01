import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
const block =
  css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";

describe("Cinematic Mint (#128) — abyss palette tokens", () => {
  it("Midnight base dives to abyss-black #020617 with deep purple action and electric gold accent", () => {
    expect(block).toContain("#020617"); // abyss-black bg-base
    expect(block).toContain("#4C1D95"); // deep purple action
    expect(block).toContain("#F59E0B"); // electric gold secondary
  });

  it("rank-gold S medal aligns to electric gold #F59E0B in both themes", () => {
    expect(css).toMatch(/--rank-gold:\s*#F59E0B/);
    // Both :root and the midnight block should declare it.
    const rootMatch = css.match(/:root\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";
    expect(rootMatch).toMatch(/--rank-gold:\s*#F59E0B/);
    expect(block).toMatch(/--rank-gold:\s*#F59E0B/);
  });
});
