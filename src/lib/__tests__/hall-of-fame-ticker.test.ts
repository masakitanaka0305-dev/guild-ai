import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  anonymizeHandle,
  buildHoFTickerStack,
  makePeerSMintEvent,
  makeSelfRecentCallsEvent,
  TICKER_INTERVAL_MS,
  TICKER_DISMISS_HOURS,
  TICKER_DISMISS_KEY,
} from "@/lib/hall-of-fame-ticker";

const ROOT = process.cwd();

describe("Hall of Fame Ticker (#130) — anonymization + cadence", () => {
  it("peer handles are anonymized to first/last + masked middle (1–5 stars)", () => {
    // 6-char "haruyo" → @h + 4 stars + o
    expect(anonymizeHandle("haruyo")).toMatch(/^@h\*{1,5}o$/);
    expect(anonymizeHandle("@kotaro")).toMatch(/^@k\*{1,5}o$/);
    expect(anonymizeHandle("ab")).toBe("@ab");        // too short to mask
    expect(anonymizeHandle("abc")).toBe("@a*c");      // 3-char fallback
    // Long handles cap at 5 stars.
    expect(anonymizeHandle("longhandle123")).toBe("@l*****3");
    // Same input always returns the same masked handle.
    expect(anonymizeHandle("nine.lab")).toBe(anonymizeHandle("nine.lab"));
  });

  it("peer S-mint event names a masked handle + a real title", () => {
    const e = makePeerSMintEvent("seed-1", "2026-05-01T09:00:00.000Z");
    expect(e.kind).toBe("peer_s_mint");
    expect(e.message).toMatch(/^@.+ さんの『.+』が金の太鼓判を獲得$/);
    expect(e.handleDisplay.startsWith("@")).toBe(true);
    // Anonymized — never spells out the raw username.
    expect(e.message).toMatch(/@.{1,2}\*+.{1}/);
  });

  it("self-event reports actual unique users from the last 24h, no extrapolation", () => {
    const e = makeSelfRecentCallsEvent("you", 41, "2026-05-01T09:00:00.000Z");
    expect(e.kind).toBe("self_recent_calls");
    expect(e.message).toBe("@you の知恵が直近 24 時間で 41 人に使われました");
    expect(e.message).not.toMatch(/急騰|暴落|％\s*上昇/);
  });

  it("buildHoFTickerStack alternates self facts with peer announcements + 30s cadence constant", () => {
    const stack = buildHoFTickerStack("you", 41);
    expect(stack).toHaveLength(6);
    // i=0,3 are self (every 3rd); 1,2,4,5 are peer.
    expect(stack[0].kind).toBe("self_recent_calls");
    expect(stack[1].kind).toBe("peer_s_mint");
    expect(stack[3].kind).toBe("self_recent_calls");
    expect(TICKER_INTERVAL_MS).toBe(30_000);
    expect(TICKER_DISMISS_HOURS).toBe(24);
    expect(TICKER_DISMISS_KEY).toBe("halloffame_dismissed_until");
  });
});

describe("HallOfFameTicker — UI surface", () => {
  const t = readFileSync(
    join(ROOT, "src/components/HallOfFameTicker.tsx"),
    "utf-8",
  );
  const shell = readFileSync(join(ROOT, "src/components/AppShell.tsx"), "utf-8");

  it("renders aria-live polite, dismiss button + AppShell mounting", () => {
    expect(t).toContain('data-testid="halloffame-ticker"');
    expect(t).toContain('aria-live="polite"');
    expect(t).toContain('data-interval-ms={TICKER_INTERVAL_MS}');
    expect(t).toContain('data-testid="halloffame-ticker-dismiss"');
    expect(t).toContain('aria-label="このティッカーを 24 時間閉じる"');
    expect(shell).toContain('import { HallOfFameTicker }');
    expect(shell).toMatch(/<HallOfFameTicker\s*\/>/);
  });

  it("dismiss action persists 24h via localStorage halloffame_dismissed_until", () => {
    expect(t).toMatch(/TICKER_DISMISS_KEY/);
    expect(t).toMatch(/TICKER_DISMISS_HOURS/);
    expect(t).toContain("setItem(TICKER_DISMISS_KEY,");
  });
});
