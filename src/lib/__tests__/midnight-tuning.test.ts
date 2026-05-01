import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
const block =
  css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";

describe("Cinematic Mint (#128) — Midnight tuning (abyss palette)", () => {
  it("backgrounds dive to abyss black + lifted surfaces (#133 hierarchy)", () => {
    expect(block).toContain("#020617"); // L0 abyss base
    expect(block).toContain("#0E1422"); // L1 surface
    expect(block).toContain("#1A2238"); // L2 elevated (#133 retuned by 2)
  });

  it("action / warn colors are Deep Purple brand + lemon warn", () => {
    expect(block).toContain("#4C1D95"); // brand-primary (action)
    expect(block).toContain("#FFF176"); // ai-warn: lemon yellow
    expect(block).toContain("#C4B5FD"); // dark link (violet-300)
  });

  it("text-soft secondary token is added (#E0E0E0)", () => {
    expect(block).toMatch(/--color-text-soft:\s*#E0E0E0/i);
  });

  it("border-subtle is a 6% white hairline at L3-subtle (#133)", () => {
    expect(block).toMatch(/--color-border-subtle:\s*rgba\(255,\s*255,\s*255,\s*0\.06\)/);
    expect(block).toMatch(/--color-border-strong:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/);
  });
});
