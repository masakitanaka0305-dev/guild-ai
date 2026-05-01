import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const cmSrc = readFileSync(
  join(ROOT, "src/components/mint/CinematicMint.tsx"),
  "utf-8",
);
const tw = readFileSync(join(ROOT, "tailwind.config.ts"), "utf-8");

describe("Cinematic Mint (#128) — 4-phase reveal", () => {
  it("renders all four phases with stable data-testid hooks", () => {
    expect(cmSrc).toContain('data-testid="cinematic-mint"');
    expect(cmSrc).toContain('data-testid="cinematic-phase-1"');
    expect(cmSrc).toContain('data-testid="cinematic-phase-2"');
    expect(cmSrc).toContain('data-testid="cinematic-phase-3"');
    expect(cmSrc).toContain('data-testid="cinematic-phase-4"');
  });

  it("phase total is ≤ 5.4s (1.4s + 1.4s + 1.4s + 1.0s = 5.2s after #129)", () => {
    const m = cmSrc.match(/const PHASE_TIMINGS\s*=\s*\{([\s\S]*?)\}\s*as const;/);
    expect(m).not.toBeNull();
    const block = m![1];
    const phaseMs: Record<string, number> = {};
    for (const line of block.split(/\n/)) {
      const mm = line.match(/(phase[1-4]):\s*(\d+)/);
      if (mm) phaseMs[mm[1]] = Number(mm[2]);
    }
    expect(phaseMs.phase1).toBe(1400);
    expect(phaseMs.phase2).toBe(1400);
    expect(phaseMs.phase3).toBe(1400);
    expect(phaseMs.phase4).toBe(1000);
    const total = phaseMs.phase1 + phaseMs.phase2 + phaseMs.phase3 + phaseMs.phase4;
    expect(total).toBeLessThanOrEqual(5400);
  });

  it("reduced-motion path collapses to a single ≤ 0.5s settle (Phase 4 only)", () => {
    expect(cmSrc).toMatch(/const REDUCED_TIMING\s*=\s*500/);
    expect(cmSrc).toMatch(/usePrefersReducedMotion/);
    // The phase initial state already jumps to 4 when reduced is true.
    expect(cmSrc).toMatch(/useState<1 \| 2 \| 3 \| 4>\(reduced \? 4 : 1\)/);
  });

  it("Phase 3 curtain has zero error/crash/red affordances (calm only)", () => {
    // Phase 3 JSX block must NOT mention error / crash / red iconography.
    const start = cmSrc.indexOf('data-testid="cinematic-phase-3"');
    const end = cmSrc.indexOf('data-testid="cinematic-phase-4"');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const phase3 = cmSrc.slice(start, end);
    expect(phase3).not.toMatch(/エラー/);
    expect(phase3).not.toMatch(/crash/i);
    expect(phase3).not.toMatch(/bg-red-|text-red-|stroke-red-/i);
    expect(phase3).not.toMatch(/真っ暗|無音/);
    // It DOES advertise itself politely to screen readers.
    expect(phase3).toContain("準備中");
  });

  it("Phase 4 reveal card carries a rank-aware glow (S → gold)", () => {
    expect(cmSrc).toContain("rankGlowShadow");
    expect(cmSrc).toMatch(/case "S":[\s\S]*?shadow-brand-glow-gold/);
    expect(cmSrc).toMatch(/case "A":[\s\S]*?#94A3B8/);
    expect(cmSrc).toMatch(/case "B":[\s\S]*?#B45309/);
  });
});

describe("Cinematic Mint (#128) — animation tokens", () => {
  it("tailwind.config.ts wires the cinematic keyframes", () => {
    for (const key of [
      "matrix-drift",
      "crystal-spin",
      "particle-orbit",
      "curtain-fade",
      "gold-glow",
      "hero-rise",
    ]) {
      expect(tw).toContain(key);
    }
  });

  it("brand-glow + brand-glow-gold shadow tokens exist", () => {
    expect(tw).toContain('"brand-glow"');
    expect(tw).toContain("rgba(76,29,149,0.45)");
    expect(tw).toContain("brand-glow-gold");
    expect(tw).toContain("rgba(245,158,11,0.45)");
  });
});
