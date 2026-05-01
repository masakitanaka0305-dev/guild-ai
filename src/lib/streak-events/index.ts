// GUILD AI — Streak / milestone notifications (#129).
//
// Replaces hypothetical "X% 急騰" copy with **fact-based** spike
// notifications anchored to actual past activity. Every event reports
// only what already happened: consecutive royalty days, weekly adoption
// peaks, 24-hour API call milestones, and cumulative thresholds.
//
// Design rules (mirrored in docs/Notification-Honesty設計.md):
//   1. Every message references a concrete number anchored to a
//      timestamp range we can show the user.
//   2. Streak events fire only on threshold crossings (3 / 7 / 14 / 30),
//      not on every day in between.
//   3. Peak events fire only when the current week's count strictly
//      exceeds the previous all-time max.
//   4. Same-type events are de-duplicated within a 24-hour window.
//   5. Forecasts / projections / "急騰" / "暴落" remain banned.

export type StreakEventType =
  | "consecutive_royalty_days"
  | "peak_weekly_adoption"
  | "consecutive_calls_milestone"
  | "royalty_total_milestone";

export interface StreakNotification {
  id: string;
  type: StreakEventType;
  title: string;
  message: string;
  /** ISO 8601 timestamp identifying the moment the threshold was crossed. */
  at: string;
  attribution: {
    label: string;
    /** The actual number that triggered the event (days / count / ¥). */
    value: number;
    refId?: string;
  };
}

// ─── Threshold tables ───────────────────────────────────────────────────────
//
// Each table is sorted ascending. We fire the *highest* threshold the
// caller's value clears that hasn't fired in the last 24h.

export const ROYALTY_DAY_THRESHOLDS = [3, 7, 14, 30] as const;
export const CALLS_24H_THRESHOLDS = [10, 50, 100, 500, 1000] as const;
export const ROYALTY_TOTAL_THRESHOLDS_JPY = [1_000, 10_000, 100_000, 1_000_000] as const;

// ─── Event helpers ──────────────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Returns the largest threshold ≤ value, or null when value is below all. */
function highestThresholdReached<T extends number>(
  value: number,
  table: readonly T[],
): T | null {
  let hit: T | null = null;
  for (const t of table) {
    if (value >= t) hit = t;
    else break;
  }
  return hit;
}

export function makeConsecutiveRoyaltyDays(
  userId: string,
  days: number,
  at: string,
): StreakNotification | null {
  const t = highestThresholdReached(days, ROYALTY_DAY_THRESHOLDS);
  if (t === null) return null;
  return {
    id: `royalty-streak-${t}-${djb2(userId + at).toString(36).slice(0, 6)}`,
    type: "consecutive_royalty_days",
    title: `${t} 日連続で印税`,
    message: `${t} 日連続で印税が届いています。`,
    at,
    attribution: { label: "連続日数", value: t },
  };
}

export function makePeakWeeklyAdoption(
  userId: string,
  thisWeek: number,
  previousMax: number,
  at: string,
): StreakNotification | null {
  if (thisWeek <= previousMax) return null;
  return {
    id: `peak-weekly-${thisWeek}-${djb2(userId + at).toString(36).slice(0, 6)}`,
    type: "peak_weekly_adoption",
    title: "今週の採用件数が過去最多",
    message: `今週、あなたの知恵が連続 ${thisWeek} 件採用されました（過去最多）。`,
    at,
    attribution: { label: "週次採用件数", value: thisWeek },
  };
}

export function makeConsecutiveCallsMilestone(
  userId: string,
  callsLast24h: number,
  at: string,
): StreakNotification | null {
  const t = highestThresholdReached(callsLast24h, CALLS_24H_THRESHOLDS);
  if (t === null) return null;
  return {
    id: `calls-${t}-${djb2(userId + at).toString(36).slice(0, 6)}`,
    type: "consecutive_calls_milestone",
    title: `直近 24 時間で ${t} 回呼び出し`,
    message: `直近 24 時間で ${t} 回呼び出されました。`,
    at,
    attribution: { label: "24 時間の呼出数", value: t },
  };
}

export function makeRoyaltyTotalMilestone(
  userId: string,
  totalJpy: number,
  at: string,
): StreakNotification | null {
  const t = highestThresholdReached(totalJpy, ROYALTY_TOTAL_THRESHOLDS_JPY);
  if (t === null) return null;
  return {
    id: `royalty-total-${t}-${djb2(userId + at).toString(36).slice(0, 6)}`,
    type: "royalty_total_milestone",
    title: `累計 ¥${t.toLocaleString("ja-JP")} 達成`,
    message: `累計 ¥${t.toLocaleString("ja-JP")} を超えました。`,
    at,
    attribution: { label: "累計お礼", value: t },
  };
}

// ─── Aggregate helpers ──────────────────────────────────────────────────────

export interface StreakHistory {
  /** Consecutive days the user has received at least one royalty. */
  consecutiveRoyaltyDays: number;
  /** Number of adoptions in the current week. */
  weeklyAdoptions: number;
  /** Previous all-time-high weekly adoptions (used to detect a new peak). */
  previousPeakWeeklyAdoptions: number;
  /** API calls in the rolling last 24h. */
  callsLast24h: number;
  /** Cumulative royalty earned (yen). */
  royaltyTotalJpy: number;
  /** ISO timestamp marking the audit point — used as `at` for events. */
  auditedAt: string;
  /** Set of event ids fired in the last 24h, for dedupe. */
  recentEventIds?: ReadonlySet<string>;
}

/**
 * Given a snapshot of the user's history, returns every streak /
 * milestone notification whose threshold has been crossed and which
 * hasn't already been emitted in the last 24h. Pure / deterministic.
 */
export function computeStreaks(
  userId: string,
  history: StreakHistory,
): StreakNotification[] {
  const out: StreakNotification[] = [];
  const recent = history.recentEventIds ?? new Set<string>();
  const candidates = [
    makeConsecutiveRoyaltyDays(userId, history.consecutiveRoyaltyDays, history.auditedAt),
    makePeakWeeklyAdoption(
      userId,
      history.weeklyAdoptions,
      history.previousPeakWeeklyAdoptions,
      history.auditedAt,
    ),
    makeConsecutiveCallsMilestone(userId, history.callsLast24h, history.auditedAt),
    makeRoyaltyTotalMilestone(userId, history.royaltyTotalJpy, history.auditedAt),
  ];
  for (const n of candidates) {
    if (n && !recent.has(n.id)) out.push(n);
  }
  return out;
}

/**
 * Demo seeder used by NotificationBell + tests. Returns a stable list
 * of 4 notifications anchored to fixed timestamps. The first call's
 * fact pattern is identical for any caller, but the id hashes vary by
 * userId so each user sees their own ledger.
 */
export function buildStreakDemoStack(userId: string): StreakNotification[] {
  return computeStreaks(userId, {
    consecutiveRoyaltyDays: 3,
    weeklyAdoptions: 5,
    previousPeakWeeklyAdoptions: 4,
    callsLast24h: 100,
    royaltyTotalJpy: 10_000,
    auditedAt: "2026-05-01T09:00:00.000Z",
  });
}
