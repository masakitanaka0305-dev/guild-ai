// GUILD AI — Intelligence Balance
//
// Predicts a monthly royalty range from rank + density signals + category.
// All values are deterministic and labeled "シミュレーション" — they
// surface on /profile under the "予測印税" prime number.

import type { Rank } from "@/types";

export interface BalanceInput {
  rank: Rank;
  /** 0..100 — same scale as the grading density pillar. */
  density: number;
  /** Free-form category tag, e.g. "infra-go" or "ml-pipeline". */
  category?: string;
}

export interface RoyaltyPrediction {
  /** Central JPY estimate (rounded to ¥100). */
  perMonthJpy: number;
  /** Lower bound — "保守 ¥X". */
  conservativeJpy: number;
  /** Upper bound — "楽観 ¥Y". */
  optimisticJpy: number;
}

const RANK_BASE_JPY: Record<Rank, number> = {
  S: 80_000,
  A: 32_000,
  B: 12_000,
  D:  3_000,
};

const CATEGORY_MULT: Record<string, number> = {
  "infra-go":     1.10,
  "ml-pipeline":  1.20,
  "rag-design":   1.25,
  "agent-arch":   1.15,
  "feature-store":1.10,
  "compliance":   0.95,
  "react-native": 0.90,
};

function round100(n: number): number {
  return Math.round(n / 100) * 100;
}

/**
 * Returns the predicted monthly royalty range for an MD with the given
 * rank + density + category. Conservative is 0.6× central, optimistic
 * is 1.5× central.
 */
export function predictRoyalty(input: BalanceInput): RoyaltyPrediction {
  const base = RANK_BASE_JPY[input.rank];
  // Density nudges the central estimate by ±25% over the 0..100 range
  const densityFactor = 0.75 + (Math.max(0, Math.min(100, input.density)) / 100) * 0.5;
  const categoryFactor = input.category ? (CATEGORY_MULT[input.category] ?? 1) : 1;
  const central = base * densityFactor * categoryFactor;
  return {
    perMonthJpy:    round100(central),
    conservativeJpy: round100(central * 0.6),
    optimisticJpy:   round100(central * 1.5),
  };
}

/**
 * Aggregates royalty predictions across a portfolio. Returns the
 * summed central / conservative / optimistic JPY so the profile
 * "Intelligence Balance" surface can show a single range.
 */
export function aggregateRoyalty(items: readonly BalanceInput[]): RoyaltyPrediction {
  let perMonth = 0;
  let conservative = 0;
  let optimistic = 0;
  for (const it of items) {
    const r = predictRoyalty(it);
    perMonth     += r.perMonthJpy;
    conservative += r.conservativeJpy;
    optimistic   += r.optimisticJpy;
  }
  return {
    perMonthJpy: round100(perMonth),
    conservativeJpy: round100(conservative),
    optimisticJpy: round100(optimistic),
  };
}
