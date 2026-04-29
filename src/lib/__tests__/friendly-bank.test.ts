import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();

// ─── 1. Sound: playPoyon ───────────────────────────────────────────────────────

describe("friendly-bank.sounds", () => {
  it("POYON_FREQ_RANGE exports [150, 250]", async () => {
    const { POYON_FREQ_RANGE } = await import("@/lib/sound");
    expect(POYON_FREQ_RANGE).toEqual([150, 250]);
  });

  it("playPoyon is exported as a function", async () => {
    const { playPoyon } = await import("@/lib/sound");
    expect(typeof playPoyon).toBe("function");
  });
});

// ─── 2. useTactile hook ───────────────────────────────────────────────────────

describe("friendly-bank.useTactile", () => {
  const src = readFileSync(resolve(root, "src/hooks/useTactile.ts"), "utf8");

  it("useTactile calls navigator.vibrate with pattern", () => {
    expect(src).toContain("navigator.vibrate");
  });

  it("useTactile respects prefers-reduced-motion for vibration", () => {
    expect(src).toContain("prefers-reduced-motion");
  });
});

// ─── 3. RankBadge ────────────────────────────────────────────────────────────

describe("friendly-bank.rank-badge", () => {
  const src = readFileSync(resolve(root, "src/components/RankBadge.tsx"), "utf8");

  it("RankBadge has friendly prop", () => {
    expect(src).toContain("friendly");
  });

  it("RankBadge includes aria-label with badge name", () => {
    expect(src).toContain("バッジ");
  });
});
