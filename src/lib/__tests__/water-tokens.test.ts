import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Water Guild — design tokens", () => {
  it("globals.css declares the Water palette (#0B1121 / #22D3EE / #162035)", () => {
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
    expect(css).toMatch(/--water-bg\s*:\s*#0B1121/i);
    expect(css).toMatch(/--water-accent\s*:\s*#22D3EE/i);
    expect(css).toMatch(/--water-surface\s*:\s*#162035/i);
  });

  it("globals.css enforces global anim-off when data-anim=\"off\"", () => {
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
    expect(css).toContain('[data-anim="off"]');
    expect(css).toMatch(/transition\s*:\s*none\s*!important/);
    expect(css).toMatch(/animation\s*:\s*none\s*!important/);
  });

  it("tailwind.config.ts exposes the water color namespace", () => {
    const tw = readFileSync(join(ROOT, "tailwind.config.ts"), "utf-8");
    expect(tw).toMatch(/water\s*:\s*\{/);
    expect(tw).toContain("#0B1121");
    expect(tw).toContain("#22D3EE");
    expect(tw).toContain("#162035");
  });

  it("root layout activates the water theme with anim-off", () => {
    const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf-8");
    expect(layout).toMatch(/data-theme="water"/);
    expect(layout).toMatch(/data-anim="off"/);
  });
});
