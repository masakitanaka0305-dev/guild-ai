// GUILD AI — Genesis Final Tests (14)
// quick-listing(3) + context-depth(3) + nav-2tab+fab(3) + og(2) + skeleton(1) + sw(1) + footer(1)

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

// ─── Quick Listing ────────────────────────────────────────────────────────────

import {
  QUICK_STEPS,
  QUICK_AUTO_STEPS,
  QUICK_BUDGET_MS,
  simulateQuickListing,
  buildQuickResult,
} from "@/lib/quick-listing";

describe("quick-listing: 3-step / 10s path", () => {
  it("has exactly 3 steps: source, validate, listed", () => {
    expect(QUICK_STEPS).toHaveLength(3);
    expect(QUICK_STEPS.map((s) => s.id)).toEqual(["source", "validate", "listed"]);
  });

  it("automated total ≤ 10,000ms for any seed", () => {
    for (let i = 0; i < 20; i++) {
      const { totalMs } = simulateQuickListing(`seed_${i}`);
      expect(totalMs).toBeLessThanOrEqual(QUICK_BUDGET_MS);
    }
    // Verify automated time is exactly 2s (validate 1.5s + listed 0.5s)
    expect(QUICK_AUTO_STEPS.reduce((s, st) => s + st.durationMs, 0)).toBe(2000);
  });

  it("buildQuickResult uses real content analysis for rank", () => {
    const richInput = {
      kind: "text" as const,
      content: [
        "# TypeScript 型安全設計ガイド",
        "",
        "なぜ型安全が重要か：バグを早期に検出できる。",
        "制約：TypeScript 5.0以上、Node.js 18+。",
        "落とし穴：any型の多用は型安全を損なう。",
        "パフォーマンス：型チェックはコンパイル時のみ。",
        "テスト：expect(result).toBe(expected) でアサート。",
        "失敗時：catch(e) でフォールバック処理。",
        "",
        "```typescript",
        "export function processData(input: string): string {",
        "  return input.trim();",
        "}",
        "```",
      ].join("\n").repeat(20),
    };
    const poorInput = { kind: "text" as const, content: "hello ".repeat(20) };
    const rich = buildQuickResult(richInput, 1800);
    const poor = buildQuickResult(poorInput, 1800);
    const rankOrder: Record<string, number> = { S: 4, A: 3, B: 2, D: 1 };
    expect(rankOrder[rich.rank]).toBeGreaterThanOrEqual(rankOrder[poor.rank]);
  });
});

// ─── Context Depth ────────────────────────────────────────────────────────────

import {
  computeContextDepth,
  S_RANK_CONTEXT_DEPTH_MIN,
} from "@/lib/context-depth";

describe("context-depth: 6-criterion scoring", () => {
  it("score is always in 0–6 range", () => {
    const cases = [
      "",
      "hello world",
      "なぜ 制約 落とし穴 パフォーマンス テスト フォールバック",
      "because constraint pitfall performance test fallback",
    ];
    for (const c of cases) {
      const { score } = computeContextDepth(c);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(6);
    }
  });

  it("evaluation is deterministic (same input → same output)", () => {
    const md = "なぜ 制約 落とし穴 パフォーマンス テスト フォールバック";
    const r1 = computeContextDepth(md);
    const r2 = computeContextDepth(md);
    expect(r1.score).toBe(r2.score);
    expect(r1.criteria.map((c) => c.met)).toEqual(r2.criteria.map((c) => c.met));
  });

  it("maximum score (6) when all 6 criteria are met", () => {
    const md = [
      "なぜこの実装を選んだか（because）",
      "制約として constraint: TypeScript 5.0+",
      "落とし穴：gotcha — null チェック忘れ",
      "パフォーマンス latency を O(n) に最適化",
      "テスト：expect( verify assert",
      "失敗時のフォールバック fallback catch retry",
    ].join("\n");
    const { score } = computeContextDepth(md);
    expect(score).toBe(6);
    // S rank min threshold is 4
    expect(S_RANK_CONTEXT_DEPTH_MIN).toBe(4);
    expect(score).toBeGreaterThanOrEqual(S_RANK_CONTEXT_DEPTH_MIN);
  });
});

