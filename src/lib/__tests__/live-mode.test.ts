import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Live Mode (#129) — opt-in toggle", () => {
  it("LiveModeSwitch renders role=switch + aria-checked + Tab-reachable", () => {
    const sw = read("src/components/ui/LiveModeSwitch.tsx");
    expect(sw).toContain('role="switch"');
    expect(sw).toContain('aria-checked={isOn}');
    expect(sw).toContain('data-testid="live-mode-switch"');
    expect(sw).toContain('data-live={isOn ? "on" : "off"}');
    // aria-label flips with state and explains the consequence (sound +
    // higher frequency), so screen readers know what they're enabling.
    expect(sw).toMatch(/音と更新頻度が上がります/);
    expect(sw).toMatch(/1 タップで OFF に戻せます/);
  });

  it("default state is OFF and persists through localStorage 'coinLiveMode'", () => {
    const hook = read("src/hooks/useLiveMode.ts");
    expect(hook).toMatch(/STORAGE_KEY\s*=\s*"coinLiveMode"/);
    // SSR-safe init returns "off" on the server.
    expect(hook).toMatch(/useState<LiveMode>\("off"\)/);
    // localStorage write on toggle.
    expect(hook).toMatch(/window\.localStorage\.setItem\(STORAGE_KEY,\s*next\)/);
  });

  it("First OFF→ON activation flags firstActivation; ack persists in localStorage", () => {
    const hook = read("src/hooks/useLiveMode.ts");
    expect(hook).toMatch(/FIRST_ON_KEY\s*=\s*"coinLiveMode:firstSeen"/);
    expect(hook).toMatch(/setFirstActivation\(true\)/);
    expect(hook).toMatch(/window\.localStorage\.setItem\(FIRST_ON_KEY,\s*"1"\)/);
    const sw = read("src/components/ui/LiveModeSwitch.tsx");
    expect(sw).toContain('data-testid="live-mode-first-toast"');
    expect(sw).toContain("わかりました");
  });
});

describe("CoinCounter — Live mode wiring (#129)", () => {
  const cc = read("src/components/ui/CoinCounter.tsx");

  it("subscribes to useLiveMode and exposes 2s cadence + chime when ON", () => {
    expect(cc).toContain('useLiveMode');
    expect(cc).toMatch(/const LIVE_TICK_MS\s*=\s*2000/);
    expect(cc).toMatch(/data-cadence=\{isLive \? "2s" : "3-5s"\}/);
    expect(cc).toMatch(/data-sound=\{isLive \? "on" : "off"\}/);
    expect(cc).toMatch(/if \(isLive && !isMuted\(\)\)\s*\{[\s\S]*?playPoyon\(\)/);
  });

  it("renders the LIVE pill only in live mode, with motion-reduce-safe pulse", () => {
    expect(cc).toContain('data-testid="coin-counter-live-pill"');
    expect(cc).toMatch(/motion-safe:animate-pulse motion-reduce:animate-none/);
  });

  it("aria-live summary throttles to one announcement per 30 seconds", () => {
    expect(cc).toMatch(/ARIA_THROTTLE_MS\s*=\s*30_000/);
    expect(cc).toContain('data-testid="coin-counter-aria-summary"');
    expect(cc).toMatch(/lastAriaAtRef/);
    expect(cc).toContain("直近 30 秒で +¥");
  });
});

describe("Live Mode — header mounting", () => {
  it("LiveModeSwitch is mounted on both MainHeader (mobile) and AppShell (desktop sidebar)", () => {
    const main = read("src/components/MainHeader.tsx");
    const shell = read("src/components/AppShell.tsx");
    expect(main).toContain('import { LiveModeSwitch } from "@/components/ui/LiveModeSwitch"');
    expect(main).toMatch(/<LiveModeSwitch\b/);
    expect(shell).toContain('import { LiveModeSwitch } from "@/components/ui/LiveModeSwitch"');
    expect(shell).toMatch(/<LiveModeSwitch\s*\/>/);
  });
});
