import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("Water Guild — no-anim global rule", () => {
  const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");
  const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf-8");

  it("globals.css declares the [data-anim=\"off\"] kill switch covering * + ::before + ::after", () => {
    expect(css).toMatch(/\[data-anim="off"\]\s*\*/);
    expect(css).toMatch(/\[data-anim="off"\]\s*\*::before/);
    expect(css).toMatch(/\[data-anim="off"\]\s*\*::after/);
    expect(css).toMatch(/transition\s*:\s*none\s*!important/);
    expect(css).toMatch(/animation\s*:\s*none\s*!important/);
  });

  it("root layout opts in via data-anim=\"off\"", () => {
    expect(layout).toMatch(/data-anim="off"/);
  });

  it("no source file imports framer-motion (Water Guild = static)", () => {
    const all = walk(join(ROOT, "src"));
    const offenders = all.filter((f) => {
      const c = readFileSync(f, "utf-8");
      return /from\s+["']framer-motion["']/.test(c);
    });
    expect(offenders, `framer-motion imported in: ${offenders.join(", ")}`).toHaveLength(0);
  });

  it("no UI references the old mascot PNG (geometry only)", () => {
    const all = walk(join(ROOT, "src")).filter((f) => !f.includes("__tests__"));
    const offenders = all.filter((f) => {
      const c = readFileSync(f, "utf-8");
      return c.includes("guild-ai-mascot");
    });
    expect(offenders, `mascot ref in: ${offenders.join(", ")}`).toHaveLength(0);
  });
});
