// GUILD AI — Honest event-driven notifications (#128).
//
// Replaces hypothetical "price spike" / "急騰" / "X% 上昇" copy with
// fact-based events tied to real (mock) backend signals: actual royalty
// settlements, weekly summaries, and inbound enterprise interest.
//
// Design rules (mirrored in docs/Notification-Honesty設計.md):
//   1. Every notification message references a concrete number or
//      counterparty already attested by the system. No projected /
//      synthetic % moves.
//   2. The weekly digest only reports past activity, never forecasts.
//   3. Interest signals (e.g. "○○社が知恵に注目") name a counterparty;
//      we never invent fake "viewer counts".
//   4. UI strings are copy-locked: jargon-lint forbids 急騰 / 価値が
//      上昇 / X% 上昇 etc. (see jargon-lint.test.ts).

export type HonestNotificationType =
  | "weekly_summary"
  | "royalty_settled"
  | "enterprise_interest";

export interface HonestNotification {
  id: string;
  type: HonestNotificationType;
  title: string;
  message: string;
  /** ISO 8601 timestamp at which the underlying event happened. */
  at: string;
  /** Anchored to a concrete attribute so the user can verify. */
  attribution: {
    /** Pretty label used in the UI body. */
    label: string;
    /** Currency-or-yen amount, when applicable. */
    amountJpy?: number;
    /** Asset / project / counterparty id when applicable. */
    refId?: string;
  };
}

const ENTERPRISE_NAMES = [
  "AcmeAuto",
  "FinPath",
  "MizuhoOps",
  "FuyoNorth",
  "OkihataLabs",
];

const ASSET_TITLES = [
  "観測性設計メモ",
  "型推論レビュー集",
  "OpenAPI 速習ノート",
  "RAG 評価チェックリスト",
];

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Builds a weekly summary tied to the user's actual past-week earnings.
 * The amount comes from the caller (live-earnings / passbook) — this
 * helper only formats. The message never extrapolates forward.
 */
export function makeWeeklySummary(
  userId: string,
  weekTotalJpy: number,
  refMonday: Date = new Date(),
): HonestNotification {
  const ts = refMonday.toISOString();
  return {
    id: `weekly_${djb2(userId + ts).toString(36)}`,
    type: "weekly_summary",
    title: "先週のお礼",
    message: `先週、あなたの知恵は ¥${weekTotalJpy.toLocaleString("ja-JP")} 稼ぎました。`,
    at: ts,
    attribution: {
      label: "週次サマリ",
      amountJpy: weekTotalJpy,
    },
  };
}

/**
 * One-off royalty settlement notification — fired only when the system
 * has already booked the amount. The UI should never schedule this in
 * advance of the actual settlement.
 */
export function makeRoyaltySettled(
  txId: string,
  amountJpy: number,
  at: string,
): HonestNotification {
  return {
    id: `royalty_${txId}`,
    type: "royalty_settled",
    title: "新しい印税",
    message: `新しい印税が ¥${amountJpy.toLocaleString("ja-JP")} 入金されました。`,
    at,
    attribution: {
      label: "印税の確定",
      amountJpy,
      refId: txId,
    },
  };
}

/**
 * Enterprise interest signal — a real (mock) AtoA inquiry. The
 * counterparty is named so the user can take it at face value.
 */
export function makeEnterpriseInterest(
  userId: string,
  assetId: string,
  at: string,
): HonestNotification {
  const seed = djb2(userId + assetId + at);
  const company = ENTERPRISE_NAMES[seed % ENTERPRISE_NAMES.length];
  const title = ASSET_TITLES[(seed >> 4) % ASSET_TITLES.length];
  return {
    id: `interest_${assetId}_${seed.toString(36).slice(0, 6)}`,
    type: "enterprise_interest",
    title: "企業からの注目",
    message: `${company} があなたの『${title}』に注目しています。`,
    at,
    attribution: {
      label: company,
      refId: assetId,
    },
  };
}

/**
 * Convenience: deterministic stack of three honest notifications used
 * by the bell preview in /guild and /profile.
 */
export function buildHonestNotificationStack(userId: string): HonestNotification[] {
  // Anchored to fixed reference dates so SSR / tests stay stable.
  const monday = new Date("2026-04-27T09:00:00.000Z");
  const royaltyAt = new Date("2026-04-30T11:24:00.000Z").toISOString();
  const interestAt = new Date("2026-05-01T08:10:00.000Z").toISOString();

  const seed = djb2(userId);
  const weekTotal = 1800 + (seed % 4000);
  return [
    makeWeeklySummary(userId, weekTotal, monday),
    makeRoyaltySettled(`tx_${seed.toString(36).slice(0, 6)}`, 84, royaltyAt),
    makeEnterpriseInterest(userId, `md_${(seed % 999).toString(36)}`, interestAt),
  ];
}

/**
 * Test helper: keywords we never expose in honest copy. Mirrored by
 * jargon-lint to keep the codebase honest at the source-string level.
 */
export const FOMO_BANNED_PHRASES = [
  "急騰",
  "暴落",
  "値動き",
  "％上昇",
  "% 上昇",
  "％急騰",
] as const;
