// GUILD AI — Value Pool (Postgres-backed)
// Per-asset pool of unclaimed-usage value. Released retroactively to a claimer.
// Parent (`value_pools`) holds the running total + distribution flag.
// Children (`value_pool_entries`) record each usage event.

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { valuePools, valuePoolEntries } from "@/db/schema";

export interface PoolEntry {
  timestamp: number;
  amountJpy: number;
}

export interface ValuePool {
  assetId: string;
  totalPooledJpy: number;
  sinceDate: string;
  perUseHistory: PoolEntry[];
  distributedYet: boolean;
  creditedAt?: number;
  claimerId?: string;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export async function recordUnclaimedUsage(assetId: string, amountJpy: number): Promise<void> {
  const today = todayISO();

  // Upsert parent: create with this amount or accumulate.
  await db
    .insert(valuePools)
    .values({
      assetId,
      totalPooledJpy: amountJpy,
      sinceDate: today,
      distributedYet: false,
    })
    .onConflictDoUpdate({
      target: valuePools.assetId,
      set: { totalPooledJpy: sql`${valuePools.totalPooledJpy} + ${amountJpy}` },
    });

  // Append child entry.
  await db.insert(valuePoolEntries).values({
    id: `pe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    assetId,
    amountJpy,
  });
}

export async function getValuePool(assetId: string): Promise<ValuePool | null> {
  const [pool] = await db.select().from(valuePools).where(eq(valuePools.assetId, assetId));
  if (!pool) return null;
  const entries = await db
    .select()
    .from(valuePoolEntries)
    .where(eq(valuePoolEntries.assetId, assetId));
  return {
    assetId: pool.assetId,
    totalPooledJpy: pool.totalPooledJpy,
    sinceDate: pool.sinceDate,
    perUseHistory: entries.map((e) => ({ timestamp: e.occurredAt.getTime(), amountJpy: e.amountJpy })),
    distributedYet: pool.distributedYet,
    creditedAt: pool.creditedAt?.getTime(),
    claimerId: pool.claimerId ?? undefined,
  };
}

export async function releaseRetroactive(
  assetId: string,
  claimerId: string
): Promise<{ releasedJpy: number } | { error: string }> {
  // Atomic: only flip distributedYet false → true.
  const [row] = await db
    .update(valuePools)
    .set({ distributedYet: true, creditedAt: new Date(), claimerId })
    .where(and(eq(valuePools.assetId, assetId), eq(valuePools.distributedYet, false)))
    .returning();

  if (row) return { releasedJpy: row.totalPooledJpy };

  // No row updated — disambiguate between missing pool and already-distributed.
  const [existing] = await db.select().from(valuePools).where(eq(valuePools.assetId, assetId));
  if (!existing) return { error: "no_pool" };
  return { error: "already_distributed" };
}

// Test-only.
export async function _resetPools(): Promise<void> {
  await db.delete(valuePoolEntries);
  await db.delete(valuePools);
}
