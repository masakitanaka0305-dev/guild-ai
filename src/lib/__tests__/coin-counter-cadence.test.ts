import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(
  join(ROOT, "src/components/ui/CoinCounter.tsx"),
  "utf-8",
);

describe("Cinematic Mint (#128 / #129 Live Mode) — CoinCounter cadence + sound default", () => {
  it("default cadence is 3–5 seconds (TICK_MIN_MS=3000, TICK_MAX_MS=5000)", () => {
    expect(src).toMatch(/const TICK_MIN_MS\s*=\s*3000/);
    expect(src).toMatch(/const TICK_MAX_MS\s*=\s*5000/);
    // data-cadence resolves dynamically from useLiveMode's `isLive` flag.
    expect(src).toMatch(/data-cadence=\{isLive \? "2s" : "3-5s"\}/);
  });

  it("frequency-guards to ≤ 12 ticks per rolling 60s window in default mode", () => {
    expect(src).toMatch(/const MAX_PER_MINUTE\s*=\s*12/);
    expect(src).toMatch(/minuteWindowRef/);
    // Live mode bypasses the relaxed-mode rate limit since the user
    // explicitly opted in.
    expect(src).toMatch(/if \(!isLive\) \{[\s\S]*?MAX_PER_MINUTE/);
  });

  it("sound stays default-muted; chime fires only when isLive && !isMuted()", () => {
    expect(src).toMatch(/data-sound=\{isLive \? "on" : "off"\}/);
    expect(src).toMatch(/if \(isLive && !isMuted\(\)\) \{[\s\S]*?playPoyon\(\)/);
  });

  it("aria-live summary throttles + fractional yen formatting until ¥100 threshold", () => {
    expect(src).toContain('aria-live="polite"');
    expect(src).toMatch(/minimumFractionDigits:\s*2/);
    expect(src).toMatch(/showFractional/);
    expect(src).toMatch(/ARIA_THROTTLE_MS\s*=\s*30_000/);
  });
});
