import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Water Guild — design tokens", () => {
  it("globals.css aliases --water-* through Midnight Logic tokens", () => {
    // Midnight Logic (#124): legacy --water-* tokens are CSS-level
    // aliases that resolve through --color-bg-base / --color-ai-action /
    // --color-bg-surface. The canonical hex literals live on the
    // semantic tokens.
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
    expect(css).toMatch(/--water-bg\s*:\s*var\(--color-bg-base\)/);
    expect(css).toMatch(/--water-accent\s*:\s*var\(--color-ai-action\)/);
    expect(css).toMatch(/--water-surface\s*:\s*var\(--color-bg-surface\)/);
    expect(css).toMatch(/--color-bg-base\s*:\s*#0F172A/i);
    expect(css).toMatch(/--color-ai-action\s*:\s*#06B6D4/i);
    expect(css).toMatch(/--color-bg-surface\s*:\s*#1E293B/i);
  });

  it("globals.css enforces global anim-off when data-anim=\"off\"", () => {
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
    expect(css).toContain('[data-anim="off"]');
    expect(css).toMatch(/transition\s*:\s*none\s*!important/);
    expect(css).toMatch(/animation\s*:\s*none\s*!important/);
  });

  it("tailwind.config.ts exposes the Midnight Logic + water namespaces", () => {
    const tw = readFileSync(join(ROOT, "tailwind.config.ts"), "utf-8");
    // Midnight is the canonical namespace; water is a hex-mirrored alias.
    expect(tw).toMatch(/midnight\s*:\s*\{/);
    expect(tw).toMatch(/water\s*:\s*\{/);
    // Canonical Midnight tokens
    expect(tw).toContain("#0F172A");
    expect(tw).toContain("#06B6D4");
    expect(tw).toContain("#1E293B");
  });

  it("root layout activates the water theme with anim-off", () => {
    const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf-8");
    expect(layout).toMatch(/data-theme="water"/);
    expect(layout).toMatch(/data-anim="off"/);
  });
});
