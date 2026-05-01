import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Water Guild — design tokens", () => {
  it("globals.css aliases --water-* through Logic White semantic tokens (default)", () => {
    // Logic White (#125): :root holds the white palette and the legacy
    // --water-* tokens are CSS-level aliases. The canonical hex literals
    // live on the semantic tokens.
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
    expect(css).toMatch(/--water-bg\s*:\s*var\(--color-bg-base\)/);
    expect(css).toMatch(/--water-accent\s*:\s*var\(--color-ai-action\)/);
    expect(css).toMatch(/--water-surface\s*:\s*var\(--color-bg-surface\)/);
    expect(css).toMatch(/--color-bg-base\s*:\s*#F8FAFC/i);
    expect(css).toMatch(/--color-ai-action\s*:\s*#4F46E5/i);
    expect(css).toMatch(/--color-bg-surface\s*:\s*#FFFFFF/i);
  });

  it("globals.css enforces global anim-off when data-anim=\"off\"", () => {
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
    expect(css).toContain('[data-anim="off"]');
    expect(css).toMatch(/transition\s*:\s*none\s*!important/);
    expect(css).toMatch(/animation\s*:\s*none\s*!important/);
  });

  it("tailwind.config.ts midnight + water namespaces resolve through CSS variables", () => {
    const tw = readFileSync(join(ROOT, "tailwind.config.ts"), "utf-8");
    // Logic White (#125): values flipped to var(--color-*) so the
    // utilities track the html data-theme attribute (default vs midnight).
    expect(tw).toMatch(/midnight\s*:\s*\{/);
    expect(tw).toMatch(/water\s*:\s*\{/);
    expect(tw).toMatch(/base:\s*"var\(--color-bg-base\)"/);
    expect(tw).toMatch(/accent:\s*"var\(--color-ai-action\)"/);
  });

  it("root layout activates the Logic White theme by default with anim-off", () => {
    const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf-8");
    expect(layout).toMatch(/data-theme="logic-white"/);
    expect(layout).toMatch(/data-anim="off"/);
  });
});
