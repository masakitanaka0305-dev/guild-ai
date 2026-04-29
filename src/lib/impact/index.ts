import { getMyAssets } from "@/lib/portfolio";
import { getComplexityBreakdown } from "@/lib/complexity-score";

export interface ImpactStats {
  savedProjects: number;
  contributionScore: number;
  ranks: {
    thisMonth: number;
    allTime: number;
  };
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

export function getImpactStats(handle: string): ImpactStats {
  const assets = getMyAssets();
  const cx = getComplexityBreakdown(handle);

  const totalCalls = assets.reduce((s, a) => s + a.callsLast30, 0);
  const activeCount = assets.filter((a) => a.status === "active").length;

  const savedProjects = Math.floor(totalCalls / 55);
  const contributionScore = activeCount * 1_000 + cx.score * 38;

  const seed = djb2(handle + "_rank");
  const thisMonth = 10 + (seed % 40);
  const allTime = 200 + (seed % 200);

  return {
    savedProjects,
    contributionScore,
    ranks: { thisMonth, allTime },
  };
}
