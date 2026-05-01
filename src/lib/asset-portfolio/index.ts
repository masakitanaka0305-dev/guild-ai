// GUILD AI — Owned Assets (#123)
//
// Re-projects the legacy /lib/portfolio entries into the dashboard's
// "Intelligence Asset" shape: Type / Rank / Status as the three
// primary metadata axes. Deterministic — same input → same output —
// so the dashboard renders stably across SSR snapshots.

import { getMyAssets, type PortfolioAsset } from "@/lib/portfolio";
import type { Rank } from "@/types";
import type { AssetRoleType } from "@/lib/role-colors";

export type OwnedAssetStatus = "Private (Vault)" | "Encrypted" | "Deployed";

export interface OwnedAsset {
  guildId: string;
  titleJa: string;
  /** Cross-functional roles map to "Cross-functional". */
  type: AssetRoleType;
  rank: Rank;
  status: OwnedAssetStatus;
  /** Estimated current market value in JPY. */
  valuationJpy: number;
  /** 30 % delta vs the 30-day midpoint, signed. Display-only. */
  monthlyChangePct: number;
}

// Stable mapping from the legacy portfolio entries to owned-asset types/ranks.
// The keys mirror `getMyAssets()` guildIds so the table is easy to follow.
const TYPE_BY_GUILD: Record<string, AssetRoleType> = {
  "GUILD:0001-TS01-PAT1": "Dev",
  "GUILD:0002-RS01-MEM1": "Dev",
  "GUILD:0003-LLM1-PRO1": "Cross-functional",
  "GUILD:0004-CSS1-ANI1": "Design",
  "GUILD:0005-PY01-DAT1": "Dev",
  "GUILD:0006-SQL1-OPT1": "PM",
};

const RANK_BY_GUILD: Record<string, Rank> = {
  "GUILD:0001-TS01-PAT1": "S",
  "GUILD:0002-RS01-MEM1": "A",
  "GUILD:0003-LLM1-PRO1": "S",
  "GUILD:0004-CSS1-ANI1": "B",
  "GUILD:0005-PY01-DAT1": "B",
  "GUILD:0006-SQL1-OPT1": "D",
};

function mapStatus(legacy: PortfolioAsset["status"]): OwnedAssetStatus {
  // active   → Deployed       (the agent is live)
  // reviewing → Encrypted     (sealed, awaiting human curation)
  // paused   → Private (Vault) (off-market, kept in user's vault)
  if (legacy === "active") return "Deployed";
  if (legacy === "reviewing") return "Encrypted";
  return "Private (Vault)";
}

const VALUATION_BASE: Record<Rank, number> = {
  S: 480_000,
  A: 220_000,
  B:  90_000,
  D:  18_000,
};

/** Returns the dashboard-shaped owned-asset list. Deterministic + side-effect-free. */
export function getOwnedAssets(): OwnedAsset[] {
  return getMyAssets().map((a, i) => {
    const rank = RANK_BY_GUILD[a.guildId] ?? "B";
    const type = TYPE_BY_GUILD[a.guildId] ?? "Dev";
    const status = mapStatus(a.status);
    // Stable signed delta from a small per-index offset table.
    const deltas = [+12, +8, +4, -2, -6, -1] as const;
    return {
      guildId:          a.guildId,
      titleJa:          a.titleJa,
      type,
      rank,
      status,
      valuationJpy:     VALUATION_BASE[rank],
      monthlyChangePct: deltas[i % deltas.length],
    };
  });
}

/**
 * Returns a deterministic 30-point time series in JPY for the
 * dashboard's "知能の時価推移" chart. Walks an integer step that is
 * derived from a djb2 hash of the seed so the curve looks alive but
 * never moves between renders.
 */
export function getValueTimeline(days: number = 30, seed: string = "demo-user"): number[] {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i);
    h = h >>> 0;
  }
  const total = getOwnedAssets().reduce((s, a) => s + a.valuationJpy, 0);
  const out: number[] = [];
  let v = Math.round(total * 0.92);
  for (let i = 0; i < days; i++) {
    // pseudo-random walk seeded from h+i
    const r = ((h ^ (i * 2654435761)) >>> 0) / 0xffffffff;
    const step = Math.round((r - 0.4) * total * 0.012);
    v = Math.max(0, v + step);
    out.push(v);
  }
  return out;
}

/** Sums the current valuation across owned assets. */
export function getTotalValuationJpy(): number {
  return getOwnedAssets().reduce((s, a) => s + a.valuationJpy, 0);
}
