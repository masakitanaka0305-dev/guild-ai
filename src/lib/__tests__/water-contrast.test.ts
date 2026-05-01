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

  it("Apply / Analyze / Mint primary CTAs are rounded-full with the static cyan glow", () => {
    const apply  = read("src/app/projects/page.tsx");
    const draft  = read("src/app/onboarding/draft/[owner]/[repo]/page.tsx");
    const repos  = read("src/app/onboarding/repos/page.tsx");
    const plug   = read("src/components/PlugInApply.tsx");
    for (const src of [apply, draft, repos, plug]) {
      expect(src).toMatch(/rounded-full/);
      expect(src).toMatch(/hover:shadow-\[0_0_0_2px_rgba\(34,211,238,0\.4\),0_0_18px_rgba\(34,211,238,0\.25\)\]/);
    }
  });

  it("/projects MATCH percentage is rendered in text-ai-action (accent cyan)", () => {
    const src = read("src/app/projects/page.tsx");
    expect(src).toMatch(/text-ai-action[^"]*[^A-Za-z0-9]+\{row\.matchScore\}%/s);
    // Recommended row keeps the cyan left border
    expect(src).toMatch(/border-l-ai-action/);
  });

  it("/projects INDUSTRY and DEADLINE cells use text-text-primary (≥ AA contrast on #0B1121)", () => {
    const src = read("src/app/projects/page.tsx");
    // Friendly Tone (#123): industry tag is now wrapped through
    // friendlyIndustry(row.industry) — the cell still carries the
    // E2E8F0 utility, just on the wrapper.
    const industryCell = src.match(/<td[^>]*>\{friendlyIndustry\(row\.industry\)\}<\/td>/);
    const deadlineCell = src.match(/<td[^>]*>\{row\.deadline\}<\/td>/);
    expect(industryCell?.[0] ?? "").toMatch(/text-text-primary/);
    expect(deadlineCell?.[0] ?? "").toMatch(/text-text-primary/);
  });

  it("/projects/[id] Matching Score uses text-cyan-400 metric-prime (no amber/orange)", () => {
    const src = read("src/app/projects/[id]/page.tsx");
    // The matching-score number is wrapped in text-cyan-400 metric-prime
    expect(src).toMatch(/className="text-cyan-400 metric-prime"[^>]*>\{score\}%/);
    // Sub-line "マッチ N / M 件" uses the slate-400 hint style
    expect(src).toMatch(/text-slate-400 text-xs[^"]*">マッチ/);
    // Old amber/orange match-score branch is gone
    expect(src).not.toMatch(/score >= 80 \? "text-cyan-400" : score >= 50 \? "text-amber-400"/);
    // Score color is not orange-tinted
    expect(src).not.toMatch(/<span[^>]*text-orange-\d+[^"]*">\{score\}%/);
    expect(src).not.toMatch(/<span[^>]*text-amber-\d+[^"]*">\{score\}%/);
  });
});
