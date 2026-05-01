import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Live mode (#129) is fully removed (#130)", () => {
  it("the hook + switch + dedicated test file are deleted", () => {
    expect(existsSync(join(ROOT, "src/hooks/useLiveMode.ts"))).toBe(false);
    expect(existsSync(join(ROOT, "src/components/ui/LiveModeSwitch.tsx"))).toBe(false);
    expect(existsSync(join(ROOT, "src/lib/__tests__/live-mode.test.ts"))).toBe(false);
  });

  it("MainHeader + AppShell no longer mount the LiveModeSwitch", () => {
    const main = read("src/components/MainHeader.tsx");
    const shell = read("src/components/AppShell.tsx");
    expect(main).not.toContain("LiveModeSwitch");
    expect(shell).not.toContain("LiveModeSwitch");
  });

  it("CoinCounter dropped useLiveMode + chime + LIVE pill wiring", () => {
    const cc = read("src/components/ui/CoinCounter.tsx");
    expect(cc).not.toContain("useLiveMode");
    expect(cc).not.toContain("playPoyon");
    expect(cc).not.toContain("LIVE_TICK_MS");
    expect(cc).not.toContain("forceLiveMode");
    expect(cc).not.toContain('coin-counter-live-pill');
    // single 3-5s contract is preserved
    expect(cc).toContain('data-cadence="3-5s"');
    expect(cc).toContain('data-sound="off"');
  });
});
