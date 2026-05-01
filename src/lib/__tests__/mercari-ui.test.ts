import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../../..");

// ─── 1. Catchphrase in hero ───────────────────────────────────────────────────
// Note: / now redirects to /projects (3-tab navigation). Catchphrase lives in layout metadata.

describe("catchphrase: hero", () => {
  const layoutSrc = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");
  const pageSrc = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");

  it("layout metadata has main catchphrase", () => {
    expect(layoutSrc).toContain("AIエージェントで、あなたの時間をアップデート。");
    expect(layoutSrc).toContain("日本最大のAIエージェント・プラットフォーム");
  });

  it("home page redirects to /projects (3-tab navigation)", () => {
    expect(pageSrc).toContain("redirect");
    expect(pageSrc).toContain("/projects");
  });

  it("projects page exists and has main content", () => {
    const projSrc = readFileSync(resolve(root, "src/app/projects/page.tsx"), "utf8");
    expect(projSrc.length).toBeGreaterThan(100);
  });
});

// ─── 1b. Minimal home sections ───────────────────────────────────────────────
// / now redirects to /projects; onboarding has quick listing CTA.

describe("catchphrase: minimal home", () => {
  it("onboarding page is the Smart Pre-fill confirmation flow (Water Guild v1)", () => {
    // Repo-picker UI moved to /onboarding/repos. /onboarding is now the
    // confirmation form per the Water Guild Hexagonal Robustness MVP spec.
    const src = readFileSync(resolve(root, "src/app/onboarding/page.tsx"), "utf8");
    expect(src).toContain("Smart Pre-fill");
    expect(src).toContain("確認して進む");
    expect(src).toContain("MOCK_OAUTH_PROFILE");
  });

  it("onboarding page wires the express run state machine", () => {
    const src = readFileSync(resolve(root, "src/app/onboarding/page.tsx"), "utf8");
    expect(src).toContain("runOnboarding");
    expect(src).toContain("currentStepIdx");
  });

  it("projects page has cases/jobs content", () => {
    const src = readFileSync(resolve(root, "src/app/projects/page.tsx"), "utf8");
    expect(src.length).toBeGreaterThan(100);
  });

  it("guild page has 稼ぐ hero", () => {
    const src = readFileSync(resolve(root, "src/app/guild/page.tsx"), "utf8");
    expect(src).toContain("稼ぐ");
  });
});

// ─── 2. metadata.title matches catchphrase ───────────────────────────────────

describe("catchphrase: metadata", () => {
  const src = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");

  it("metadata.title uses new format with platform subline", () => {
    expect(src).toContain("AIエージェントで、あなたの時間をアップデート。｜日本最大のAIエージェント・プラットフォーム");
  });

  it("og:description is platform subline", () => {
    expect(src).toContain("日本最大のAIエージェント・プラットフォーム");
  });

  it("home metadata subline in layout.tsx", () => {
    const layoutSrc = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");
    expect(layoutSrc).toContain("日本最大のAIエージェント・プラットフォーム");
  });
});

// ─── 3. Primary blue #06B6D4 in globals.css ────────────────────────────────────

