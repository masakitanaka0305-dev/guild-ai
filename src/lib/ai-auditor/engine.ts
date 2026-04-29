// v3 Orchestrator: Layered evaluation engine
//
// Composes Layer 1 (static), Layer 2 (market signals), Layer 3 (longitudinal)
// into a single composite score. Applies time-confidence weighting so freshly
// posted MDs are scored mostly on static, while mature MDs lean on market data.
//
// History is appended to audit_results_history on every run.

import { and, desc, eq, gte, lt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db/client";
import {
  listings, auditResultsHistory, mdMarketMetrics, freshnessSignals,
  authorReputation, checkoutSessions, ownershipRecords,
} from "@/db/schema";
import type { MarketPolicy } from "./policy";
import { loadActivePolicy } from "./policy";
import { computeInformationDensity } from "./dimensions/information-density";
import { computeOriginality } from "./dimensions/originality";
import { computeFailureCoverage } from "./dimensions/failure-coverage";
import { computeVerifiability } from "./dimensions/verifiability";
import { computeParseReadability } from "./dimensions/parse-readability";
import type { DimensionName, DimensionScore } from "./dimensions/types";

export type AuditTrigger =
  | "initial-static"
  | "scheduled-7d" | "scheduled-30d" | "scheduled-90d" | "scheduled-180d"
  | "event-purchase" | "event-refund" | "event-author-update" | "event-flag"
  | "challenge-resolution" | "manual";

export interface AuditInput {
  mdId: string;
  mdContent: string;          // raw MD text
  authorId?: string;          // for author_reputation lookup
  trigger?: AuditTrigger;
  postedAt?: Date;            // submission time, for confidence calc
  policy?: MarketPolicy;      // optional override
}

export interface AuditResult {
  mdId: string;
  rank: "S" | "A" | "B" | "C";
  subRanks: string[];
  score: number;              // 0..100
  confidence: number;         // 0..100, time-based data accumulation
  layerScores: {
    static: number;
    market: number;
    longitudinal: number;
  };
  dimensions: Record<DimensionName, DimensionScore>;
  marketSignals: MarketSignals | null;
  longitudinalSignals: LongitudinalSignals | null;
  authorMultiplier: number;
  freshnessMultiplier: number;
  policyVersion: string;
  reasons: string[];
  publicResponse: PublicAuditResponse;
}

interface MarketSignals {
  purchases: number;
  repurchases: number;
  refunds: number;
  refund_rate: number;
  api_calls: number;
}

interface LongitudinalSignals {
  age_days: number;
  still_used_30d: boolean;
  freshness_score: number;
  has_recent_update: boolean;
}

export interface PublicAuditResponse {
  rank: string;
  sub_ranks: string[];
  score_band: "high" | "medium" | "low";
  top_strengths: string[];
  improvement_hints: string[];
  next_step_to_higher_rank: string | null;
  policy_version: string;
  audited_at: string;
}

// ─── time confidence ─────────────────────────────────────────────────────────

/** confidence(T): how much market/longitudinal data we trust at age T. */
function timeConfidence(ageDays: number): number {
  if (ageDays < 1) return 0;
  if (ageDays < 7) return 0.4 * (ageDays / 7);
  if (ageDays < 30) return 0.4 + 0.3 * ((ageDays - 7) / 23);
  if (ageDays < 90) return 0.7 + 0.25 * ((ageDays - 30) / 60);
  if (ageDays < 180) return 0.95 + 0.05 * ((ageDays - 90) / 90);
  return 1.0;
}

// ─── Layer 1: Static evaluation ──────────────────────────────────────────────

function staticEvaluate(content: string): {
  dimensions: Record<DimensionName, DimensionScore>;
  weighted: number;
} {
  const dimensions: Record<DimensionName, DimensionScore> = {
    information_density: computeInformationDensity(content),
    originality: computeOriginality(content),
    failure_coverage: computeFailureCoverage(content),
    verifiability: computeVerifiability(content),
    parse_readability: computeParseReadability(content),
  };

  // Weighted average (default weights — will be overridden by policy.weights)
  const dimWeights: Record<DimensionName, number> = {
    information_density: 1.0,
    originality: 1.3,
    failure_coverage: 1.5,
    verifiability: 1.5,
    parse_readability: 1.0,
  };
  let totalW = 0;
  let totalScore = 0;
  for (const [name, dim] of Object.entries(dimensions)) {
    const w = dimWeights[name as DimensionName];
    totalW += w;
    totalScore += dim.score * w;
  }
  const weighted = totalW === 0 ? 0 : totalScore / totalW;

  return { dimensions, weighted };
}

// ─── Layer 2: Market signals ─────────────────────────────────────────────────

async function marketEvaluate(mdId: string): Promise<{ signals: MarketSignals | null; score: number }> {
  // Aggregate from existing tables
  const sessions = await db
    .select({
      buyerId: checkoutSessions.buyerId,
      status: checkoutSessions.status,
    })
    .from(checkoutSessions)
    .where(eq(checkoutSessions.assetId, mdId));

  const settled = sessions.filter((s) => s.status === "settled");
  const failed = sessions.filter((s) => s.status === "failed");
  const purchases = settled.length;
  const refunds = failed.length;
  const refundRate = purchases === 0 ? 0 : refunds / purchases;

  // Repurchases: same buyer purchased multiple times
  const buyerCounts = new Map<string, number>();
  for (const s of settled) buyerCounts.set(s.buyerId, (buyerCounts.get(s.buyerId) ?? 0) + 1);
  const repurchases = [...buyerCounts.values()].filter((c) => c > 1).length;

  if (purchases === 0) return { signals: null, score: 0 };

  // Score: balance purchases vs refunds, bonus for repurchases
  const purchaseScore = Math.min(60, Math.log10(purchases + 1) * 20);
  const repeatBonus = Math.min(25, repurchases * 5);
  const refundPenalty = Math.min(40, refundRate * 100);

  const score = Math.max(0, Math.min(100, 30 + purchaseScore + repeatBonus - refundPenalty));

  return {
    signals: { purchases, repurchases, refunds, refund_rate: refundRate, api_calls: 0 },
    score,
  };
}

// ─── Layer 3: Longitudinal signals ───────────────────────────────────────────

async function longitudinalEvaluate(mdId: string, postedAt: Date): Promise<{
  signals: LongitudinalSignals | null;
  score: number;
}> {
  const ageDays = Math.floor((Date.now() - postedAt.getTime()) / (24 * 60 * 60 * 1000));

  if (ageDays < 7) return { signals: null, score: 50 };

  // still used in last 30 days?
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = await db
    .select({ id: checkoutSessions.id })
    .from(checkoutSessions)
    .where(and(eq(checkoutSessions.assetId, mdId), gte(checkoutSessions.createdAt, cutoff)))
    .limit(1);
  const stillUsed = recent.length > 0;

  // freshness from signals table
  const fresh = await db
    .select()
    .from(freshnessSignals)
    .where(eq(freshnessSignals.mdId, mdId));
  const totalCentrality = fresh.reduce((sum, f) => sum + f.centrality, 0);
  const freshnessScore = fresh.length === 0
    ? 80  // no decay signals = assume fresh
    : Math.max(0, 100 - totalCentrality / Math.max(1, fresh.length));

  const score = Math.max(0, Math.min(100,
    (stillUsed ? 60 : 20) +
    (freshnessScore * 0.4)
  ));

  return {
    signals: { age_days: ageDays, still_used_30d: stillUsed, freshness_score: freshnessScore, has_recent_update: false },
    score,
  };
}

// ─── multipliers ─────────────────────────────────────────────────────────────

async function authorRepMultiplier(authorId: string | undefined): Promise<number> {
  if (!authorId) return 1.0;
  const [row] = await db.select().from(authorReputation).where(eq(authorReputation.userId, authorId));
  const score = row?.score ?? 50;  // default neutral
  return 0.7 + 0.3 * (score / 100);
}

function freshnessMultiplier(longitudinal: LongitudinalSignals | null): number {
  if (!longitudinal) return 1.0;
  return 0.5 + 0.5 * (longitudinal.freshness_score / 100);
}

// ─── rank assignment ─────────────────────────────────────────────────────────

function assignRank(score: number, policy: MarketPolicy): "S" | "A" | "B" | "C" {
  // Apply reviewStrictness as global threshold scaler
  const strictness = policy.reviewStrictness;
  const sThreshold = 80 * strictness + 5;
  const aThreshold = 65 * strictness + 5;
  const bThreshold = 40 * strictness + 5;

  if (score >= sThreshold) return "S";
  if (score >= aThreshold) return "A";
  if (score >= bThreshold) return "B";
  return "C";
}

function assignSubRanks(
  rank: string,
  marketSignals: MarketSignals | null,
  longitudinal: LongitudinalSignals | null,
  dimensions: Record<DimensionName, DimensionScore>,
): string[] {
  if (rank !== "S") return [];
  const subs: string[] = [];

  if (longitudinal && longitudinal.age_days >= 90 && longitudinal.freshness_score >= 80 && longitudinal.still_used_30d) {
    subs.push("S-Core");
  }
  if (marketSignals && marketSignals.purchases >= 50 && marketSignals.refund_rate < 0.05) {
    subs.push("S-Hot");
  }
  if (dimensions.originality.score >= 90 && (marketSignals?.purchases ?? 0) < 30) {
    subs.push("S-Rare");
  }
  return subs;
}

// ─── main entry point ────────────────────────────────────────────────────────

export async function auditMd(input: AuditInput): Promise<AuditResult> {
  const policy = input.policy ?? await loadActivePolicy("bootstrap");
  const postedAt = input.postedAt ?? new Date();
  const ageDays = Math.floor((Date.now() - postedAt.getTime()) / (24 * 60 * 60 * 1000));
  const confidence = timeConfidence(ageDays);

  // Layer 1
  const layer1 = staticEvaluate(input.mdContent);

  // Layer 2 + 3 (only if data available)
  const market = ageDays >= 1 ? await marketEvaluate(input.mdId) : { signals: null, score: 0 };
  const longitudinal = ageDays >= 7 ? await longitudinalEvaluate(input.mdId, postedAt) : { signals: null, score: 0 };

  // composite raw score with time confidence
  const rawScore =
    (1 - confidence) * layer1.weighted +
    confidence * (
      0.45 * (market.signals ? market.score : layer1.weighted) +  // market_reaction proxy
      0.25 * market.score +
      0.15 * layer1.weighted +
      0.15 * longitudinal.score
    );

  // Apply multipliers
  const fMult = freshnessMultiplier(longitudinal.signals);
  const aMult = await authorRepMultiplier(input.authorId);
  const finalScore = Math.max(0, Math.min(100, rawScore * fMult * aMult));

  const rank = assignRank(finalScore, policy);
  const subRanks = assignSubRanks(rank, market.signals, longitudinal.signals, layer1.dimensions);

  const reasons = generateReasons(layer1.dimensions, market.signals, longitudinal.signals, rank);

  const result: AuditResult = {
    mdId: input.mdId,
    rank,
    subRanks,
    score: Math.round(finalScore),
    confidence: Math.round(confidence * 100),
    layerScores: {
      static: Math.round(layer1.weighted),
      market: Math.round(market.score),
      longitudinal: Math.round(longitudinal.score),
    },
    dimensions: layer1.dimensions,
    marketSignals: market.signals,
    longitudinalSignals: longitudinal.signals,
    authorMultiplier: aMult,
    freshnessMultiplier: fMult,
    policyVersion: policy.policyVersion,
    reasons,
    publicResponse: {
      rank,
      sub_ranks: subRanks,
      score_band: finalScore >= 70 ? "high" : finalScore >= 45 ? "medium" : "low",
      top_strengths: pickTopStrengths(layer1.dimensions),
      improvement_hints: pickImprovementHints(layer1.dimensions),
      next_step_to_higher_rank: nextStepHint(rank, layer1.dimensions),
      policy_version: policy.policyVersion,
      audited_at: new Date().toISOString(),
    },
  };

  // Persist history
  await db.insert(auditResultsHistory).values({
    id: `aud-${Date.now()}-${randomBytes(4).toString("hex")}`,
    mdId: input.mdId,
    rank,
    subRanks,
    score: result.score,
    layerScores: result.layerScores,
    policyVersion: policy.policyVersion,
    triggerEvent: input.trigger ?? "manual",
    confidence: result.confidence,
    rawSignals: {
      dimensions: layer1.dimensions,
      market: market.signals,
      longitudinal: longitudinal.signals,
      multipliers: { author: aMult, freshness: fMult },
    },
  });

  return result;
}

function generateReasons(
  dimensions: Record<DimensionName, DimensionScore>,
  market: MarketSignals | null,
  longitudinal: LongitudinalSignals | null,
  _rank: string,
): string[] {
  const reasons: string[] = [];
  const sorted = Object.entries(dimensions).sort((a, b) => b[1].score - a[1].score);
  if (sorted[0] && sorted[0][1].score >= 70) {
    reasons.push(`${sorted[0][0]} score ${sorted[0][1].score} が貢献`);
  }
  if (sorted[sorted.length - 1] && sorted[sorted.length - 1][1].score < 40) {
    reasons.push(`${sorted[sorted.length - 1][0]} score ${sorted[sorted.length - 1][1].score} が改善余地`);
  }
  if (market && market.purchases >= 10) reasons.push(`市場で実証済み（${market.purchases} 件購入）`);
  if (market && market.refund_rate > 0.1) reasons.push(`返金率 ${(market.refund_rate * 100).toFixed(1)}% は要注意`);
  if (longitudinal?.still_used_30d) reasons.push(`過去 30 日も利用継続`);
  return reasons;
}

function pickTopStrengths(dimensions: Record<DimensionName, DimensionScore>): string[] {
  const labels: Record<DimensionName, string> = {
    information_density: "情報密度",
    originality: "オリジナリティ",
    failure_coverage: "失敗例の網羅性",
    verifiability: "検証可能性",
    parse_readability: "AI parse 容易性",
  };
  return Object.entries(dimensions)
    .filter(([, d]) => d.score >= 70)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3)
    .map(([name]) => labels[name as DimensionName]);
}

