// v4 Primitives — Knowledge Economy Data Layer
//
// CRUD operations for the v4 mechanisms (Knowledge Equity Tokens, audit stakes,
// challenges, citations, negative flags, author reputation).
//
// IMPORTANT: this file implements DATA OPERATIONS only. The actual market
// dynamics (auction matching, dispute resolution algorithms, PageRank batch)
// are deliberately stubbed — they're separate concerns that depend on this
// data layer being in place first.

import { and, eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db/client";
import {
  mdEquityTokens, auditStakes, auditChallenges, mdCitations,
  negativeFlags, authorReputation,
} from "@/db/schema";

// ─── Knowledge Equity Tokens ────────────────────────────────────────────────

const TOTAL_SHARES = 1000;
const AUTHOR_INITIAL_PCT = 0.7;

/** Initialize equity for a newly listed MD: 70% to author, 30% in reserve pool. */
export async function initializeEquity(mdId: string, authorId: string): Promise<void> {
  const authorShares = Math.round(TOTAL_SHARES * AUTHOR_INITIAL_PCT);
  const reserveShares = TOTAL_SHARES - authorShares;
  await db.insert(mdEquityTokens).values([
    { mdId, holderId: authorId, shares: authorShares, acquiredPriceJpy: 0 },
    { mdId, holderId: "system:reserve", shares: reserveShares, acquiredPriceJpy: 0 },
  ]).onConflictDoNothing();
}

/** Transfer shares (simplified — no escrow, just bookkeeping). */
export async function transferShares(
  mdId: string, fromHolder: string, toHolder: string, shares: number, pricePerShareJpy: number,
): Promise<void> {
  // Decrement seller
  const [seller] = await db.select().from(mdEquityTokens)
    .where(and(eq(mdEquityTokens.mdId, mdId), eq(mdEquityTokens.holderId, fromHolder)));
  if (!seller || seller.shares < shares) throw new Error("INSUFFICIENT_SHARES");

  await db.update(mdEquityTokens)
    .set({ shares: seller.shares - shares })
    .where(and(eq(mdEquityTokens.mdId, mdId), eq(mdEquityTokens.holderId, fromHolder)));

  // Upsert buyer
  const [existing] = await db.select().from(mdEquityTokens)
    .where(and(eq(mdEquityTokens.mdId, mdId), eq(mdEquityTokens.holderId, toHolder)));
  if (existing) {
    await db.update(mdEquityTokens)
      .set({ shares: existing.shares + shares, acquiredPriceJpy: pricePerShareJpy * shares })
      .where(and(eq(mdEquityTokens.mdId, mdId), eq(mdEquityTokens.holderId, toHolder)));
  } else {
    await db.insert(mdEquityTokens).values({
      mdId, holderId: toHolder, shares, acquiredPriceJpy: pricePerShareJpy * shares,
    });
  }
}

export async function getEquityHolders(mdId: string) {
  return db.select().from(mdEquityTokens).where(eq(mdEquityTokens.mdId, mdId));
}

/** Distribute royalty proportionally to all share holders. */
export async function distributeRoyaltyByEquity(
  mdId: string, totalRoyaltyJpy: number,
): Promise<Array<{ holderId: string; share: number; payout: number }>> {
  const holders = await getEquityHolders(mdId);
  return holders.map((h) => ({
    holderId: h.holderId,
    share: h.shares / TOTAL_SHARES,
    payout: Math.round((h.shares / TOTAL_SHARES) * totalRoyaltyJpy),
  }));
}

// ─── Audit Stakes ───────────────────────────────────────────────────────────

export interface PlaceStakeInput {
  mdId: string;
  stakerId: string;
  position: "promote" | "demote" | "hold";
  predictedRank: "S" | "A" | "B" | "C";
  amountJpyc: number;
}

export async function placeStake(input: PlaceStakeInput): Promise<string> {
  const id = `stake-${Date.now()}-${randomBytes(4).toString("hex")}`;
  await db.insert(auditStakes).values({
    id, mdId: input.mdId, stakerId: input.stakerId,
    position: input.position, predictedRank: input.predictedRank,
    amountJpyc: input.amountJpyc,
  });
  return id;
}

/**
 * Resolve all open stakes for an MD against the actual confirmed rank.
 * Winners = those whose predictedRank matches actualRank. Losers' stakes go
 * into a pool, distributed pro-rata among winners (1.5x payout typical).
 *
 * Stub: the matching engine (winning ratio, slashing curve) is simplified.
 */
export async function resolveStakes(mdId: string, actualRank: string): Promise<{ winners: number; losers: number }> {
  const stakes = await db.select().from(auditStakes)
    .where(and(eq(auditStakes.mdId, mdId), sql`${auditStakes.resolvedAt} IS NULL`));

  let winners = 0, losers = 0;
  for (const s of stakes) {
    const won = s.predictedRank === actualRank;
    const payout = won ? Math.round(s.amountJpyc * 1.5) : 0;
    await db.update(auditStakes)
      .set({ resolvedAt: new Date(), won, payoutJpyc: payout })
      .where(eq(auditStakes.id, s.id));
    if (won) winners++; else losers++;
  }
  return { winners, losers };
}

export async function getStakesByMd(mdId: string) {
  return db.select().from(auditStakes).where(eq(auditStakes.mdId, mdId));
}

// ─── Audit Challenges ───────────────────────────────────────────────────────

export interface CreateChallengeInput {
  mdId: string;
  challengerId: string;
  originalRank: string;
  proposedRank: string;
  bondJpyc: number;
  reason?: string;
}

export async function createChallenge(input: CreateChallengeInput): Promise<string> {
  const id = `chal-${Date.now()}-${randomBytes(4).toString("hex")}`;
  await db.insert(auditChallenges).values({
    id, mdId: input.mdId, challengerId: input.challengerId,
    originalRank: input.originalRank, proposedRank: input.proposedRank,
    bondJpyc: input.bondJpyc, reason: input.reason,
  });
  return id;
}

export async function resolveChallenge(
  challengeId: string, overturned: boolean, note?: string,
): Promise<void> {
  await db.update(auditChallenges)
    .set({
      status: overturned ? "resolved-overturned" : "resolved-upheld",
      resolvedAt: new Date(),
      resolutionNote: note,
    })
    .where(eq(auditChallenges.id, challengeId));
}

export async function getOpenChallenges(mdId: string) {
  return db.select().from(auditChallenges)
    .where(and(eq(auditChallenges.mdId, mdId), eq(auditChallenges.status, "open")));
}

// ─── MD Citations (knowledge graph) ─────────────────────────────────────────

export async function recordCitation(
  citingMd: string, citedMd: string, weight = 50, method = "author-declared",
): Promise<void> {
  await db.insert(mdCitations).values({
    citingMd, citedMd, weight, detectedMethod: method,
  }).onConflictDoNothing();
}

export async function getCitedBy(mdId: string) {
  return db.select().from(mdCitations).where(eq(mdCitations.citedMd, mdId));
}

export async function getCitations(mdId: string) {
  return db.select().from(mdCitations).where(eq(mdCitations.citingMd, mdId));
}

/**
 * STUB: PageRank-style flow calculation.
 * Real implementation runs as monthly batch over the full citation graph.
 * Here we expose a placeholder for the API surface.
 */
export async function computeCitationFlow(_mdId: string): Promise<number> {
  // TODO: implement PageRank batch in src/lib/ai-auditor/jobs/citation-pagerank.ts
  return 0;
}

// ─── Negative Flags ─────────────────────────────────────────────────────────

export interface FlagInput {
  mdId: string;
  flaggerId: string;
  flagType: "harmful" | "stale" | "plagiarism" | "fake-claim";
  bondJpyc: number;
  evidence?: Record<string, unknown>;
}

export async function flagMd(input: FlagInput): Promise<string> {
  const id = `flag-${Date.now()}-${randomBytes(4).toString("hex")}`;
  await db.insert(negativeFlags).values({
    id, mdId: input.mdId, flaggerId: input.flaggerId,
    flagType: input.flagType, bondJpyc: input.bondJpyc,
    evidence: input.evidence ?? null,
  });
  return id;
}

export async function resolveFlag(flagId: string, confirmed: boolean): Promise<void> {
  await db.update(negativeFlags)
    .set({ status: confirmed ? "confirmed" : "dismissed", resolvedAt: new Date() })
    .where(eq(negativeFlags.id, flagId));
}

export async function getFlagsByMd(mdId: string) {
  return db.select().from(negativeFlags).where(eq(negativeFlags.mdId, mdId));
}

// ─── Author Reputation ──────────────────────────────────────────────────────

export interface ReputationComponents {
  historical_S_rate: number;        // 0..1
  refund_rate: number;              // 0..1
  update_continuity: number;        // 0..1
  repeat_buyer_rate: number;        // 0..1
  peer_endorsement: number;         // 0..1
  report_rate: number;              // 0..1
}

export function computeReputationScore(c: ReputationComponents): number {
  const raw =
    0.35 * c.historical_S_rate +
    0.20 * (1 - c.refund_rate) +
    0.15 * c.update_continuity +
    0.15 * c.repeat_buyer_rate +
    0.10 * c.peer_endorsement -
    0.05 * c.report_rate;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export async function upsertAuthorReputation(
  userId: string, components: ReputationComponents,
): Promise<number> {
  const score = computeReputationScore(components);
  await db.insert(authorReputation).values({
    userId, score, components: components as unknown as Record<string, unknown>,
  }).onConflictDoUpdate({
    target: authorReputation.userId,
    set: { score, components: components as unknown as Record<string, unknown>, updatedAt: new Date() },
  });
  return score;
}

export async function getAuthorReputation(userId: string) {
  const [row] = await db.select().from(authorReputation).where(eq(authorReputation.userId, userId));
  return row ?? null;
}
