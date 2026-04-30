// Citation Payout — 10% of revenue to original creator when their MD is cited/derived

export interface CitationPayoutResult {
  citingId: string;
  ancestorId: string | null;   // nearest ancestor (single-hop)
  totalMilliJpy: number;
  ancestorShare: number;       // 10% of total (milli-JPY)
  creatorShare: number;        // 90% → goes to royalty-protocol flow
}

/**
 * When a citing MD is used, distribute 10% of revenue to its nearest ancestor.
 * If no ancestors, creator keeps 100%.
 *
 * @param citingId    - GUILD-ID of the MD being used
 * @param citedAncestors - lineage ancestors ordered nearest-first
 * @param totalMilliJpy  - total revenue in milli-JPY (integer)
 */
export function payOnCitation(
  citingId: string,
  citedAncestors: string[],
  totalMilliJpy: number,
): CitationPayoutResult {
  if (citedAncestors.length === 0) {
    return {
      citingId,
      ancestorId: null,
      totalMilliJpy,
      ancestorShare: 0,
      creatorShare: totalMilliJpy,
    };
  }

  const nearestAncestor = citedAncestors[0];
  const ancestorShare = Math.floor(totalMilliJpy * 0.1);
  const creatorShare = totalMilliJpy - ancestorShare;

  return {
    citingId,
    ancestorId: nearestAncestor,
    totalMilliJpy,
    ancestorShare,
    creatorShare,
  };
}

/** Format milli-JPY as readable JPY string */
export function formatMilliJpy(milliJpy: number): string {
  const jpy = milliJpy / 1000;
  return `¥${jpy.toFixed(jpy < 1 ? 3 : 1)}`;
}
