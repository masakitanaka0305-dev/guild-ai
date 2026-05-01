import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(
  join(ROOT, "src/components/ui/CoinCounter.tsx"),
  "utf-8",
);

describe("Cinematic Mint (#128) — CoinCounter cadence + sound default", () => {
  it("ticks every 3–5 seconds (TICK_MIN_MS=3000, TICK_MAX_MS=5000)", () => {
    expect(src).toMatch(/const TICK_MIN_MS\s*=\s*3000/);
    expect(src).toMatch(/const TICK_MAX_MS\s*=\s*5000/);
    expect(src).toContain('data-cadence="3-5s"');
  });

  it("frequency-guards to ≤ 12 ticks per rolling 60s window", () => {
    expect(src).toMatch(/const MAX_PER_MINUTE\s*=\s*12/);
    expect(src).toMatch(/minuteWindowRef/);
  });

  it("sound is default-muted (soundEnabled defaults to false)", () => {
    expect(src).toMatch(/soundEnabled\s*=\s*false/);
    expect(src).toContain('data-sound={soundEnabled ? "on" : "off"}');
  });

  it("aria-live polite + fractional yen formatting until ¥1 threshold", () => {
    expect(src).toContain('aria-live="polite"');
    expect(src).toMatch(/minimumFractionDigits:\s*2/);
    expect(src).toMatch(/showFractional/);
  });
});
