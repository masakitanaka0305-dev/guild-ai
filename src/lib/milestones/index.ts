// GUILD AI — Next-milestone forecasting (#130).
//
// Surfaces the *single* most rewarding milestone the user is closest to.
// All 4 kinds anchor to facts already in the user's history snapshot;
// "next" never extrapolates. Pure / deterministic.

import type { UserHistory } from "@/lib/achievements";

export type MilestoneKind =
  | "cumulative-royalty" // 累計お礼 → ¥1k / ¥10k / ¥100k / ¥1M
  | "streak-days"        // 連続印税日数 → 3 / 7 / 14 / 30
  | "total-calls"        // 累計コール → 1k / 10k / 100k
  | "distinct-mds";      // 登記済み MD → 5 / 10 / 30 / 100

export interface Milestone {
  kind: MilestoneKind;
  /** Plain-language label shown above the progress bar. */
  label: string;
  currentValue: number;
  targetValue: number;
  /** 0..1 fraction (capped at 1). */
  progressPercent: number;
  /** Plain-language preview of what unlocks at the target. */
  rewardLabel: string;
  /** Achievement badge id that ships when the target is hit. */
  rewardBadgeId: string;
  /** "あと N で 達成" copy fragment, ready to drop into the UI. */
  remainingCopy: string;
}

const ROYALTY_TIERS = [
  { target: 1_000,    badge: "yen-10k-milestone", label: "累計 ¥1,000 達成" },
  { target: 10_000,   badge: "yen-10k-milestone", label: "累計 ¥10,000 達成" },
  { target: 100_000,  badge: "yen-10k-milestone", label: "累計 ¥100,000 達成" },
  { target: 1_000_000,badge: "yen-10k-milestone", label: "累計 ¥1,000,000 達成" },
] as const;

const STREAK_TIERS = [
  { target: 3,  badge: "royalty-streak-3",  label: "連続 3 日達成" },
  { target: 7,  badge: "royalty-streak-7",  label: "連続 7 日達成" },
  { target: 14, badge: "royalty-streak-7",  label: "連続 14 日達成" },
  { target: 30, badge: "royalty-streak-30", label: "連続 30 日達成" },
] as const;

const CALLS_TIERS = [
  { target: 1_000,   badge: "calls-veteran-1k",   label: "累計 1,000 コール" },
  { target: 10_000,  badge: "calls-veteran-1k",   label: "累計 10,000 コール" },
  { target: 100_000, badge: "calls-legend-100k",  label: "累計 100,000 コール" },
] as const;

const MD_TIERS = [
  { target: 5,   badge: "first-mint",            label: "登記 5 件達成" },
  { target: 10,  badge: "mint-veteran",          label: "登記 10 件達成" },
  { target: 30,  badge: "knowledge-cartographer",label: "登記 30 件達成" },
  { target: 100, badge: "mint-master",           label: "登記 100 件達成" },
] as const;

function pickNext<T extends { target: number }>(value: number, tiers: readonly T[]): T | null {
  for (const t of tiers) {
    if (value < t.target) return t;
  }
  return null;
}

function buildMilestone(
  kind: MilestoneKind,
  current: number,
  tier: { target: number; badge: string; label: string },
  copyKind: "yen" | "days" | "calls" | "mds",
): Milestone {
  const remaining = Math.max(0, tier.target - current);
  const remainingCopy =
    copyKind === "yen"
      ? `あと ¥${remaining.toLocaleString("ja-JP")} で ${tier.label}`
      : copyKind === "days"
      ? `あと ${remaining} 日 で ${tier.label}`
      : copyKind === "calls"
      ? `あと ${remaining.toLocaleString("ja-JP")} 回 で ${tier.label}`
      : `あと ${remaining} 件 で ${tier.label}`;
  return {
    kind,
    label: tier.label,
    currentValue: current,
    targetValue: tier.target,
    progressPercent: Math.min(1, current / tier.target),
    rewardLabel: tier.label,
    rewardBadgeId: tier.badge,
    remainingCopy,
  };
}

/**
 * Computes the *single* milestone with the highest progress percent.
 * Ties broken by milestone-kind order (cumulative-royalty wins) so SSR
 * + tests stay deterministic.
 */
export function getNextMilestone(history: UserHistory): Milestone | null {
  const candidates: Milestone[] = [];
  const royaltyTier = pickNext(history.royaltyTotalJpy, ROYALTY_TIERS);
  if (royaltyTier) candidates.push(buildMilestone("cumulative-royalty", history.royaltyTotalJpy, royaltyTier, "yen"));
  const streakTier = pickNext(history.royaltyStreakDays, STREAK_TIERS);
  if (streakTier) candidates.push(buildMilestone("streak-days", history.royaltyStreakDays, streakTier, "days"));
  const callsTier = pickNext(history.callsTotal, CALLS_TIERS);
  if (callsTier) candidates.push(buildMilestone("total-calls", history.callsTotal, callsTier, "calls"));
  const mdTier = pickNext(history.distinctMds, MD_TIERS);
  if (mdTier) candidates.push(buildMilestone("distinct-mds", history.distinctMds, mdTier, "mds"));
  if (candidates.length === 0) return null;

  // Pick the one with the highest progress; ties → first-listed kind.
  const order: Record<MilestoneKind, number> = {
    "cumulative-royalty": 0,
    "streak-days": 1,
    "total-calls": 2,
    "distinct-mds": 3,
  };
  candidates.sort((a, b) => {
    if (b.progressPercent !== a.progressPercent) return b.progressPercent - a.progressPercent;
    return order[a.kind] - order[b.kind];
  });
  return candidates[0];
}

/**
 * Returns one milestone per kind so the UI can show a small ladder
 * (e.g. /profile or a debug panel). Filtered by `pickNext`.
 */
export function getAllNextMilestones(history: UserHistory): Milestone[] {
  const out: Milestone[] = [];
  const r = pickNext(history.royaltyTotalJpy, ROYALTY_TIERS);
  if (r) out.push(buildMilestone("cumulative-royalty", history.royaltyTotalJpy, r, "yen"));
  const s = pickNext(history.royaltyStreakDays, STREAK_TIERS);
  if (s) out.push(buildMilestone("streak-days", history.royaltyStreakDays, s, "days"));
  const c = pickNext(history.callsTotal, CALLS_TIERS);
  if (c) out.push(buildMilestone("total-calls", history.callsTotal, c, "calls"));
  const m = pickNext(history.distinctMds, MD_TIERS);
  if (m) out.push(buildMilestone("distinct-mds", history.distinctMds, m, "mds"));
  return out;
}