function pickImprovementHints(dimensions: Record<DimensionName, DimensionScore>): string[] {
  const hints: string[] = [];
  if (dimensions.failure_coverage.score < 50) hints.push("失敗例・落とし穴の追記で評価が大きく上がります");
  if (dimensions.verifiability.score < 50) hints.push("出典 URL・コミット SHA・実測値の追加を推奨");
  if (dimensions.parse_readability.score < 50) hints.push("用語ゆらぎを統一、コードブロックを追加");
  if (dimensions.information_density.score < 50) hints.push("冗長な前置きを削除、結論先出し構成に");
  return hints;
}

function nextStepHint(
  rank: string,
  dimensions: Record<DimensionName, DimensionScore>,
): string | null {
  if (rank === "S") return null;
  const weakest = Object.entries(dimensions).sort((a, b) => a[1].score - b[1].score)[0];
  if (!weakest) return null;
  const labels: Record<DimensionName, string> = {
    information_density: "情報密度",
    originality: "オリジナリティ",
    failure_coverage: "失敗例の網羅性",
    verifiability: "検証可能性",
    parse_readability: "AI parse 容易性",
  };
  const targetRank = rank === "C" ? "B" : rank === "B" ? "A" : "S";
  return `${targetRank} を狙うなら、まず「${labels[weakest[0] as DimensionName]}」を底上げしましょう`;
}

/** Get the latest audit result for an MD (or null if never audited). */
export async function getLatestAudit(mdId: string) {
  const [row] = await db
    .select()
    .from(auditResultsHistory)
    .where(eq(auditResultsHistory.mdId, mdId))
    .orderBy(desc(auditResultsHistory.auditedAt))
    .limit(1);
  return row ?? null;
}

/** Get the full audit history for an MD. */
export async function getAuditHistory(mdId: string) {
  return db
    .select()
    .from(auditResultsHistory)
    .where(eq(auditResultsHistory.mdId, mdId))
    .orderBy(desc(auditResultsHistory.auditedAt));
}
