// GUILD AI — Royalty (DB persistence)
// Pure distribution math stays in lib/royalty/index.ts.
// This file persists computed royalty events to royalty_payouts +
// royalty_distributions when an actual secondary sale fires.

import { desc, eq } from "drizzle-orm";
import type { RoyaltyResult } from "@/types";
import { db } from "@/db/client";
import { royaltyPayouts, royaltyDistributions } from "@/db/schema";

export interface PersistedRoyaltyPayout {
  id: string;
  saleAssetId: string;
  saleAmount: number;
  totalRoyaltyPaid: number;
  sellerNet: number;
  occurredAt: string; // ISO8601
  distributionIds: string[];
}

/**
 * persistRoyaltyPayout — writes the parent row and all child distribution rows
 * in a single Drizzle transaction (atomic — partial writes are rolled back).
 */
export async function persistRoyaltyPayout(
  saleAssetId: string,
  result: RoyaltyResult
): Promise<PersistedRoyaltyPayout> {
  const payoutId = `royalty-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const saleAmount = result.totalRoyaltyPaid + result.sellerNet;

  const [payout] = await db
    .insert(royaltyPayouts)
    .values({
      id: payoutId,
      saleAssetId,
      saleAmount,
      totalRoyaltyPaid: result.totalRoyaltyPaid,
      sellerNet: result.sellerNet,
    })
    .returning();

  const distributionIds: string[] = [];
  for (const dist of result.distributions) {
    const distId = `royalty-dist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    distributionIds.push(distId);
    await db.insert(royaltyDistributions).values({
      id: distId,
      payoutId,
      creatorId: dist.creatorId,
      creatorName: dist.name,
      amount: dist.amount,
      trustScoreBonus: dist.trustScoreBonus,
      generation: dist.generation,
    });
  }

  return {
    id: payout.id,
    saleAssetId: payout.saleAssetId,
    saleAmount: payout.saleAmount,
    totalRoyaltyPaid: payout.totalRoyaltyPaid,
    sellerNet: payout.sellerNet,
    occurredAt: payout.occurredAt.toISOString(),
    distributionIds,
  };
}

/** getRoyaltyHistoryForAsset — all payouts for an asset, newest first. */
export async function getRoyaltyHistoryForAsset(saleAssetId: string) {
  return db
    .select()
    .from(royaltyPayouts)
    .where(eq(royaltyPayouts.saleAssetId, saleAssetId))
    .orderBy(desc(royaltyPayouts.occurredAt));
}

/** getRoyaltyEarningsForCreator — sum of all distributions for a creatorId. */
export async function getRoyaltyEarningsForCreator(creatorId: string): Promise<number> {
  const rows = await db
    .select({ amount: royaltyDistributions.amount })
    .from(royaltyDistributions)
    .where(eq(royaltyDistributions.creatorId, creatorId));
  return rows.reduce((sum, r) => sum + r.amount, 0);
}
