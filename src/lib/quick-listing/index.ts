// GUILD AI — Quick Listing (3-Step / 10-Second Path)
// source(user) → validate(1.5s) → listed(0.5s)
// Total automated: 2s. Full flow with user input: 8–10s typical.

import type { Rank } from "@/types";
import { analyzeContent, type ExpressInput, type ContentAnalysis } from "@/lib/express-path";

export type QuickStepId = "source" | "validate" | "listed";

export interface QuickStep {
  id: QuickStepId;
  label: string;
  description: string;
  durationMs: number; // 0 = user-driven
}

export const QUICK_STEPS: QuickStep[] = [
  {
    id: "source",
    label: "コンテンツ投入",
    description: "URL・ファイル・テキストで MD コンテンツを渡します",
    durationMs: 0,
  },
  {
    id: "validate",
    label: "AI 鑑定",
    description: "ランク・スコアを 1.5 秒で確定します",
    durationMs: 1500,
  },
  {
    id: "listed",
    label: "出品完了",
    description: "Asset Ledger 登記・エンドポイント発行",
    durationMs: 500,
  },
];

export const QUICK_BUDGET_MS = 10_000; // 10 seconds

export const QUICK_AUTO_STEPS = QUICK_STEPS.filter((s) => s.id !== "source");

// Total automated time (excluding user source step)
export const QUICK_TOTAL_MS = QUICK_AUTO_STEPS.reduce(
  (sum, s) => sum + s.durationMs,
  0,
); // = 2000ms

// ─── Quick analysis wrapper ───────────────────────────────────────────────────

export interface QuickResult {
  rank: Rank;
  validationScore: number;
  title: string;
  endpointSlug: string;
  elapsedMs: number;
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

export function buildQuickResult(
  input: ExpressInput,
  elapsedMs: number,
): QuickResult {
  const analysis: ContentAnalysis = analyzeContent(input);
  const slug = `asset_${djb2(analysis.hash).toString(16).slice(0, 8)}`;
  return {
    rank: analysis.rank,
    validationScore: analysis.validationScore,
    title: analysis.title,
    endpointSlug: slug,
    elapsedMs,
  };
}

// ─── Simulation for tests ─────────────────────────────────────────────────────

export function simulateQuickListing(seed: string): {
  totalMs: number;
  steps: { id: QuickStepId; ms: number }[];
} {
  const steps = QUICK_AUTO_STEPS.map((s) => ({
    id: s.id,
    ms: s.durationMs,
  }));
  const totalMs = steps.reduce((sum, s) => sum + s.ms, 0);
  return { totalMs, steps };
}
