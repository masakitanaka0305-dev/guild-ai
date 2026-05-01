import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(
  join(ROOT, "src/components/ui/CoinCounter.tsx"),
  "utf-8",
);

describe("CoinCounter (#130 single-mode) — cadence + silence", () => {
  it("ticks every 3–5 seconds (TICK_MIN_MS=3000, TICK_MAX_MS=5000)", () => {
    expect(src).toMatch(/const TICK_MIN_MS\s*=\s*3000/);
    expect(src).toMatch(/const TICK_MAX_MS\s*=\s*5000/);
    expect(src).toContain('data-cadence="3-5s"');
  });

  it("frequency-guards to ≤ 12 ticks per rolling 60s window", () => {
    expect(src).toMatch(/const MAX_PER_MINUTE\s*=\s*12/);
    expect(src).toMatch(/minuteWindowRef/);
  });

  it("is silent — no playPoyon / soundEnabled / Live mode wiring", () => {
    expect(src).toContain('data-sound="off"');
    expect(src).not.toContain("playPoyon");
    expect(src).not.toContain("useLiveMode");
    expect(src).not.toMatch(/soundEnabled/);
    expect(src).not.toMatch(/LIVE_TICK_MS/);
  });

  it("aria-live polite + fractional yen formatting until ¥100 threshold", () => {
    expect(src).toContain('aria-live="polite"');
    expect(src).toMatch(/minimumFractionDigits:\s*2/);
    expect(src).toMatch(/showFractional/);
  });
});
