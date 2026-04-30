import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();

// ─── 1. CSS tokens ────────────────────────────────────────────────────────────

describe("nameraka-theme.tokens", () => {
  const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

  it("globals.css defines Water theme --primary token (#06B6D4)", () => {
    expect(css).toContain("--primary: #06B6D4");
  });

  it("globals.css defines Water theme --bg token (#020617)", () => {
    expect(css).toContain("--bg: #020617");
  });

  it("globals.css does NOT define pro or kawaii themes (deleted)", () => {
    expect(css).not.toContain('[data-theme="pro"]');
    expect(css).not.toContain('[data-theme="kawaii"]');
  });

  it("globals.css has scanLine animation for bank assessment", () => {
    expect(css).toContain("scanLine");
  });

  it("globals.css has slideInToast animation for FloatingPayoutToast", () => {
    expect(css).toContain("slideInToast");
  });
});

// ─── 3. FAB (+のこす) ─────────────────────────────────────────────────────────

describe("nameraka-theme.fab", () => {
  // FAB lives in AppShell (extracted from layout for auth-path isolation)
  const layout = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8")
               + readFileSync(resolve(root, "src/components/AppShell.tsx"), "utf8");

  it("layout has FAB (＋) linking to /onboarding", () => {
    expect(layout).toContain("href=\"/onboarding\"");
    expect(layout).toContain("＋");
  });

  it("FAB has aria-label for accessibility", () => {
    expect(layout).toContain('aria-label="出す"');
  });
});

// ─── 4. 査定額レンジ ──────────────────────────────────────────────────────────

describe("nameraka-theme.assessment-range", () => {
  it("computeAssessmentRange returns min >= 500", async () => {
    const { computeAssessmentRange } = await import("@/lib/instant-buyout");
    const [min] = computeAssessmentRange(10);
    expect(min).toBeGreaterThanOrEqual(500);
  });

  it("computeAssessmentRange returns max <= 500000", async () => {
    const { computeAssessmentRange } = await import("@/lib/instant-buyout");
    const [, max] = computeAssessmentRange(100);
    expect(max).toBeLessThanOrEqual(500_000);
  });
});

// ─── 5. 0秒換金オファー (S/A only) ────────────────────────────────────────────

describe("nameraka-theme.instant-buyout", () => {
  it("offerInstantBuyout returns offer for S rank", async () => {
    const { offerInstantBuyout } = await import("@/lib/instant-buyout");
    const offer = offerInstantBuyout({ rank: "S", score: 90, reasons: [], justification: "" });
    expect(offer).not.toBeNull();
    expect(offer!.amountJpy).toBeGreaterThanOrEqual(5000);
    expect(offer!.expiresInSec).toBe(30);
  });

  it("offerInstantBuyout returns offer for A rank", async () => {
    const { offerInstantBuyout } = await import("@/lib/instant-buyout");
    const offer = offerInstantBuyout({ rank: "A", score: 70, reasons: [], justification: "" });
    expect(offer).not.toBeNull();
    expect(offer!.amountJpy).toBeGreaterThanOrEqual(5000);
  });

  it("offerInstantBuyout returns null for B rank", async () => {
    const { offerInstantBuyout } = await import("@/lib/instant-buyout");
    const offer = offerInstantBuyout({ rank: "B", score: 40, reasons: [], justification: "" });
    expect(offer).toBeNull();
  });

  it("offer amount is clamped to [5000, 500000]", async () => {
    const { offerInstantBuyout } = await import("@/lib/instant-buyout");
    const low = offerInstantBuyout({ rank: "A", score: 1, reasons: [], justification: "" });
    const high = offerInstantBuyout({ rank: "S", score: 100, reasons: [], justification: "" });
    expect(low!.amountJpy).toBeGreaterThanOrEqual(5000);
    expect(high!.amountJpy).toBeLessThanOrEqual(500_000);
  });
});

// ─── 6. 適合率計算 ────────────────────────────────────────────────────────────

