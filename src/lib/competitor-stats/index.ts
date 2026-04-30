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

  // Distribute applicants across ranks deterministically
  const sCount = 1 + (seed % 5);               // 1-5
  const aCount = 3 + ((seed >> 4) % 10);        // 3-12
  const bCount = Math.max(0, totalApplicants - sCount - aCount);

  const byRank: Record<"S" | "A" | "B", number> = {
    S: sCount,
    A: aCount,
    B: bCount,
  };

  const leadingRank: "S" | "A" | "B" = sCount > 0 ? "S" : aCount > 0 ? "A" : "B";

  return { totalApplicants, byRank, leadingRank };
}

export const RANK_COLOR: Record<"S" | "A" | "B", string> = {
  S: "#E64545",
  A: "#F59E0B",
  B: "#3B82F6",
};
