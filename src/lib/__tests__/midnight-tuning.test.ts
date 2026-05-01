import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
const block =
  css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";

describe("Mercari Lightness (#126) — Midnight tuning", () => {
  it("backgrounds lift off pure-black for less eye-strain", () => {
    expect(block).toContain("#101418"); // bg-base
    expect(block).toContain("#1C2126"); // bg-surface
    expect(block).toContain("#252A30"); // bg-elevated
  });

  it("action / warn colors flip to lighter, more legible tones on dark", () => {
    expect(block).toContain("#4DD0E1"); // ai-action: lighter cyan
    expect(block).toContain("#FFF176"); // ai-warn: lemon yellow
  });

  it("text-soft secondary token is added (#E0E0E0)", () => {
    expect(block).toMatch(/--color-text-soft:\s*#E0E0E0/i);
  });

  it("border-subtle becomes a thinner 8% white", () => {
    expect(block).toMatch(/--color-border-subtle:\s*rgba\(248,\s*250,\s*252,\s*0\.08\)/);
  });
});
