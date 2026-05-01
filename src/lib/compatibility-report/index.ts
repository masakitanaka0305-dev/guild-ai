// GUILD AI — Intelligence Compatibility Report
//
// Pre-check that compares the visitor's owned MDs against a project's
// requirements and produces a single `CompatibilityReport` for the
// /projects/[id] surface. Deterministic (same input → same output) so
// the section can render server-side and SSR-snapshot remains stable.
//
// The report is *advisory* — its purpose is not to gate apply but to
// reduce mismatch friction during human onboarding (Pre-Check).

import type { Rank } from "@/types";
import type { OwnedMd } from "@/lib/matching";
import { computeMatchingScore } from "@/lib/matching";
import type { GitHubSignals } from "@/lib/grading";
import type { Project, ProjectRequiredMd } from "@/lib/projects";
import { pickBestFitMd } from "@/lib/md-pickfit";

const RANK_SCORE: Record<Rank, number> = { S: 3, A: 2, B: 1, D: 0 };

export interface CompatibilityReport {
  /** 0-100 — same percentage as the existing matching-score pillar. */
  percent: number;
  /** Number of requirements satisfied by the picked MD. */
  matched: number;
  /** Total number of requirements. */
  total: number;
  /** Plain-text personalised line shown above the supporting pills. */
  contextSentence: string;
  /** Pretty "md_id (Rank)" labels for satisfied requirements. */
  fulfilled: string[];
  /** Bare md ids for missing requirements. */
  unfulfilled: string[];
  /** Optional bonus signal — e.g. "あなたの GitHub 活動が直近 +18 commits". */
  bonus?: string;
}

export interface CompatibilityInput {
  ownedMds: ReadonlyArray<OwnedMd>;
  project: Project;
  /**
   * Optional GitHub signals. When provided with `commitCount`, a bonus
   * line is emitted if the count crosses 10 within the recent window.
   */
  githubSignals?: GitHubSignals;
}

const NO_MATCH_SENTENCE =
  "現状、十分な親和性は確認できません。MD を増やすか、関連トピックの登記を進めてください。";

function ownedSatisfies(owned: OwnedMd | undefined, req: ProjectRequiredMd): boolean {
  if (!owned) return false;
  return RANK_SCORE[owned.rank] >= RANK_SCORE[req.rankMin];
}

/**
 * Returns the human-readable label for the strongest requirement that
 * the user's pre-selected MD covers, or null when nothing matches.
 *
 * "Strongest" = highest weight, ties broken by label sort to keep the
 * sentence deterministic.
 */
export function pickTopMatchTag(
  ownedMds: ReadonlyArray<OwnedMd>,
  project: Project,
): string | null {
  const pre = pickBestFitMd(ownedMds, project);
  if (!pre.mdId) return null;
  const owned = ownedMds.find((m) => m.id === pre.mdId);
  if (!owned) return null;
  const matches = project.requiredMdInterfaces
    .filter((req) => req.id === owned.id && ownedSatisfies(owned, req))
    .sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label));
  return matches[0]?.label ?? null;
}

export function buildCompatibilityReport(
  input: CompatibilityInput,
): CompatibilityReport {
  const { ownedMds, project, githubSignals } = input;
  // computeMatchingScore expects a mutable array; the readonly contract
  // only governs the function boundary so a shallow copy is fine.
  const matching = computeMatchingScore([...ownedMds], project);

  const topTag = pickTopMatchTag(ownedMds, project);
  const contextSentence = topTag
    ? `あなたの知能（MD）はこのプロジェクトの「${topTag}」と高い親和性があります`
    : NO_MATCH_SENTENCE;

  const fulfilled = matching.matchDetails
    .filter((d) => d.matched && d.ownedRank)
    .map((d) => `${d.req.id}(${d.ownedRank})`);
  const unfulfilled = matching.missingMds.map((m) => m.id);

  let bonus: string | undefined;
  if (githubSignals?.recentActivity && (githubSignals.commitCount ?? 0) >= 10) {
    bonus = `あなたの GitHub 活動が直近 +${githubSignals.commitCount} commits`;
  }

  return {
    percent: matching.score,
    matched: matching.matchedReqs,
    total: matching.totalReqs,
    contextSentence,
    fulfilled,
    unfulfilled,
    bonus,
  };
}

export const COMPATIBILITY_NO_MATCH_SENTENCE = NO_MATCH_SENTENCE;
