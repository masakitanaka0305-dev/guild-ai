// GUILD AI — Express Path (3-Minute Path)
// 7-step flow from Connect → First Royalty → Confirmed.
// Total simulated duration < 180s for all seeds.

import type { Rank } from "@/types";

export type ExpressStepId =
  | "connect"
  | "select-repo"
  | "analyze"
  | "validate"
  | "publish"
  | "first-royalty"
  | "confirmed";

export interface ExpressStep {
  id: ExpressStepId;
  label: string;
  description: string;
  durationMs: number;
}

export const EXPRESS_STEPS: ExpressStep[] = [
  {
    id: "connect",
    label: "GitHub 接続",
    description: "GitHub アカウントを認証します",
    durationMs: 800,
  },
  {
    id: "select-repo",
    label: "リポジトリ選択",
    description: "公開する MD リポジトリを選択します",
    durationMs: 500,
  },
  {
    id: "analyze",
    label: "AI コンテンツ解析",
    description: "ナレッジ資産を抽出・分類します",
    durationMs: 3200,
  },
  {
    id: "validate",
    label: "Validation Score 確定",
    description: "S/A/B ランクと品質スコアを確定します",
    durationMs: 2100,
  },
  {
    id: "publish",
    label: "Asset Ledger 登記・公開",
    description: "エンドポイント発行 → Marketplace 掲載",
    durationMs: 1400,
  },
  {
    id: "first-royalty",
    label: "First Royalty 待機中",
    description: "AtoA 取引の初回発火を待っています（30〜60 秒）",
    durationMs: 40_000,
  },
  {
    id: "confirmed",
    label: "3 分以内に利益確定",
    description: "初回印税が通帳に記録されました",
    durationMs: 800,
  },
];

export const BUDGET_MS = 180_000; // 3 minutes

export const TOTAL_DURATION_MS = EXPRESS_STEPS.reduce((s, st) => s + st.durationMs, 0);

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

export interface ExpressTimelineStep {
  id: ExpressStepId;
  label: string;
  seconds: number;
}

export interface ExpressTimeline {
  steps: ExpressTimelineStep[];
  totalSeconds: number;
}

export function simulateExpressTimeline(seed: string): ExpressTimeline {
  const hash = djb2(seed);
  // First Royalty fires between 30-60s (deterministic per seed)
  const royaltyMs = 30_000 + (hash % 30_001); // 30000–60000 ms

  const steps: ExpressTimelineStep[] = EXPRESS_STEPS.map((step) => {
    const durationMs = step.id === "first-royalty" ? royaltyMs : step.durationMs;
    return {
      id: step.id,
      label: step.label,
      seconds: Math.round(durationMs / 1000),
    };
  });

  const totalSeconds = steps.reduce((s, st) => s + st.seconds, 0);
  return { steps, totalSeconds };
}

// First Royalty amount per rank (deterministic mock)
export const FIRST_ROYALTY_JPY: Record<"S" | "A" | "B", number> = {
  S: 420,
  A: 180,
  B: 60,
};

export function getFirstRoyaltyJpy(rank: Rank): number {
  if (rank === "S") return FIRST_ROYALTY_JPY.S;
  if (rank === "A") return FIRST_ROYALTY_JPY.A;
  return FIRST_ROYALTY_JPY.B;
}
