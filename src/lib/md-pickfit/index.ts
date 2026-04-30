// GUILD AI — AI Pre-select for Plug-in Apply
//
// Given a portfolio of owned MDs and a project, surface the single MD
// that should be used to apply by default. Mercari-style "no-input" UX:
// the user confirms, they don't choose.
//
// Tie-break order:
//   1. Largest set of project requirements covered.
//   2. Highest aggregate rank score across covered requirements.
//   3. Lexicographic MD id  (deterministic, stable across renders).

import type { Rank } from "@/types";
import type { OwnedMd } from "@/lib/matching";
import type { Project } from "@/lib/projects";

const RANK_SCORE: Record<Rank, number> = { S: 3, A: 2, B: 1, D: 0 };

export interface PickFitResult {
  /** The pre-selected MD id, or null when the portfolio is empty. */
  mdId: string | null;
  /** Number of project requirements this MD satisfies (0–N). */
  coveredReqs: number;
  /** Total rank score of this MD against satisfied requirements. */
  rankScore: number;
  /** Plain-text reason a UI can show ("自動でおすすめを選択しました"). */
  reason: string;
}

export function pickBestFitMd(
  ownedMds: ReadonlyArray<OwnedMd>,
  project: Pick<Project, "requiredMdInterfaces">,
): PickFitResult {
  if (ownedMds.length === 0) {
    return { mdId: null, coveredReqs: 0, rankScore: 0, reason: "保有 MD がありません" };
  }

  const reqs = project.requiredMdInterfaces;

  let best: { md: OwnedMd; covered: number; score: number } | null = null;

  for (const md of [...ownedMds].sort((a, b) => a.id.localeCompare(b.id))) {
    let covered = 0;
    let score = 0;
    for (const req of reqs) {
      if (req.id === md.id && RANK_SCORE[md.rank] >= RANK_SCORE[req.rankMin]) {
        covered++;
        score += req.weight * RANK_SCORE[md.rank];
      }
    }

    if (
      !best ||
      covered > best.covered ||
      (covered === best.covered && score > best.score) ||
      (covered === best.covered && score === best.score && RANK_SCORE[md.rank] > RANK_SCORE[best.md.rank])
    ) {
      best = { md, covered, score };
    }
  }

  // No requirement matched — fall back to the highest-rank MD overall (still
  // deterministic via stable id sort).
  if (best === null || best.covered === 0) {
    const fallback = [...ownedMds].sort(
      (a, b) =>
        RANK_SCORE[b.rank] - RANK_SCORE[a.rank] || a.id.localeCompare(b.id),
    )[0];
    return {
      mdId: fallback.id,
      coveredReqs: 0,
      rankScore: 0,
      reason: "完全一致なし — ランク最上位を選択",
    };
  }

  return {
    mdId: best.md.id,
    coveredReqs: best.covered,
    rankScore: best.score,
    reason: `自動でおすすめを選択しました — ${best.covered} 件の要件に合致`,
  };
}
