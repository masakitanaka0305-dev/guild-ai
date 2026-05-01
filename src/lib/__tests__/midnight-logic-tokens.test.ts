import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Midnight Logic — pro toggle palette (#124, dark)", () => {
  it("globals.css keeps the Midnight Logic values under data-theme=midnight", () => {
    const css = read("src/app/globals.css");
    const block = css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";
    expect(block).toMatch(/--color-bg-base:\s*#0F172A/i);
    expect(block).toMatch(/--color-bg-surface:\s*#1E293B/i);
    expect(block).toMatch(/--color-bg-elevated:\s*#293548/i);
    expect(block).toMatch(/--color-text-primary:\s*#F8FAFC/i);
    expect(block).toMatch(/--color-text-muted:\s*#94A3B8/i);
    expect(block).toMatch(/--color-ai-action:\s*#06B6D4/i);
    expect(block).toMatch(/--color-ai-flow:\s*#8B5CF6/i);
    expect(block).toMatch(/--color-ai-success:\s*#10B981/i);
  });

  it("legacy --water-* / --n-* tokens stay aliased through the same CSS variables", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/--water-bg:\s*var\(--color-bg-base\)/);
    expect(css).toMatch(/--water-surface:\s*var\(--color-bg-surface\)/);
    expect(css).toMatch(/--water-accent:\s*var\(--color-ai-action\)/);
    expect(css).toMatch(/--water-text:\s*var\(--color-text-primary\)/);
    expect(css).toMatch(/--water-muted:\s*var\(--color-text-muted\)/);
  });

  it("tailwind.config.ts midnight/ai/text namespaces resolve through CSS variables", () => {
    const tw = read("tailwind.config.ts");
    // Logic White (#125): values flipped to var(--color-*) so the
    // Tailwind utilities track the html data-theme attribute.
    expect(tw).toMatch(/midnight:\s*\{[^}]*base:\s*"var\(--color-bg-base\)"/);
    expect(tw).toMatch(/midnight:\s*\{[^}]*surface:\s*"var\(--color-bg-surface\)"/);
    expect(tw).toMatch(/ai:\s*\{[^}]*action:\s*"var\(--color-ai-action\)"/);
    expect(tw).toMatch(/text:\s*\{[^}]*primary:\s*"var\(--color-text-primary\)"/);
  });
});
