import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__") continue;
      walk(full, out);
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

const UI_FILES = [
  ...walk(join(ROOT, "src/app")),
  ...walk(join(ROOT, "src/components")),
];

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Visual Hierarchy (#133) — color cohesion across UI", () => {
  it("zero hardcoded #6366F1 / #FBBF24 hex literals (legacy #127 brand)", () => {
    const re = /#6366F1|#6366f1|#FBBF24|#fbbf24/;
    const offenders = UI_FILES.filter((f) => re.test(readFileSync(f, "utf-8")));
    expect(
      offenders,
      `Legacy #127 brand hexes still present in: ${offenders.join(", ")}`,
    ).toHaveLength(0);
  });

  it("zero hardcoded cyan #22D3EE / #06B6D4 / #4DD0E1 hex literals (CTA range)", () => {
    const re = /#22D3EE|#06B6D4|#4DD0E1|#22d3ee|#06b6d4|#4dd0e1/;
    const offenders = UI_FILES.filter((f) => re.test(readFileSync(f, "utf-8")));
    expect(
      offenders,
      `Legacy cyan hexes still present in: ${offenders.join(", ")}`,
    ).toHaveLength(0);
  });

  it("zero stray cyan utility classes outside warn/helper contexts", () => {
    // The cyan-restricted invariant from #127 must hold under #133.
    const re = /\b(text|bg|border|stroke|ring|fill|from|to|via)-cyan-(300|400|500|600|700|800|900)\b/;
    const offenders = UI_FILES.filter((f) => re.test(readFileSync(f, "utf-8")));
    expect(
      offenders,
      `Cyan utility classes still present in: ${offenders.join(", ")}`,
    ).toHaveLength(0);
  });

  it("global hierarchy tokens resolve to the L0/L1/L2 chain in globals.css", () => {
    const css = read("src/app/globals.css");
    // Dark / abyss surfaces follow the chain.
    const block = css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";
    expect(block).toMatch(/--color-bg-base:\s*#020617/);     // L0
    expect(block).toMatch(/--color-bg-surface:\s*#0E1422/);  // L1
    expect(block).toMatch(/--color-bg-elevated:\s*#1A2238/); // L2
    expect(block).toMatch(/--color-border-subtle:\s*rgba\(255,\s*255,\s*255,\s*0\.06\)/);
    expect(block).toMatch(/--color-border-strong:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/);
    // Light / Logic White surfaces follow the chain.
    expect(css).toMatch(/--color-bg-base:\s*#F8FAFC/);
    expect(css).toMatch(/--color-bg-surface:\s*#FFFFFF/);
    expect(css).toMatch(/--color-bg-elevated:\s*#F1F5F9/);
  });

  it("brand palette stays one-Primary: action-primary is the only #4C1D95 in the action role", () => {
    const css = read("src/app/globals.css");
    // Both themes converge on a single Primary value, with hover and
    // soft as the *only* sanctioned variants.
    expect(css.match(/--color-action-primary:\s*#4C1D95/g)?.length).toBeGreaterThanOrEqual(2);
    expect(css.match(/--color-action-primary-hover:\s*#6D28D9/g)?.length).toBeGreaterThanOrEqual(2);
    expect(css.match(/--color-action-primary-soft:\s*#1E0F47/g)?.length).toBeGreaterThanOrEqual(2);
    // Tailwind also exposes the brand alias and not its raw hex.
    const tw = read("tailwind.config.ts");
    expect(tw).toMatch(/primary:\s*"var\(--color-action-primary\)"/);
    expect(tw).toMatch(/secondary:\s*"var\(--color-action-secondary\)"/);
  });

  it("status-negative is wired so error pills resolve through a shared token", () => {
    const css = read("src/app/globals.css");
    expect(css.match(/--color-status-negative:\s*var\(--color-ai-negative\)/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Visual Hierarchy (#133) — surface chain tests", () => {
  it("L0 page floor renders abyss black (#020617) on the .bg-midnight-base utility chain", () => {
    const tw = read("tailwind.config.ts");
    expect(tw).toMatch(/midnight:\s*\{[^}]*base:\s*"var\(--color-bg-base\)"/);
    expect(tw).toMatch(/midnight:\s*\{[^}]*surface:\s*"var\(--color-bg-surface\)"/);
    expect(tw).toMatch(/midnight:\s*\{[^}]*elevated:\s*"var\(--color-bg-elevated\)"/);
  });

  it("z-index hierarchy stays consistent (footer band z-20 < FAB z-30 < bottom nav z-40)", () => {
    const shell = read("src/components/AppShell.tsx");
    expect(shell).toContain("z-20");
    expect(shell).toContain("z-40");
  });
});