describe("nameraka-theme.match-fit", () => {
  it("computeFit returns 0 for empty recipe list", async () => {
    const { computeFit } = await import("@/lib/match-fit");
    expect(computeFit("job_001", [])).toBe(0);
  });

  it("computeFit returns higher score with more recipes", async () => {
    const { computeFit } = await import("@/lib/match-fit");
    const low = computeFit("job_001", ["r1"]);
    const high = computeFit("job_001", ["r1", "r2", "r3", "r4"]);
    expect(high).toBeGreaterThan(low);
  });

  it("computeFit returns value in [0, 100]", async () => {
    const { computeFit } = await import("@/lib/match-fit");
    const fit = computeFit("job_002", ["r1", "r2", "r3", "r4", "r5"]);
    expect(fit).toBeGreaterThanOrEqual(0);
    expect(fit).toBeLessThanOrEqual(100);
  });
});

// ─── 7. FloatingPayoutToast ───────────────────────────────────────────────────

describe("nameraka-theme.floating-payout-toast", () => {
  const src = readFileSync(resolve(root, "src/components/FloatingPayoutToast.tsx"), "utf8");

  it("FloatingPayoutToast has aria-live=polite", () => {
    expect(src).toContain('aria-live="polite"');
  });

  it("FloatingPayoutToast uses slideInToast animation", () => {
    expect(src).toContain("slideInToast");
  });
});

// ─── 8. Royalty stream ────────────────────────────────────────────────────────

describe("nameraka-theme.royalty-stream", () => {
  it("ROYALTY_EVENTS_PER_MINUTE is 2", async () => {
    const { ROYALTY_EVENTS_PER_MINUTE } = await import("@/lib/royalty-stream");
    expect(ROYALTY_EVENTS_PER_MINUTE).toBe(2);
  });
});

// ─── 9. Light nameraka (v2 repaint) ─────────────────────────────────────────

describe("nameraka-theme.light-repaint", () => {
  const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
  // FAB lives in AppShell (extracted from layout for auth-path isolation)
  const layout = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8")
               + readFileSync(resolve(root, "src/components/AppShell.tsx"), "utf8");
  const nav = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");

  it("water theme --bg is dark (#020617) replacing old nameraka light bg", () => {
    expect(css).toContain("--bg: #020617");
  });

  it("bottom nav has 2 core tabs (探す/稼ぐ) + center FAB (出す) with role=tablist", () => {
    expect(nav).toContain('"探す"');
    expect(nav).toContain('"稼ぐ"');
    expect(nav).toContain("tablist");
    expect(nav).toContain('"出す"');
  });

  it("FAB links to /onboarding (Quick Listing) with aria-label", () => {
    expect(layout).toContain('href="/onboarding"');
    expect(layout).toContain('aria-label="出す"');
  });

  it("fitLabel returns ぴったり/もう少し/これから at correct thresholds", async () => {
    const { fitLabel } = await import("@/lib/match-fit");
    expect(fitLabel(80)).toBe("ぴったり");
    expect(fitLabel(79)).toBe("もう少し");
    expect(fitLabel(50)).toBe("もう少し");
    expect(fitLabel(49)).toBe("これから");
    expect(fitLabel(0)).toBe("これから");
  });
});

// ─── 10. Jargon lint (nameraka) ──────────────────────────────────────────────

describe("nameraka-theme.jargon-lint-v2", () => {
  it("SidebarNav has 3-tab labels (探す/出す/稼ぐ)", () => {
    const src = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");
    expect(src).toContain("探す");
    expect(src).toContain("出す");
    expect(src).toContain("稼ぐ");
  });

  it("nameraka nav does not show English technical terms in labels", () => {
    const src = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");
    // namerakaLabel lines should only contain Japanese / hiragana text, not English tech terms
    const lines = src.split("\n").filter((l) => l.includes("namerakaLabel:"));
    for (const line of lines) {
      // Extract the string value after namerakaLabel:
      const m = line.match(/namerakaLabel:\s*"([^"]+)"/);
      if (m) {
        const label = m[1];
        // Should not be purely ASCII English
        expect(label).not.toMatch(/^[A-Za-z ]+$/);
      }
    }
  });
});
