// v2: Market Policy
// Versioned snapshots of evaluation parameters. Policy decides:
// - dimension weights
// - rank thresholds (gated by reviewStrictness)
// - rate caps (S/A/B/C target distribution)
// - reproducibility check triggers
// - manual review ratio
//
// In production, policies are loaded from `audit_policies` table by version.
// Default policies per market phase are defined here for bootstrap.

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { auditPolicies } from "@/db/schema";
import type { DimensionName } from "./dimensions/types";

export type MarketPhase = "bootstrap" | "growth" | "competitive" | "mature";

export interface MarketPolicy {
  policyVersion: string;
  marketPhase: MarketPhase;

  reviewStrictness: number;       // 0..1, global threshold multiplier

  rateTargets: { S: number; A: number; B: number; C: number };

  weights: Partial<Record<DimensionName, number>> & {
    downstream_outcome?: number;
    presentation?: number;
  };

  reproducibilityCheck: {
    sCandidate: boolean;
    cCandidate: boolean;
    randomSampleRatio: number;
    newAuthorRatio: number;
    trustedAuthorRatio: number;
  };

  manualReviewRatio: number;
  fraudAlertLevel: number;
}

// Default policies per phase — used until KPI feedback adjusts them.
const DEFAULTS: Record<MarketPhase, MarketPolicy> = {
  bootstrap: {
    policyVersion: "bootstrap-v1-default",
    marketPhase: "bootstrap",
    reviewStrictness: 0.50,
    rateTargets: { S: 0.10, A: 0.25, B: 0.45, C: 0.20 },
    weights: {
      information_density: 1.0,
      originality: 1.3,
      failure_coverage: 1.5,
      verifiability: 1.5,
      parse_readability: 1.0,
      downstream_outcome: 2.0,
      presentation: 0.6,
    },
    reproducibilityCheck: {
      sCandidate: true, cCandidate: false, randomSampleRatio: 0.05,
      newAuthorRatio: 0.50, trustedAuthorRatio: 0.10,
    },
    manualReviewRatio: 0.05,
    fraudAlertLevel: 0.80,
  },
  growth: {
    policyVersion: "growth-v1-default",
    marketPhase: "growth",
    reviewStrictness: 0.70,
    rateTargets: { S: 0.05, A: 0.20, B: 0.50, C: 0.25 },
    weights: {
      information_density: 1.0,
      originality: 1.3,
      failure_coverage: 1.5,
      verifiability: 1.5,
      parse_readability: 1.0,
      downstream_outcome: 2.0,
      presentation: 0.6,
    },
    reproducibilityCheck: {
      sCandidate: true, cCandidate: true, randomSampleRatio: 0.10,
      newAuthorRatio: 0.70, trustedAuthorRatio: 0.15,
    },
    manualReviewRatio: 0.10,
    fraudAlertLevel: 0.70,
  },
  competitive: {
    policyVersion: "competitive-v1-default",
    marketPhase: "competitive",
    reviewStrictness: 0.85,
    rateTargets: { S: 0.03, A: 0.15, B: 0.50, C: 0.32 },
    weights: {
      information_density: 1.0,
      originality: 1.4,
      failure_coverage: 1.6,
      verifiability: 1.6,
      parse_readability: 1.0,
      downstream_outcome: 2.2,
      presentation: 0.5,
    },
    reproducibilityCheck: {
      sCandidate: true, cCandidate: true, randomSampleRatio: 0.15,
      newAuthorRatio: 0.85, trustedAuthorRatio: 0.20,
    },
    manualReviewRatio: 0.12,
    fraudAlertLevel: 0.65,
  },
  mature: {
    policyVersion: "mature-v1-default",
    marketPhase: "mature",
    reviewStrictness: 0.92,
    rateTargets: { S: 0.03, A: 0.12, B: 0.50, C: 0.35 },
    weights: {
      information_density: 1.0,
      originality: 1.5,
      failure_coverage: 1.8,
      verifiability: 1.8,
      parse_readability: 1.0,
      downstream_outcome: 2.5,
      presentation: 0.4,
    },
    reproducibilityCheck: {
      sCandidate: true, cCandidate: true, randomSampleRatio: 0.20,
      newAuthorRatio: 0.90, trustedAuthorRatio: 0.25,
    },
    manualReviewRatio: 0.15,
    fraudAlertLevel: 0.60,
  },
};

export function getDefaultPolicy(phase: MarketPhase = "bootstrap"): MarketPolicy {
  return DEFAULTS[phase];
}

/**
 * Loads the active policy from DB (latest effective). On cold-start, seeds
 * the default policy for this phase so audit_results_history FK is satisfied.
 */
export async function loadActivePolicy(phase: MarketPhase = "bootstrap"): Promise<MarketPolicy> {
  const rows = await db.select().from(auditPolicies);
  const now = new Date();
  const active = rows
    .filter((r) => r.effectiveFrom <= now && (r.effectiveTo === null || r.effectiveTo > now))
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];

  if (active) return active.params as MarketPolicy;

  // Cold start: seed the default policy for this phase
  const defaultPolicy = getDefaultPolicy(phase);
  await db.insert(auditPolicies).values({
    policyVersion: defaultPolicy.policyVersion,
    marketPhase: defaultPolicy.marketPhase,
    params: defaultPolicy as unknown as Record<string, unknown>,
    effectiveFrom: now,
  }).onConflictDoNothing();
  return defaultPolicy;
}

/** Snapshots a policy into the DB (used when KPI feedback creates a new version). */
export async function savePolicy(policy: MarketPolicy, effectiveFrom: Date = new Date()): Promise<void> {
  // Mark previous policies of this phase as expired
  // (Simple impl — UPDATE matching effective_to=null to effective_from)
  await db
    .insert(auditPolicies)
    .values({
      policyVersion: policy.policyVersion,
      marketPhase: policy.marketPhase,
      params: policy as unknown as Record<string, unknown>,
      effectiveFrom,
    })
    .onConflictDoUpdate({
      target: auditPolicies.policyVersion,
      set: { params: policy as unknown as Record<string, unknown>, effectiveFrom },
    });
}

export async function getPolicyByVersion(version: string): Promise<MarketPolicy | null> {
  const [row] = await db.select().from(auditPolicies).where(eq(auditPolicies.policyVersion, version));
  return row ? (row.params as MarketPolicy) : null;
}
