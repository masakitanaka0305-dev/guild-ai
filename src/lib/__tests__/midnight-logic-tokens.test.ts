import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Midnight Logic — palette + semantic tokens (#124)", () => {
  it("globals.css declares the canonical semantic variables", () => {
    const css = read("src/app/globals.css");
    // Backgrounds
    expect(css).toMatch(/--color-bg-base:\s*#0F172A/i);
    expect(css).toMatch(/--color-bg-surface:\s*#1E293B/i);
    expect(css).toMatch(/--color-bg-elevated:\s*#293548/i);
    // Text
    expect(css).toMatch(/--color-text-primary:\s*#F8FAFC/i);
    expect(css).toMatch(/--color-text-muted:\s*#94A3B8/i);
    expect(css).toMatch(/--color-text-on-primary:\s*#0F172A/i);
    // AI / Action / Status
    expect(css).toMatch(/--color-ai-action:\s*#06B6D4/i);
    expect(css).toMatch(/--color-ai-flow:\s*#8B5CF6/i);
    expect(css).toMatch(/--color-ai-success:\s*#10B981/i);
    // Borders
    expect(css).toMatch(/--color-border-subtle:\s*rgba\(248,\s*250,\s*252,\s*0\.10\)/);
    expect(css).toMatch(/--color-border-strong:\s*rgba\(248,\s*250,\s*252,\s*0\.18\)/);
  });

  it("legacy --water-* / --n-* tokens are aliased through Midnight tokens", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/--water-bg:\s*var\(--color-bg-base\)/);
    expect(css).toMatch(/--water-surface:\s*var\(--color-bg-surface\)/);
    expect(css).toMatch(/--water-accent:\s*var\(--color-ai-action\)/);
    expect(css).toMatch(/--water-text:\s*var\(--color-text-primary\)/);
    expect(css).toMatch(/--water-muted:\s*var\(--color-text-muted\)/);
  });

  it("tailwind.config.ts exposes the midnight + ai + text namespaces", () => {
    const tw = read("tailwind.config.ts");
    expect(tw).toMatch(/midnight:\s*\{[^}]*base:\s*"#0F172A"/);
    expect(tw).toMatch(/midnight:\s*\{[^}]*surface:\s*"#1E293B"/);
    expect(tw).toMatch(/ai:\s*\{[^}]*action:\s*"#06B6D4"/);
    expect(tw).toMatch(/ai:\s*\{[^}]*flow:\s*"#8B5CF6"/);
    expect(tw).toMatch(/ai:\s*\{[^}]*success:\s*"#10B981"/);
    expect(tw).toMatch(/text:\s*\{[^}]*primary:\s*"#F8FAFC"/);
  });
});