describe("mercari-ui: primary color token", () => {
  const src = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

  it("--primary aliases through the semantic ai-action token (Logic White)", () => {
    // Logic White (#125): legacy --primary now redirects to the
    // semantic --color-ai-action variable so it tracks the theme.
    expect(src).toMatch(/--primary:\s*var\(--color-ai-action\)/);
  });

  it("--primary-hover stays as a literal Royal Blue darker tone", () => {
    expect(src).toMatch(/--primary-hover:\s*#4338CA/);
  });
});

// ─── 4. BottomNav has 3 tabs (探す/出す/稼ぐ) ────────────────────────────────

describe("mercari-ui: bottom tabs", () => {
  const src = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");

  it("NAV_ITEMS has 2 tabs (探す/稼ぐ) + PRIMARY_ACTION (出す) with role=tablist", () => {
    expect(src).toContain('"探す"');
    expect(src).toContain('"稼ぐ"');
    expect(src).toContain("tablist");
    expect(src).toContain('"出す"');
  });

  it("BottomNav exports correct component", () => {
    expect(src).toContain("export function BottomNav");
  });
});

// ─── 5. FAB href=/onboarding aria-label="投稿" ─────────────────────────────

describe("mercari-ui: FAB", () => {
  // Floating-FAB removed in UX pass 2; the ＋ entry now lives in
  // BottomNav (SidebarNav) + MainHeader. Concatenate them so the
  // legacy assertion still expresses the same intent.
  const src = readFileSync(resolve(root, "src/components/AppShell.tsx"), "utf8")
            + readFileSync(resolve(root, "src/components/MainHeader.tsx"), "utf8")
            + readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");

  it("FAB links to /onboarding (Quick Listing)", () => {
    expect(src).toContain('href="/onboarding"');
  });

  it('FAB has aria-label="出す"', () => {
    expect(src).toContain('aria-label="出す"');
  });
});

// ─── 7. MD file input on bank page ───────────────────────────────────────────

describe("sell: MD file input", () => {
  const src = readFileSync(resolve(root, "src/app/bank/page.tsx"), "utf8");

  it("file input accepts .md/.markdown/.txt", () => {
    expect(src).toContain('accept=".md,.markdown,text/markdown,text/plain"');
  });

  it("file input has aria-label for accessibility", () => {
    expect(src).toContain('aria-label="MD ファイルを選ぶ"');
  });

  it("drop zone has role=region and aria-label", () => {
    expect(src).toContain('role="region"');
    expect(src).toContain('aria-label="MD ファイルをドラッグ＆ドロップ"');
  });

  it("textarea has aria-label for direct input", () => {
    expect(src).toContain('aria-label="MD を直接書く"');
  });

  it("size limit is 1MB (1048576 bytes)", () => {
    expect(src).toContain("1_048_576");
  });

  it("extension validation rejects non-md files", () => {
    expect(src).toContain("isAllowedFile");
    expect(src).toContain(".md");
    expect(src).toContain(".markdown");
    expect(src).toContain(".txt");
  });

  it("dragging state class switches on drag-over", () => {
    expect(src).toContain("isDragging");
    expect(src).toContain("border-[#06B6D4]");
    expect(src).toContain("bg-red-50");
  });

  it("submit button is disabled when content is short", () => {
    expect(src).toContain("noteContent.trim().length < 10");
    expect(src).toContain("disabled");
  });
});

// ─── 8. 3-tab + Quick Listing ────────────────────────────────────────────────
// / redirects to /projects; quick listing at /onboarding replaces old home CTAs.

describe("home: unified how-block", () => {
  it("home page.tsx redirects to /projects", () => {
    const src = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
    expect(src).toContain("redirect");
    expect(src).toContain("/projects");
  });

  it("onboarding page surfaces the Express Path with Smart Pre-fill (Water Guild v1)", () => {
    const src = readFileSync(resolve(root, "src/app/onboarding/page.tsx"), "utf8");
    expect(src).toContain("Express Path");
    expect(src).toContain("登記");
  });

  it("no UI file contains the removed 'いますぐ ¥30,000 から' chip", () => {
    const src = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
    expect(src).not.toContain("いますぐ ¥30,000 から");
  });

  it("guild page has さらに稼ぐ → CTA for monetization", () => {
    const src = readFileSync(resolve(root, "src/app/guild/page.tsx"), "utf8");
    expect(src).toContain("さらに稼ぐ");
  });

  it("nav config has MAIN_TABS with 3 entries", () => {
    const src = readFileSync(resolve(root, "src/lib/nav-config.ts"), "utf8");
    expect(src).toContain("MAIN_TABS");
    expect(src).toContain("/projects");
    expect(src).toContain("/onboarding");
    expect(src).toContain("/guild");
  });
});

// ─── 9. Onboarding modal ─────────────────────────────────────────────────────

describe("onboarding: banner and modal", () => {
  const modalSrc  = readFileSync(resolve(root, "src/components/OnboardingModal.tsx"), "utf8");

  it("onboarding draft page has consent checkbox and legal agreement", () => {
    // Consent moved to draft/Mint page in Water theme
    const src = readFileSync(resolve(root, "src/app/onboarding/draft/[owner]/[repo]/page.tsx"), "utf8");
    expect(src).toContain("consented");
    expect(src).toContain("利用規約");
  });

  it("modal contains 4 steps in <ol>", () => {
    expect(modalSrc).toMatch(/<ol/);
    expect(modalSrc).toContain("ノートを投稿する");
    expect(modalSrc).toContain("AIが自動で稼働");
    expect(modalSrc).toContain("報酬が入る");
    expect(modalSrc).toContain("運用で確認");
  });

  it("modal CTA links to /sell", () => {
    expect(modalSrc).toContain("今すぐ投稿する");
    expect(modalSrc).toContain('href="/sell"');
  });

  it("modal step bodies contain key highlight terms", () => {
    expect(modalSrc).toContain("専用の API エンドポイント");
    expect(modalSrc).toContain("100%");
    expect(modalSrc).toContain("推定時給");
    expect(modalSrc).toContain("max-h-[80vh]");
    expect(modalSrc).toContain("overflow-y-auto");
  });

  it("modal shows 100% and does not show 70%", () => {
    expect(modalSrc).toContain("100%");
    expect(modalSrc).not.toContain("70%");
  });
});

// ─── 6. jargon-lint: allowed terms don't trigger forbidden list ───────────────

describe("jargon-lint: permitted mercari-copy terms", () => {
  const lintSrc = readFileSync(resolve(root, "src/lib/__tests__/jargon-lint.test.ts"), "utf8");

  it("AIエージェント is NOT in the FORBIDDEN list", () => {
    const forbiddenSection = lintSrc.split("const FORBIDDEN")[1]?.split("];")[0] ?? "";
    expect(forbiddenSection).not.toContain("AIエージェント");
  });

  it("アップデート is NOT in the FORBIDDEN list", () => {
    const forbiddenSection = lintSrc.split("const FORBIDDEN")[1]?.split("];")[0] ?? "";
    expect(forbiddenSection).not.toContain("アップデート");
  });

  it("JPYC is still forbidden", () => {
    expect(lintSrc).toContain('"JPYC"');
  });

  it("取引所 is still forbidden", () => {
    expect(lintSrc).toContain('"取引所"');
  });
});

// ─── 10. Clarity: explainer heroes + 通帳 unification + Tip tooltip ───────────

describe("clarity: explainer heroes and 通帳 unification", () => {
  const jobsSrc  = readFileSync(resolve(root, "src/app/jobs/page.tsx"), "utf8");
  const guildSrc = readFileSync(resolve(root, "src/app/guild/page.tsx"), "utf8");
  const tipSrc   = readFileSync(resolve(root, "src/components/Tip.tsx"), "utf8");

  it("/jobs page has hero explainer block for 稼ぐ", () => {
    expect(jobsSrc).toContain("稼ぐ：あなたの");
  });

  it("/guild page has 運用中の資産 section for active assets", () => {
    expect(guildSrc).toContain("運用中の資産");
  });

  it("no UI file contains お財布通帳", () => {
    const homeSrc  = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
    expect(homeSrc).not.toContain("お財布通帳");
    expect(guildSrc).not.toContain("お財布通帳");
    expect(jobsSrc).not.toContain("お財布通帳");
  });

  it("/guild page has 通帳 section heading for transaction history", () => {
    expect(guildSrc).toContain("通帳：これまでの");
  });

  it("Tip component uses aria-describedby for accessibility", () => {
    expect(tipSrc).toContain("aria-describedby");
  });
});

// ─── 11. Tone: 18y/o-friendly copy (投稿/稼ぐ/報酬/資産) ─────────────────────

describe("tone: 18y/o-friendly copy", () => {
  const homeSrc  = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
  const navSrc   = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");
  const guildSrc = readFileSync(resolve(root, "src/app/guild/page.tsx"), "utf8");
  const modalSrc = readFileSync(resolve(root, "src/components/OnboardingModal.tsx"), "utf8");

  it("bottom nav labels are 探す/出す/稼ぐ (3-tab)", () => {
    expect(navSrc).toContain('"探す"');
    expect(navSrc).toContain('"出す"');
    expect(navSrc).toContain('"稼ぐ"');
  });

  it("onboarding CTA is 「確認して進む — 登記（Sync）開始」 (Water Guild v1)", () => {
    const onboardSrc = readFileSync(resolve(root, "src/app/onboarding/page.tsx"), "utf8");
    expect(onboardSrc).toContain("確認して進む");
    expect(onboardSrc).toContain("登記");
  });

  it("/guild hero contains 報酬, 資産, 推定時給", () => {
    expect(guildSrc).toContain("報酬");
    expect(guildSrc).toContain("資産");
    expect(guildSrc).toContain("推定時給");
  });

  it("onboarding 4 steps use mature labels", () => {
    expect(modalSrc).toContain("ノートを投稿する");
    expect(modalSrc).toContain("AIが自動で稼働");
    expect(modalSrc).toContain("報酬が入る");
    expect(modalSrc).toContain("運用で確認");
  });
});

// ─── 12. 運用リネーム + モバイル修正 + 残骸一掃 ──────────────────────────────

describe("guild-rename: 運用 / mobile / cleanup", () => {
  const navSrc   = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");
  const guildSrc = readFileSync(resolve(root, "src/app/guild/page.tsx"), "utf8");
  const homeSrc  = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
  const modalSrc = readFileSync(resolve(root, "src/components/OnboardingModal.tsx"), "utf8");

  it("NAV_ITEMS has 稼ぐ tab pointing to /guild", () => {
    expect(navSrc).toContain('"稼ぐ"');
    expect(navSrc).toContain('"/guild"');
    expect(navSrc).not.toContain('"マイ銀行"');
  });

  it("/guild page has Mercari-style 売上金ヒーロー and 稼ぐ heading", () => {
    expect(guildSrc).toContain("稼ぐ");
    expect(guildSrc).toContain("Asset Ledger");
    expect(guildSrc).not.toContain("マイ銀行：あなたの");
  });

  it("no UI contains Lodge / 初めての提出 / お財布通帳", () => {
    expect(navSrc).not.toContain("はじめての提出");
    expect(navSrc).not.toContain("おさいふ通帳");
    expect(homeSrc).not.toContain("お財布通帳");
    expect(guildSrc).not.toContain("お財布通帳");
    expect(modalSrc).not.toContain("マイ銀行で確認");
  });

  it("/guild page has 通帳 section", () => {
    expect(guildSrc).toContain("通帳：これまでの取引");
  });

  it("/guild main has pb-24 for mobile safe area", () => {
    expect(guildSrc).toContain("pb-24");
  });
});

// ─── 13. 総資産カード ──────────────────────────────────────────────────────────

describe("total-assets: hero card", () => {
  const guildSrc  = readFileSync(resolve(root, "src/app/guild/page.tsx"), "utf8");
  const cardSrc   = readFileSync(resolve(root, "src/components/TotalAssetsCard.tsx"), "utf8");
  const portfolioSrc = readFileSync(resolve(root, "src/lib/portfolio/index.ts"), "utf8");

  it("/guild page contains 総資産 heading", () => {
    expect(guildSrc).toContain("TotalAssetsCard");
    expect(cardSrc).toContain("総資産");
  });

  it("getTotalPortfolio is deterministic (same output on repeated calls)", async () => {
    const { getTotalPortfolio } = await import("@/lib/portfolio");
    const a = getTotalPortfolio();
    const b = getTotalPortfolio();
    expect(a.currentBalanceJpy).toBe(b.currentBalanceJpy);
    expect(a.lifetimeEarningsJpy).toBe(b.lifetimeEarningsJpy);
    expect(a.runningAssetValueJpy).toBe(b.runningAssetValueJpy);
    expect(a.monthlyChangePct).toBe(b.monthlyChangePct);
  });

  it("monthlyChangePct positive → cyan accent, negative → coral red (Water Guild v2)", () => {
    // Water Guild v2 swaps the legacy emerald + crimson pair for cyan + coral
    // to align with the deep-sea palette and stay AA-readable on #0B1121.
    expect(cardSrc).toContain("text-ai-action");
    expect(cardSrc).toContain("text-[#F87171]");
    expect(cardSrc).toContain("isPositive");
  });

  it("donut chart SVG has aria-label=\"資産の内訳\"", () => {
    expect(cardSrc).toContain('<svg');
    expect(cardSrc).toContain('aria-label="資産の内訳"');
  });
});

// ─── 14. api-usage ────────────────────────────────────────────────────────────

describe("api-usage: determinism and deltas", () => {
  it("getDailyUsage is deterministic", async () => {
    const { getDailyUsage } = await import("@/lib/api-usage");
    const a = getDailyUsage("test-handle");
    const b = getDailyUsage("test-handle");
    expect(a.jpy).toBe(b.jpy);
    expect(a.calls).toBe(b.calls);
  });

  it("getDeltas dailyPct is in range -20..40", async () => {
    const { getDeltas } = await import("@/lib/api-usage");
    const { dailyPct } = getDeltas("test-handle");
    expect(dailyPct).toBeGreaterThanOrEqual(-20);
    expect(dailyPct).toBeLessThanOrEqual(40);
  });

  it("getDeltas weeklyPct is in range -15..40", async () => {
    const { getDeltas } = await import("@/lib/api-usage");
    const { weeklyPct } = getDeltas("test-handle");
    expect(weeklyPct).toBeGreaterThanOrEqual(-15);
    expect(weeklyPct).toBeLessThanOrEqual(40);
  });
});

// ─── 15. complexity-score ─────────────────────────────────────────────────────

describe("complexity-score: range", () => {
  it("computeComplexityScore returns 0–100", async () => {
    const { computeComplexityScore } = await import("@/lib/complexity-score");
    const score = computeComplexityScore("test-handle");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── 16. asset-status ────────────────────────────────────────────────────────

describe("asset-status: boundary conditions", () => {
  it("returns 'ready' when lastCalledAt is 5 minutes ago", async () => {
    const { computeStatus } = await import("@/lib/asset-status");
    const now = Date.now();
    const asset = {
      guildId: "x", titleJa: "x", status: "active" as const,
      endpointShort: "x", monthlyJpy: 100, callsLast30: 10,
      sparkline: [], lastCalledAt: new Date(now - 5 * 60_000).toISOString(),
      postedAt: new Date().toISOString(),
    };
    expect(computeStatus(asset, now)).toBe("ready");
  });

  it("returns 'executing' when lastCalledAt is within 30 seconds", async () => {
    const { computeStatus } = await import("@/lib/asset-status");
    const now = Date.now();
    const asset = {
      guildId: "x", titleJa: "x", status: "active" as const,
      endpointShort: "x", monthlyJpy: 100, callsLast30: 10,
      sparkline: [], lastCalledAt: new Date(now - 10_000).toISOString(),
      postedAt: new Date().toISOString(),
    };
    expect(computeStatus(asset, now)).toBe("executing");
  });

  it("returns 'awaiting_update' for paused assets", async () => {
    const { computeStatus } = await import("@/lib/asset-status");
    const now = Date.now();
    const asset = {
      guildId: "x", titleJa: "x", status: "paused" as const,
      endpointShort: "x", monthlyJpy: 0, callsLast30: 0,
      sparkline: [], lastCalledAt: new Date(now - 5 * 60_000).toISOString(),
      postedAt: new Date().toISOString(),
    };
    expect(computeStatus(asset, now)).toBe("awaiting_update");
  });
});

// ─── 17. profile page ────────────────────────────────────────────────────────

describe("profile: page structure", () => {
  const profileSrc = readFileSync(resolve(root, "src/app/profile/page.tsx"), "utf8");

  it("profile page has h1 プロフィール", () => {
    expect(profileSrc).toContain("プロフィール");
  });
});

// ─── 18. guild: ステータス別 sort ─────────────────────────────────────────────

describe("guild: sort by status option", () => {
  const portfolioSrc  = readFileSync(resolve(root, "src/components/AssetPortfolio.tsx"), "utf8");

  it("AssetPortfolio has ステータス別 sort option", () => {
    expect(portfolioSrc).toContain("ステータス別");
    expect(portfolioSrc).toContain('"status"');
  });
});
