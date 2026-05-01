// GUILD AI — Rank rarity (#130).
//
// Deterministic mock of the per-rank share of recent Mints. The numbers
// are anchored to a fixed past window so the UI never claims forecasted
// or extrapolated values. Each rank gets a friendly caption that ships
// alongside Cinematic Mint Phase 4.

import type { Rank } from "@/types";

export interface RankRarity {
  rank: Rank;
  /** Last-100 sample share, 0..100 (integer percent). */
  recentSharePercent: number;
  /** Friendly user-facing caption — never references the raw %. */
  caption: string;
  /** Number of bonus particles painted around the reveal hex. */
  particleCount: number;
}

/**
 * Stable rarity table — sums to 100. Reflects a fictional but plausible
 * distribution: more Mints land at B than at S, exactly as you'd expect
 * from a market that gates the gold tier behind context-depth + uptime.
 */
export const RANK_RARITY: Record<Rank, RankRarity> = {
  S: {
    rank: "S",
    recentSharePercent: 8,
    caption: "この太鼓判は希少です（直近 100 件で 8%）",
    particleCount: 6,
  },
  A: {
    rank: "A",
    recentSharePercent: 22,
    caption: "確かな実力です（直近 100 件で 22%）",
    particleCount: 2,
  },
  B: {
    rank: "B",
    recentSharePercent: 41,
    caption: "着実な一歩です（直近 100 件で 41%）",
    particleCount: 0,
  },
  D: {
    rank: "D",
    recentSharePercent: 29,
    caption: "次は太鼓判を狙いましょう",
    particleCount: 0,
  },
};

export function getRarity(rank: Rank): RankRarity {
  return RANK_RARITY[rank];
}

/**
 * Sanity check helper for tests + docs. Re-runs at import time? No — it's
 * a function so the cost is opt-in.
 */
export function rarityShareTotal(): number {
  return Object.values(RANK_RARITY).reduce((s, r) => s + r.recentSharePercent, 0);
}
