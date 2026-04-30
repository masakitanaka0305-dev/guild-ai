// GUILD AI — Matching Score
// Computes how well a user's owned MD portfolio matches a project's requirements.

import type { Rank } from "@/types";
import type { Project, ProjectRequiredMd } from "@/lib/projects";

const RANK_SCORE: Record<Rank, number> = { S: 3, A: 2, B: 1, D: 0 };

export interface OwnedMd {
  id: string;
  rank: Rank;
}

export interface MatchingResult {
  score: number;          // 0-100
  matchedReqs: number;    // count of matched requirements
  totalReqs: number;      // total requirements
  missingMds: ProjectRequiredMd[]; // unmatched requirements
  matchDetails: { req: ProjectRequiredMd; matched: boolean; ownedRank?: Rank }[];
}

/**
 * Computes how well ownedMds satisfies project's requiredMdInterfaces.
 *
 * score = Σ(matchedReq.weight × ownedRankScore) / Σ(allReqs.weight × req.rankMinScore) × 100
 * Clamped to [0, 100].
 */
export function computeMatchingScore(
  ownedMds: OwnedMd[],
  project: Project,
): MatchingResult {
  const reqs = project.requiredMdInterfaces;
  let numerator = 0;
  let denominator = 0;
  let matchedReqs = 0;
  const missingMds: ProjectRequiredMd[] = [];
  const matchDetails: MatchingResult["matchDetails"] = [];

  for (const req of reqs) {
    const reqMinScore = RANK_SCORE[req.rankMin];
    denominator += req.weight * reqMinScore;

    const owned = ownedMds.find(
      (m) => m.id === req.id && RANK_SCORE[m.rank] >= reqMinScore,
    );

    if (owned) {
      numerator += req.weight * RANK_SCORE[owned.rank];
      matchedReqs++;
      matchDetails.push({ req, matched: true, ownedRank: owned.rank });
    } else {
      missingMds.push(req);
      matchDetails.push({ req, matched: false });
    }
  }

  const score = denominator === 0
    ? 100
    : Math.min(100, Math.round((numerator / denominator) * 100));

  return { score, matchedReqs, totalReqs: reqs.length, missingMds, matchDetails };
}

/** Deterministic demo portfolio for a given handle (for test + mock rendering) */
export function getDemoOwnedMds(handle: string): OwnedMd[] {
  const seed = handle.split("").reduce((h, c) => h + c.charCodeAt(0), 0);
  const POOL: OwnedMd[] = [
    { id: "md_observability", rank: "A" },
    { id: "md_infra_go",      rank: "B" },
    { id: "md_ml_pipeline",   rank: "A" },
    { id: "md_feature_store", rank: "S" },
    { id: "md_rag_design",    rank: "S" },
    { id: "md_agent_arch",    rank: "A" },
    { id: "md_react_native",  rank: "B" },
    { id: "md_compliance",    rank: "A" },
  ];
  // Return a deterministic subset (at least 3, at most 6)
  const count = 3 + (seed % 4);
  return POOL.slice(0, count);
}
