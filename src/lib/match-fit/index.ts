/**
 * computeFit — determines how well a user's owned recipes match a job's requirements.
 * Returns 0-100 integer.
 */
export function computeFit(jobId: string, ownedRecipeIds: string[]): number {
  if (ownedRecipeIds.length === 0) return 0;
  // Deterministic seed from jobId so same job always shows same baseline
  const seed = jobId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseMatch = (seed % 40) + 30; // 30–69 baseline
  const recipeBonus = Math.min(30, ownedRecipeIds.length * 8);
  return Math.min(100, baseMatch + recipeBonus);
}

export function fitLabel(score: number): string {
  if (score >= 80) return "ぴったり";
  if (score >= 60) return "いいかんじ";
  if (score >= 40) return "もう一歩";
  return "準備中";
}

export function fitColor(score: number): string {
  if (score >= 80) return "text-[#4DD08F]";
  if (score >= 60) return "text-[#D4AF37]";
  return "text-[#9FB1C8]";
}
