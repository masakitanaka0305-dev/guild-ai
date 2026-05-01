import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
const block =
  css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";

describe("Cinematic Mint (#128) — Midnight tuning (abyss palette)", () => {
  it("backgrounds dive to abyss black + lifted surfaces", () => {
    expect(block).toContain("#020617"); // bg-base — abyss black
    expect(block).toContain("#0E1422"); // bg-surface
    expect(block).toContain("#1A2236"); // bg-elevated
  });

  it("action / warn colors are Deep Purple brand + lemon warn", () => {
    expect(block).toContain("#4C1D95"); // brand-primary (action)
    expect(block).toContain("#FFF176"); // ai-warn: lemon yellow
    expect(block).toContain("#C4B5FD"); // dark link (violet-300)
  });

  it("text-soft secondary token is added (#E0E0E0)", () => {
    expect(block).toMatch(/--color-text-soft:\s*#E0E0E0/i);
  });

  it("border-subtle becomes a thinner 8% white", () => {
    expect(block).toMatch(/--color-border-subtle:\s*rgba\(248,\s*250,\s*252,\s*0\.08\)/);
  });
});
