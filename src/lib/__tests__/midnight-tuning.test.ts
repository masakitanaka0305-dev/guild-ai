import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
const block =
  css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";

describe("Final Polish (#127) — Midnight tuning (post Mercari Lightness)", () => {
  it("backgrounds settle back to slate-900 base + lifted surfaces", () => {
    // #127 returns to the canonical slate-900 base; surfaces stay lifted.
    expect(block).toContain("#0F172A"); // bg-base
    expect(block).toContain("#1C2126"); // bg-surface
    expect(block).toContain("#252A30"); // bg-elevated
  });

  it("action / warn colors are the Mercari Purple brand + lemon warn", () => {
    expect(block).toContain("#6366F1"); // brand-primary (action)
    expect(block).toContain("#FFF176"); // ai-warn: lemon yellow
    expect(block).toContain("#A5B4FC"); // dark link (replaces cyan)
  });

  it("text-soft secondary token is added (#E0E0E0)", () => {
    expect(block).toMatch(/--color-text-soft:\s*#E0E0E0/i);
  });

  it("border-subtle becomes a thinner 8% white", () => {
    expect(block).toMatch(/--color-border-subtle:\s*rgba\(248,\s*250,\s*252,\s*0\.08\)/);
  });
});
