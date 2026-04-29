import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../../..");

// ─── 1. Catchphrase in hero ───────────────────────────────────────────────────

describe("catchphrase: hero", () => {
  const src = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");

  it("main catchphrase appears in h1 on home page", () => {
    expect(src).toContain("AIエージェントで、");
    expect(src).toContain("あなたの時間");
    expect(src).toContain("アップデート");
    expect(src).toMatch(/<h1/);
  });

  it("subline 日本最大のAIエージェント・プラットフォーム appears below h1", () => {
    expect(src).toContain("日本最大のAIエージェント・プラットフォーム");
  });

  it("footer exists", () => {
    expect(src).toMatch(/<footer/);
  });
});

// ─── 1b. Minimal home sections ───────────────────────────────────────────────

describe("catchphrase: minimal home", () => {
  const src = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");

  it("unified how-tiles (ノートを投稿 / AIが自動で稼働 / 報酬が入る) exist", () => {
    expect(src).toContain('"ノートを投稿"');
    expect(src).toContain('"AIが自動で稼働"');
    expect(src).toContain('"報酬が入る"');
  });

  it("how-tile emojis have role=img and aria-label", () => {
    expect(src).toContain('role="img"');
    expect(src).toContain('aria-label');
  });

  it("section heading いま のこされた しごと exists", () => {
    expect(src).toContain("いま のこされた しごと");
  });

  it("section heading かせげる しごと exists", () => {
    expect(src).toContain("かせげる しごと");
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

  it("home subline 日本最大のAIエージェント・プラットフォーム is displayed", () => {
    const pageSrc = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
    expect(pageSrc).toContain("日本最大のAIエージェント・プラットフォーム");
  });
});

// ─── 3. Primary red #E64545 in globals.css ────────────────────────────────────

describe("mercari-ui: primary color token", () => {
  const src = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

  it("--n-primary is #E64545", () => {
    expect(src).toContain("--n-primary: #E64545");
  });

  it("--n-primary-hover is #D03A3A", () => {
    expect(src).toContain("--n-primary-hover: #D03A3A");
  });
});

// ─── 4. BottomNav has 4 tabs ─────────────────────────────────────────────────

describe("mercari-ui: bottom tabs", () => {
  const src = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");

  it("BOTTOM_ITEMS has exactly 4 entries", () => {
    expect(src).toContain('"ホーム"');
    expect(src).toContain('"投稿"');
    expect(src).toContain('"案件"');
    expect(src).toContain('"運用"');
  });

  it("BottomNav exports correct component", () => {
    expect(src).toContain("export function BottomNav");
  });
});

// ─── 5. FAB href=/bank aria-label="のこす" ───────────────────────────────────

describe("mercari-ui: FAB", () => {
  const src = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");

  it('FAB links to /bank', () => {
    expect(src).toContain('href="/bank"');
  });

  it('FAB has aria-label="投稿"', () => {
    expect(src).toContain('aria-label="投稿"');
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
    expect(src).toContain("border-[#E64545]");
    expect(src).toContain("bg-red-50");
  });

  it("submit button is disabled when content is short", () => {
    expect(src).toContain("noteContent.trim().length < 10");
    expect(src).toContain("disabled");
  });
});

// ─── 8. Unified how-block + price hint ───────────────────────────────────────

describe("home: unified how-block", () => {
  const src = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");

  it("home has heading 使い方は3ステップ", () => {
    expect(src).toContain("使い方は3ステップ");
  });

  it("3 cards link to /sell /jobs /guild", () => {
    expect(src).toContain('"/sell"');
    expect(src).toContain('"/jobs"');
    expect(src).toContain('"/guild"');
  });

  it("hero has single primary CTA 投稿する", () => {
    expect(src).toContain("投稿する");
  });

  it("hero has no price chip (いますぐ ¥30,000 から removed)", () => {
    expect(src).not.toContain("いますぐ ¥30,000 から");
  });

  it("h1 has 3 block spans for forced 3-line layout on mobile", () => {
    const h1Match = src.match(/<h1[\s\S]*?<\/h1>/);
    expect(h1Match).not.toBeNull();
    const h1 = h1Match![0];
    const spanBlocks = (h1.match(/className="block/g) ?? []).length;
    expect(spanBlocks).toBeGreaterThanOrEqual(3);
  });

  it("hero h1 uses tightened mobile font size text-[28px] and leading-[1.2]", () => {
    const h1Match = src.match(/<h1[^>]*>/);
    expect(h1Match).not.toBeNull();
    expect(h1Match![0]).toContain("text-[28px]");
    expect(h1Match![0]).toContain("leading-[1.2]");
  });
});

// ─── 9. Onboarding banner + modal ────────────────────────────────────────────

describe("onboarding: banner and modal", () => {
  const pageSrc   = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
  const modalSrc  = readFileSync(resolve(root, "src/components/OnboardingModal.tsx"), "utf8");

  it('home page has banner with aria-label="初めてのギルドエーアイ講座"', () => {
    expect(pageSrc).toContain('aria-label="初めてのギルドエーアイ講座"');
  });

  it("banner click opens OnboardingModal (source imports and renders it)", () => {
    expect(pageSrc).toContain("OnboardingModal");
    expect(pageSrc).toContain("modalOpen");
    expect(modalSrc).toContain('role="dialog"');
  });

  it("modal contains 4 steps in <ol>", () => {
    expect(modalSrc).toMatch(/<ol/);
    expect(modalSrc).toContain("ノートを投稿する");
    expect(modalSrc).toContain("AIが自動で稼働");
    expect(modalSrc).toContain("報酬が入る");
    expect(modalSrc).toContain("運用で確認");
  });

  it('modal CTA links to /sell', () => {
    expect(modalSrc).toContain('今すぐ投稿する');
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

  it("onboarding banner uses light sky gradient (not gold)", () => {
    expect(pageSrc).toContain("from-[#E0F2FE]");
    expect(pageSrc).not.toContain("#F2DFA0");
    expect(pageSrc).not.toContain("#F5E8B0");
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

  it("/guild page has hero explainer block for 運用", () => {
    expect(guildSrc).toContain("運用：あなたが");
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

  it("bottom nav labels are ホーム/投稿/案件/運用", () => {
    expect(navSrc).toContain('"投稿"');
    expect(navSrc).toContain('"案件"');
    expect(navSrc).toContain('"運用"');
    expect(navSrc).toContain('"ホーム"');
  });

  it("hero CTA label is 投稿する", () => {
    expect(homeSrc).toContain("投稿する");
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

  it("BOTTOM_ITEMS final tab is 運用", () => {
    const m = navSrc.match(/BOTTOM_ITEMS\s*=\s*\[([\s\S]*?)\];/);
    expect(m).not.toBeNull();
    expect(m![1]).toContain('"運用"');
    expect(m![1]).not.toContain('"マイ銀行"');
  });

  it("/guild hero heading contains 運用", () => {
    expect(guildSrc).toContain("運用：あなたが投稿したMDファイル");
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

  it("monthlyChangePct positive → green class, negative → red class in source", () => {
    expect(cardSrc).toContain("text-[#0E9F4F]");
    expect(cardSrc).toContain("text-[#E64545]");
    expect(cardSrc).toContain("isPositive");
  });

  it("donut chart SVG has aria-label=\"資産の内訳\"", () => {
    expect(cardSrc).toContain('<svg');
    expect(cardSrc).toContain('aria-label="資産の内訳"');
  });
});