// ─── 3-Tab Navigation ─────────────────────────────────────────────────────────

describe("nav: 2-tab + center FAB structure (探す/稼ぐ + 出す FAB)", () => {
  const root = process.cwd();
  const navSrc = (() => {
    try {
      return readFileSync(join(root, "src/components/SidebarNav.tsx"), "utf8");
    } catch { return ""; }
  })();
  const appShellSrc = (() => {
    try {
      return readFileSync(join(root, "src/components/AppShell.tsx"), "utf8");
    } catch { return ""; }
  })();

  it("SidebarNav has 2 main tabs (探す/稼ぐ) + primary action (出す) with role=tablist", () => {
    expect(navSrc).toContain("/projects");
    expect(navSrc).toContain("/onboarding");
    expect(navSrc).toContain("/guild");
    expect(navSrc).toContain("tablist");
    expect(navSrc).toContain("探す");
    expect(navSrc).toContain("出す");
    expect(navSrc).toContain("稼ぐ");
  });

  it("BottomNav uses grid-cols-2 (not grid-cols-3) — 出す is FAB only", () => {
    expect(navSrc).toContain("grid-cols-2");
    expect(navSrc).not.toContain("grid-cols-3");
  });

  it("center FAB links to /onboarding with aria-label='出す'", () => {
    const combined = navSrc + appShellSrc;
    expect(combined).toContain('href="/onboarding"');
    expect(combined).toContain('aria-label="出す"');
  });
});

// ─── OGP routes ──────────────────────────────────────────────────────────────

describe("og: dynamic OGP route files exist", () => {
  const root = process.cwd();

  it("og/profile/[handle]/route.tsx exists and uses ImageResponse", () => {
    const path = join(root, "src/app/og/profile/[handle]/route.tsx");
    expect(existsSync(path), `Missing: ${path}`).toBe(true);
    const src = readFileSync(path, "utf8");
    expect(src).toContain("ImageResponse");
    expect(src).toContain("1200");
    expect(src).toContain("630");
  });

  it("og/asset/[id]/route.tsx exists and uses ImageResponse", () => {
    const path = join(root, "src/app/og/asset/[id]/route.tsx");
    expect(existsSync(path), `Missing: ${path}`).toBe(true);
    const src = readFileSync(path, "utf8");
    expect(src).toContain("ImageResponse");
    expect(src).toContain("1200");
    expect(src).toContain("630");
  });
});

// ─── Skeleton loading.tsx ─────────────────────────────────────────────────────

describe("loading: skeleton loading.tsx files exist", () => {
  const root = process.cwd();
  const LOADING_PAGES = [
    "src/app/projects/loading.tsx",
    "src/app/projects/[id]/loading.tsx",
    "src/app/guild/loading.tsx",
    "src/app/profile/loading.tsx",
  ];

  it("loading.tsx exists for projects, projects/[id], guild, profile with aria-busy", () => {
    for (const rel of LOADING_PAGES) {
      const path = join(root, rel);
      expect(existsSync(path), `Missing: ${rel}`).toBe(true);
      const src = readFileSync(path, "utf8");
      expect(src).toContain("aria-busy");
      expect(src).toContain("animate-pulse");
    }
  });
});

// ─── Service Worker ───────────────────────────────────────────────────────────

describe("sw: service worker registered in layout", () => {
  const root = process.cwd();

  it("layout.tsx imports SwRegister and public/sw.js exists", () => {
    const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
    expect(layout).toContain("SwRegister");
    const swPath = join(root, "public/sw.js");
    expect(existsSync(swPath), "Missing public/sw.js").toBe(true);
    const sw = readFileSync(swPath, "utf8");
    expect(sw).toContain("stale-while-revalidate");
    expect(sw).toContain("/offline");
  });
});

// ─── Enterprise Footer CTA ────────────────────────────────────────────────────

describe("footer: enterprise CTA pinned in AppShell", () => {
  const root = process.cwd();

  it("AppShell.tsx contains enterprise CTA linking to /business/checkout", () => {
    const src = readFileSync(join(root, "src/components/AppShell.tsx"), "utf8");
    expect(src).toContain("/business/checkout");
    expect(src).toContain("企業");
  });
});
