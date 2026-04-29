import type { AuditResult } from "@/types";

export interface InstantBuyoutOffer {
  amountJpy: number;
  expiresInSec: number;
}

/**
 * Returns an instant buyout offer for S/A ranked assets only.
 * B rank returns null — no offer.
 * Amount = clamp(score * 800, 5000, 500000)
 */
export function offerInstantBuyout(audit: AuditResult): InstantBuyoutOffer | null {
  if (audit.rank === "B") return null;
  const raw = Math.round(audit.score * 800);
  const amountJpy = Math.max(5000, Math.min(500_000, raw));
  return { amountJpy, expiresInSec: 30 };
}

/**
 * Compute the assessment price range shown before ranking.
 * Returns [min, max] in JPY.
 */
export function computeAssessmentRange(score: number): [number, number] {
  const center = Math.max(500, Math.min(500_000, Math.round(score * 800)));
  const min = Math.max(500, Math.round(center * 0.6));
  const max = Math.min(500_000, Math.round(center * 1.4));
  return [min, max];
}

export function formatJpy(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}
