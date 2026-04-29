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
  if (score >= 50) return "もう少し";
  return "これから";
}

export function fitColor(score: number): string {
  if (score >= 80) return "text-[var(--n-positive,#0E9F4F)]";
  if (score >= 50) return "text-[var(--n-gold,#D4AF37)]";
  return "text-[var(--n-muted,#6B6456)]";
}
