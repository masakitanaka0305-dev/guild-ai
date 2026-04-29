// Pro Search: enterprise problem-first search, combines backtest + marketplace data

import { MOCK_MARKETPLACE } from "@/lib/marketplace";
import type { MarketplaceListing as MarketplaceItem } from "@/types";
import { getBacktestStats } from "@/lib/backtest";
import { mintGuildIdForAsset } from "@/lib/guild-id";

export type CategoryFilter = "DataOps" | "LLMOps" | "RPA" | "営業AI" | "all";
export type AccuracyFilter = ">90%" | ">95%" | ">99%" | "all";
export type VolumeFilter = "〜10K" | "〜100K" | "100K+" | "all";
export type SlaFilter = "99.5%" | "99.9%" | "99.99%" | "all";
export type TierFilter = "Hobby" | "Pro Indie" | "Enterprise" | "all";
export type SortBy = "accuracy" | "latency" | "cost";

export interface ProSearchFilters {
  category: CategoryFilter;
  accuracy: AccuracyFilter;
  volume: VolumeFilter;
  sla: SlaFilter;
  tier: TierFilter;
}

export interface ProSearchResult {
  assetId: string;
  guildId: string;
  title: string;
  description: string;
  rank: "S" | "A" | "B";
  accuracyPct: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  recommendedTier: "Hobby" | "Pro Indie" | "Enterprise";
  floorPrice: number;
  trustScore: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

const CATEGORIES: CategoryFilter[] = ["DataOps", "LLMOps", "RPA", "営業AI"];

function inferCategory(item: MarketplaceItem): CategoryFilter {
  const seed = djb2(item.listing.id + "cat");
  return CATEGORIES[seed % CATEGORIES.length];
}

function inferTier(floorPrice: number): "Hobby" | "Pro Indie" | "Enterprise" {
  if (floorPrice === 0) return "Hobby";
  if (floorPrice < 5000) return "Pro Indie";
  return "Enterprise";
}

function minAccuracy(f: AccuracyFilter): number {
  if (f === ">99%") return 99;
  if (f === ">95%") return 95;
  if (f === ">90%") return 90;
  return 0;
}

function scoreItem(
  item: MarketplaceItem,
  stats: ReturnType<typeof getBacktestStats>,
  query: string,
): number {
  const queryLower = query.toLowerCase();
  const titleMatch = item.listing.title.toLowerCase().includes(queryLower) ? 20 : 0;
  const descMatch = item.listing.description.toLowerCase().includes(queryLower) ? 10 : 0;
  const rankBonus = item.listing.rank === "S" ? 15 : item.listing.rank === "A" ? 8 : 0;
  const accuracyBonus = (stats.accuracyPct - 80) * 2;
  const latencyPenalty = Math.max(0, (stats.avgLatencyMs - 200) / 20);
  const trustBonus = item.trustScore.score / 100;
  return titleMatch + descMatch + rankBonus + accuracyBonus - latencyPenalty + trustBonus;
}

// ─── Core search ──────────────────────────────────────────────────────────────

export function proSearch(
  query: string,
  filters: Partial<ProSearchFilters> = {},
  sortBy: SortBy = "accuracy",
  limit = 5,
): ProSearchResult[] {
  const {
    category = "all",
    accuracy = "all",
    sla = "all",
    tier = "all",
  } = filters;

  const minAcc = minAccuracy(accuracy);

  const scored = MOCK_MARKETPLACE
    .map((item) => {
      const stats = getBacktestStats(item.listing.id);
      const itemTier = inferTier(item.listing.floorPrice);
      const itemCat = inferCategory(item);

      // Filters
      if (category !== "all" && itemCat !== category) return null;
      if (accuracy !== "all" && stats.accuracyPct < minAcc) return null;
      if (tier !== "all" && itemTier !== tier) return null;
      // SLA filter — mock: 99.9 if rank S, 99.5 if A, 99.5 if B
      if (sla === "99.99%" && item.listing.rank !== "S") return null;
      if (sla === "99.9%" && item.listing.rank === "B") return null;

      const score = scoreItem(item, stats, query);
      const guildId = mintGuildIdForAsset(item.listing.id);
      return {
        score,
        result: {
          assetId: item.listing.id,
          guildId,
          title: item.listing.title,
          description: item.listing.description,
          rank: item.listing.rank as "S" | "A" | "B",
          accuracyPct: stats.accuracyPct,
          avgLatencyMs: stats.avgLatencyMs,
          p95LatencyMs: stats.p95LatencyMs,
          recommendedTier: itemTier,
          floorPrice: item.listing.floorPrice,
          trustScore: item.trustScore.score,
        } satisfies ProSearchResult,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Sort
  scored.sort((a, b) => {
    if (sortBy === "accuracy") return b.result.accuracyPct - a.result.accuracyPct;
    if (sortBy === "latency")  return a.result.avgLatencyMs - b.result.avgLatencyMs;
    if (sortBy === "cost")     return a.result.floorPrice - b.result.floorPrice;
    return b.score - a.score;
  });

  return scored.slice(0, limit).map((s) => s.result);
}

// ─── Default filters ──────────────────────────────────────────────────────────

export const DEFAULT_FILTERS: ProSearchFilters = {
  category: "all",
  accuracy: "all",
  volume: "all",
  sla: "all",
  tier: "all",
};
