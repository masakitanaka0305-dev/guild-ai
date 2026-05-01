import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Logic White (#125) — card surfaces tuned for the white base", () => {
  it("globals.css .section-card uses semantic variables (no hardcoded slate-900)", () => {
    const css = read("src/app/globals.css");
    // The @layer components block hosts the canonical .section-card.
    // Match from the comment marker through the next closing brace.
    const card = css.match(
      /Card component — Logic White[\s\S]*?\.section-card\s*\{[\s\S]*?\}/,
    )?.[0] ?? "";
    expect(card).toContain("var(--color-bg-surface)");
    expect(card).toContain("var(--color-border-subtle)");
    expect(card).toContain("var(--color-text-primary)");
    // The legacy `@apply bg-slate-900` line should be gone from this block.
    expect(card).not.toContain("bg-slate-900");
  });

  it("box-shadow uses a soft slate tint that reads on white", () => {
    const css = read("src/app/globals.css");
    const card = css.match(
      /Card component — Logic White[\s\S]*?\.section-card\s*\{[\s\S]*?\}/,
    )?.[0] ?? "";
    expect(card).toMatch(/box-shadow/);
    expect(card).toMatch(/rgba\(15,\s*23,\s*42,\s*0\.0[34]\)/);
  });
});
