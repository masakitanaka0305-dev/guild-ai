import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const cmSrc = readFileSync(
  join(ROOT, "src/components/mint/CinematicMint.tsx"),
  "utf-8",
);
const tw = readFileSync(join(ROOT, "tailwind.config.ts"), "utf-8");

describe("Cinematic Mint Phase 3 — dramatic ellipsis + hairline (#129)", () => {
  it("Phase 3 timing extends to 1400ms with three sub-beats summing to 1400ms", () => {
    expect(cmSrc).toMatch(/phase3:\s*1400/);
    const beats = cmSrc.match(/PHASE3_BEATS\s*=\s*\{([\s\S]*?)\}\s*as const;/);
    expect(beats).not.toBeNull();
    const block = beats![1];
    const ms: Record<string, number> = {};
    for (const line of block.split(/\n/)) {
      const mm = line.match(/(fadeMs|tameMs|convergeMs):\s*(\d+)/);
      if (mm) ms[mm[1]] = Number(mm[2]);
    }
    expect(ms.fadeMs).toBe(400);
    expect(ms.tameMs).toBe(600);
    expect(ms.convergeMs).toBe(400);
    expect(ms.fadeMs + ms.tameMs + ms.convergeMs).toBe(1400);
  });

  it("renders three ellipsis dots + paired top/bottom hairlines, with no error mimicry", () => {
    const start = cmSrc.indexOf('data-testid="cinematic-phase-3"');
    const end = cmSrc.indexOf('data-testid="cinematic-phase-4"');
    const phase3 = cmSrc.slice(start, end);
    // Three dots with stable test ids (template-id'd by index).
    expect(phase3).toContain('data-testid="cinematic-phase-3-dots"');
    expect(phase3).toMatch(/data-testid=\{`cinematic-phase-3-dot-\$\{i\}`\}/);
    // The source maps over a 3-element delay array, one dot per element.
    expect(phase3).toMatch(/\[0,\s*200,\s*400\]/);
    // Top + bottom hairlines (template-id'd by position).
    expect(phase3).toContain('data-testid="cinematic-phase-3-hairline-wrap"');
    expect(phase3).toMatch(/data-testid=\{`cinematic-phase-3-hairline-\$\{position\}`\}/);
    expect(phase3).toMatch(/\["top",\s*"bottom"\]/);
    // Beat-driven class swaps map onto the three sub-beats.
    expect(phase3).toContain("animate-ellipsis-pulse");
    expect(phase3).toContain("animate-hairline-grow");
    expect(phase3).toContain("animate-hairline-converge");
    // Still no error / crash / loader iconography.
    expect(phase3).not.toMatch(/エラー|crash|spinner|loader/i);
    expect(phase3).not.toMatch(/bg-red-|text-red-|stroke-red-/i);
    expect(phase3).not.toMatch(/通信中|読み込み中/);
    // Polite SR announce intact.
    expect(phase3).toContain("準備中");
  });

  it("tailwind.config.ts ships the new Phase 3 keyframes", () => {
    expect(tw).toContain("ellipsis-pulse");
    expect(tw).toContain("hairline-grow");
    expect(tw).toContain("hairline-converge");
    // Loop animation for dots — at least 3 cycles inside the 1.4s phase.
    expect(tw).toMatch(/"ellipsis-pulse":\s*"ellipsis-pulse 900ms ease-in-out infinite"/);
  });
});
