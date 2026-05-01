import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Water Guild — contrast & button shape pass", () => {
  it("inputs/textarea use bg-midnight-surface + text-text-primary (Edit & Mint draft)", () => {
    const src = read("src/app/onboarding/draft/[owner]/[repo]/page.tsx");
    expect(src).toMatch(/bg-midnight-surface/);
    expect(src).toMatch(/text-text-primary/);
    expect(src).toMatch(/border-ai-action\/30/);
    expect(src).toMatch(/focus:border-ai-action/);
    expect(src).toMatch(/placeholder-slate-500/);
  });

  it("Primary CTAs are rounded-full + brand-primary (Final Polish #127 dropped the cyan glow)", () => {
    const apply  = read("src/app/projects/page.tsx");
    const draft  = read("src/app/onboarding/draft/[owner]/[repo]/page.tsx");
    const repos  = read("src/app/onboarding/repos/page.tsx");
    const plug   = read("src/components/PlugInApply.tsx");
    for (const src of [apply, draft, repos, plug]) {
      expect(src).toMatch(/rounded-full/);
    }
    // The /projects + plug-in CTAs both adopt the brand purple.
    expect(apply).toMatch(/bg-brand-primary/);
    expect(plug).toMatch(/bg-brand-primary/);
  });

  it("/projects MATCH percentage is rendered in text-brand-primary (Mercari Purple)", () => {
    const src = read("src/app/projects/page.tsx");
    expect(src).toMatch(/text-brand-primary[^"]*[^A-Za-z0-9]+\{row\.matchScore\}%/s);
    // Recommended row uses the brand-primary left border.
    expect(src).toMatch(/border-l-brand-primary/);
  });

  it("/projects desktop table — industry cell uses text-muted, deadline uses text-primary (#127)", () => {
    const src = read("src/app/projects/page.tsx");
    const industryCell = src.match(/<td[^>]*>\{friendlyIndustry\(row\.industry\)\}<\/td>/);
    expect(industryCell?.[0] ?? "").toMatch(/text-\[var\(--color-text-muted\)\]/);
    // Final Polish (#127): the deadline cell now anchors at text-primary
    // for AA contrast, replacing the lower-contrast text-muted reading.
    const deadlineCell = src.match(/<td[^>]*font-medium[^>]*>\s*\{relativeDeadline\(row\.deadline\)\}/);
    expect(deadlineCell?.[0] ?? "").toMatch(/text-\[var\(--color-text-primary\)\]/);
  });

  it("/projects/[id] Matching Score uses text-brand-primary metric-prime (no amber/orange)", () => {
    const src = read("src/app/projects/[id]/page.tsx");
    // The matching-score number is wrapped in text-brand-primary metric-prime
    expect(src).toMatch(/className="text-brand-primary metric-prime"[^>]*>\{score\}%/);
    // Sub-line "マッチ N / M 件" uses the slate-400 hint style
    expect(src).toMatch(/text-slate-400 text-xs[^"]*">マッチ/);
    // Old amber/orange match-score branch is gone
    expect(src).not.toMatch(/score >= 80 \? "text-brand-primary" : score >= 50 \? "text-amber-400"/);
    // Score color is not orange-tinted
    expect(src).not.toMatch(/<span[^>]*text-orange-\d+[^"]*">\{score\}%/);
    expect(src).not.toMatch(/<span[^>]*text-amber-\d+[^"]*">\{score\}%/);
  });
});
