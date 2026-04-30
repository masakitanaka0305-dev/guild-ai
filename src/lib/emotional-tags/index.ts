// Deterministic emotional benefit tags for GUILD AI assets.
// Maps asset data to human-readable benefit tags instead of tech jargon.

import type { MarketplaceListing } from "@/types";

const EMOTIONAL_TAGS_BY_RANK = {
  S: ["神UI", "魔法レベル", "爆速化", "自動化のプロ", "面倒ゼロ", "気が利く", "縁の下", "ぐっすり眠る"],
  A: ["爆速化", "自動化のプロ", "気が利く", "縁の下", "速攻仕事", "面倒ゼロ", "ぐっすり眠る"],
  B: ["速攻仕事", "縁の下", "ぐっすり眠る", "気が利く", "安心感"],
  D: ["改善中"],
} as const;

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function mapToEmotionalTags(asset: MarketplaceListing): string[] {
  const pool = EMOTIONAL_TAGS_BY_RANK[asset.listing.rank];
  const seed = djb2(asset.listing.id + asset.listing.rank);
  // Pick up to 3 distinct tags deterministically
  const indices = new Set<number>();
  let k = seed;
  while (indices.size < 3) {
    indices.add(k % pool.length);
    k = djb2(k.toString());
  }
  return Array.from(indices).map((i) => pool[i]);
}

export { EMOTIONAL_TAGS_BY_RANK };
