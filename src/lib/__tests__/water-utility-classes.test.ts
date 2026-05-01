import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf-8");

describe("Water Guild — utility classes", () => {
  it("metric-prime is cyan #22D3EE, semibold, tabular-nums and ≥ 1.5rem", () => {
    // Class block exists with the cyan accent
    expect(css).toMatch(/\.metric-prime\s*\{[\s\S]*?#22D3EE[\s\S]*?\}/);
    expect(css).toMatch(/\.metric-prime\s*\{[\s\S]*?font-semibold[\s\S]*?\}/);
    expect(css).toMatch(/\.metric-prime\s*\{[\s\S]*?tabular-nums[\s\S]*?\}/);
    expect(css).toMatch(/\.metric-prime\s*\{[\s\S]*?font-size:\s*1\.5rem/);
    // White variant for truth-anchor figures
    expect(css).toMatch(/\.metric-prime-white\s*\{[\s\S]*?text-white[\s\S]*?\}/);
  });

  it("chip-tech uses bg #1E293B and text #F1F5F9 with rounded-full pill geometry", () => {
    expect(css).toMatch(/\.chip-tech\s*\{[\s\S]*?#1E293B[\s\S]*?\}/);
    expect(css).toMatch(/\.chip-tech\s*\{[\s\S]*?#F1F5F9[\s\S]*?\}/);
    expect(css).toMatch(/\.chip-tech\s*\{[\s\S]*?rounded-full[\s\S]*?\}/);
  });

  it("/projects/[id] uses chip-tech for the tech-stack tags (not legacy slate pills)", () => {
    const page = readFileSync(
      join(ROOT, "src/app/projects/[id]/page.tsx"),
      "utf-8",
    );
    expect(page).toMatch(/className="chip-tech/);
  });

  it("/guild and TotalAssetsCard render prime numbers with metric-prime classes", () => {
    const guild = readFileSync(join(ROOT, "src/app/guild/page.tsx"), "utf-8");
    const card  = readFileSync(join(ROOT, "src/components/TotalAssetsCard.tsx"), "utf-8");
    expect(guild).toMatch(/className="metric-prime-white/);
    expect(guild).toContain("guild-total-sales");
    expect(card).toMatch(/className="metric-prime-white/);
    expect(card).toMatch(/className="metric-prime[^"]*"/);
  });
});

describe("Water Guild — body-contrast sweep", () => {
  it("INDUSTRY / DEADLINE / SES challenge cells route through the semantic text tokens (#126)", () => {
    const projects = readFileSync(
      join(ROOT, "src/app/projects/page.tsx"),
      "utf-8",
    );
    const detail = readFileSync(
      join(ROOT, "src/app/projects/[id]/page.tsx"),
      "utf-8",
    );
    // Mercari Lightness (#126): /projects table now reaches for
    // text-[var(--color-text-muted)] / -primary on the cells.
    expect(projects).toMatch(/text-\[var\(--color-text-(primary|muted)\)\]/);
    expect(detail).toContain("<ClampDescription");
    const clamp = readFileSync(
      join(ROOT, "src/components/ui/ClampDescription.tsx"),
      "utf-8",
    );
    expect(clamp).toMatch(/text-text-primary/);
  });

  it("low-contrast greys (text-slate-{500,600} / text-zinc-{400,500} / text-gray-{400,500,600}) are absent from src/", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const offenders: string[] = [];
    function walk(dir: string) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (full.endsWith(".tsx")) {
          const c = fs.readFileSync(full, "utf-8");
          if (/\btext-slate-(500|600)\b|\btext-zinc-(400|500)\b|\btext-gray-(400|500|600)\b/.test(c)) {
            offenders.push(full);
          }
        }
      }
    }
    walk(path.join(ROOT, "src"));
    expect(offenders, `Low-contrast text classes in: ${offenders.join(", ")}`).toHaveLength(0);
  });
});
