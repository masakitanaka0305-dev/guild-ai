function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface ComplexityBreakdown {
  score: number;
  jobsCompleted: number;
  avgCcafDensity: number;
  label: string;
}

export function computeComplexityScore(handle: string): number {
  const seed = djb2(handle + "_complexity");
  return Math.min(100, 40 + (seed % 51));
}

export function getComplexityBreakdown(handle: string): ComplexityBreakdown {
  const score = computeComplexityScore(handle);
  const seed  = djb2(handle + "_jobs");
  const jobsCompleted  = 15 + (seed % 86);
  const avgCcafDensity = 60 + (djb2(handle + "_ccaf") % 31);
  const label =
    score >= 80 ? "エキスパート" :
    score >= 60 ? "アドバンスト" :
    "スタンダード";
  return { score, jobsCompleted, avgCcafDensity, label };
}
