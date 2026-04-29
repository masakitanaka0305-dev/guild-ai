// GUILD AI — discord-bridge (Postgres-backed)
// Receives Discord events, applies weights and a per-day rate limit,
// then publishes updated discordContribution back to Trust Score.
// Per-user state is persisted to discord_user_state.
// In-process pub/sub (onContributionUpdate) stays in memory — listeners aren't durable.

import { eq, sql } from "drizzle-orm";
import type { DiscordActionKind, DiscordEvent } from "@/types";
import { db } from "@/db/client";
import { discordUserState } from "@/db/schema";

export const DISCORD_WEIGHTS: Record<DiscordActionKind, number> = {
  share: 5,
  endorse: 3,
  react: 1,
  "bug-report": 4,
};

export const DAILY_CAP = 50; // pt per user per day

const dayKey = (iso: string) => iso.slice(0, 10);

export class DiscordBridge {
  private listeners: Array<(userId: string, contribution: number) => void> = [];

  /**
   * Subscribe to discordContribution updates (Pub/Sub). Listeners are in-process only.
   */
  onContributionUpdate(listener: (userId: string, contribution: number) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Ingest a Discord event. Returns the points actually awarded after rate-limiting. */
  async ingest(event: DiscordEvent): Promise<number> {
    const weight = DISCORD_WEIGHTS[event.kind];
    if (typeof weight !== "number") return 0;

    const today = dayKey(event.occurredAt);

    // Read current row (if any).
    const [prev] = await db
      .select()
      .from(discordUserState)
      .where(eq(discordUserState.userId, event.userId));

    const earnedToday = prev && prev.currentDate === today ? prev.earnedToday : 0;
    const remaining = Math.max(0, DAILY_CAP - earnedToday);
    const awarded = Math.min(weight, remaining);

    if (awarded > 0) {
      const nextEarned = earnedToday + awarded;
      const nextContribution = Math.min(100, (prev?.contributionTotal ?? 0) + awarded);

      await db
        .insert(discordUserState)
        .values({
          userId: event.userId,
          currentDate: today,
          earnedToday: nextEarned,
          contributionTotal: nextContribution,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: discordUserState.userId,
          set: {
            currentDate: today,
            earnedToday: nextEarned,
            contributionTotal: nextContribution,
            updatedAt: new Date(),
          },
        });

      for (const l of this.listeners) l(event.userId, nextContribution);
    }
    return awarded;
  }

  async contributionFor(userId: string): Promise<number> {
    const [row] = await db
      .select({ contributionTotal: discordUserState.contributionTotal })
      .from(discordUserState)
      .where(eq(discordUserState.userId, userId));
    return row?.contributionTotal ?? 0;
  }

  /** Test/debug helper: reset listeners + clear DB state. */
  async reset(): Promise<void> {
    this.listeners = [];
    await db.delete(discordUserState);
  }
}

// Default singleton for app usage
export const discordBridge = new DiscordBridge();

// ─── Ambassador Meritocracy ───────────────────────────────────────────────────

export interface AmbassadorRewardResult {
  ambassadorId: string;
  saleAmount: number;
  rewardAmount: number;
  share: number;
  awardedAt: string;
  txHash: string; // mock smart-contract transaction hash
}

/**
 * Calculate and record the ambassador referral reward for a completed sale.
 * Default share is 5% of the sale amount.
 *
 * The contribution update is fire-and-forget — the reward attribution itself
 * doesn't depend on the bridge ingest succeeding.
 */
export function attributeAmbassadorReward(
  ambassadorId: string,
  saleAmount: number,
  share = 0.05,
): AmbassadorRewardResult {
  const rewardAmount = Math.round(saleAmount * share);

  const contributionPoints = Math.min(10, Math.round(rewardAmount / 100));
  if (contributionPoints > 0) {
    discordBridge
      .ingest({
        userId: ambassadorId,
        kind: "share",
        listingId: `ambassador_sale_${ambassadorId}`,
        occurredAt: new Date().toISOString(),
      })
      .catch((err) => console.error("[attributeAmbassadorReward] ingest failed:", err));
  }

  // Generate deterministic-looking mock tx hash (64 hex chars)
  const txSeed = `${ambassadorId}_${saleAmount}_${Date.now()}`;
  const txHash = "0x" + Array.from({ length: 64 }, (_, i) => {
    const c = (txSeed.charCodeAt(i % txSeed.length) ^ (i * 31)) & 0xf;
    return c.toString(16);
  }).join("");

  return {
    ambassadorId,
    saleAmount,
    rewardAmount,
    share,
    awardedAt: new Date().toISOString(),
    txHash,
  };
}
