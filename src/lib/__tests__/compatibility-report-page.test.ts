import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Intelligence Compatibility Report on /projects/[id]", () => {
  const page = read("src/app/projects/[id]/page.tsx");
  const cmp = read("src/components/ui/CompatibilityReportSection.tsx");

  it("page mounts <CompatibilityReportSection> sourced from buildCompatibilityReport", () => {
    expect(page).toContain('import { CompatibilityReportSection } from "@/components/ui/CompatibilityReportSection"');
    expect(page).toContain('import { buildCompatibilityReport } from "@/lib/compatibility-report"');
    expect(page).toMatch(/<CompatibilityReportSection\s+report=\{compatReport\}/);
  });

  it("page section order: Compatibility → Connected → Apply", () => {
    const idxCompat = page.indexOf("<CompatibilityReportSection");
    const idxConnected = page.indexOf("<ConnectedIntelligenceAssets");
    const idxApply = page.indexOf("<PlugInApply");
    expect(idxCompat).toBeGreaterThan(0);
    expect(idxConnected).toBeGreaterThan(idxCompat);
    expect(idxApply).toBeGreaterThan(idxConnected);
  });

  it("Section heading is 'Intelligence Compatibility Report' under role=region", () => {
    expect(cmp).toContain("Intelligence Compatibility Report");
    expect(cmp).toMatch(/role="region"/);
    expect(cmp).toMatch(/aria-labelledby="compat-h"/);
  });

  it("Compatibility 81% style is metric-prime + tabular-nums + cyan", () => {
    expect(cmp).toMatch(/data-testid="compat-percent"/);
    expect(cmp).toContain("text-cyan-400 metric-prime tabular-nums");
    expect(cmp).toContain("Compatibility");
    expect(cmp).toContain("マッチ");
    expect(cmp).toContain("件");
  });

  it("personalised one-liner is rendered as a <p> from report.contextSentence", () => {
    expect(cmp).toMatch(/data-testid="compat-context-sentence"/);
    expect(cmp).toMatch(/\{report\.contextSentence\}/);
  });

  it("Pre-Check positioning sentence is shown verbatim", () => {
    expect(cmp).toContain(
      "この事前診断は、人間が参画する際のミスマッチを減らし、オンボーディングを加速させるためのものです。",
    );
  });

  it("supporting pills cover 充足要件 / 未充足 / ボーナス", () => {
    expect(cmp).toContain('data-testid="compat-pill-fulfilled"');
    expect(cmp).toContain('data-testid="compat-pill-unfulfilled"');
    expect(cmp).toContain('data-testid="compat-pill-bonus"');
    expect(cmp).toContain("充足要件：");
    expect(cmp).toContain("未充足：");
    expect(cmp).toContain("ボーナス：");
    // Spec colors per pill
    expect(cmp).toContain("bg-emerald-500/15");
    expect(cmp).toContain("bg-rose-500/10");
    expect(cmp).toContain("bg-cyan-500/15");
  });

  it("page no longer renders the legacy MD <select> picker", () => {
    const apply = read("src/components/PlugInApply.tsx");
    // No raw <select> tag in the apply surface
    expect(apply).not.toMatch(/<select\b/);
    // Read-only MD card present instead — Friendly Tone (#123) copy.
    expect(apply).toContain('data-testid="apply-readonly-md"');
    expect(apply).toContain("この知恵で参加します");
  });
});
