// GUILD AI — Competitor Stats
// Deterministic anonymised competition data per project.

import type { Rank } from "@/types";

export interface CompetitionStats {
  totalApplicants: number;
  byRank: Record<"S" | "A" | "B", number>;
  leadingRank: "S" | "A" | "B";
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Returns deterministic competition breakdown for a project.
 * Distribution is seeded from projectId so it never changes between renders.
 */
export function getCompetition(projectId: string, totalApplicants: number): CompetitionStats {
  const seed = djb2(projectId);

  // Distribute applicants across ranks deterministically.
  // Clamp every count to ≥ 0 — totalApplicants may be smaller than the
  // seeded sCount + aCount, in which case bCount would otherwise go negative.
  const sCount = Math.max(0, Math.min(totalApplicants, 1 + (seed % 5)));
  const aCount = Math.max(0, Math.min(totalApplicants - sCount, 3 + ((seed >> 4) % 10)));
  const bCount = Math.max(0, totalApplicants - sCount - aCount);

  const byRank: Record<"S" | "A" | "B", number> = {
    S: Math.max(0, sCount),
    A: Math.max(0, aCount),
    B: Math.max(0, bCount),
  };

  const leadingRank: "S" | "A" | "B" = byRank.S > 0 ? "S" : byRank.A > 0 ? "A" : "B";

  return { totalApplicants, byRank, leadingRank };
}

export const RANK_COLOR: Record<"S" | "A" | "B", string> = {
  S: "#4C1D95",
  A: "#F59E0B",
  B: "#3B82F6",
};
