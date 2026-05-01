import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Mercari Lightness (#126) — EarningTicker (subtle global pulse)", () => {
  const ticker = read("src/components/ui/EarningTicker.tsx");

  it("subscribes to useLiveEarnings and shows +¥X with tabular nums", () => {
    expect(ticker).toContain("useLiveEarnings");
    expect(ticker).toContain("+¥");
    expect(ticker).toContain("tabular-nums");
  });

  it("respects reduced-motion (motion-safe fade-in, motion-reduce pulse off)", () => {
    expect(ticker).toContain("motion-safe:animate-fade-in");
    expect(ticker).toContain("motion-reduce:animate-none");
  });

  it("announces updates politely via aria-live", () => {
    expect(ticker).toContain('aria-live="polite"');
    expect(ticker).toContain('aria-atomic="true"');
    expect(ticker).toContain('data-testid="earning-ticker"');
  });

  it("MainHeader and AppShell mount the EarningTicker chip", () => {
    const main = read("src/components/MainHeader.tsx");
    const shell = read("src/components/AppShell.tsx");
    expect(main).toContain('import { EarningTicker }');
    expect(main).toMatch(/<EarningTicker\b/);
    expect(shell).toContain('import { EarningTicker }');
    expect(shell).toMatch(/<EarningTicker\b/);
  });
});
