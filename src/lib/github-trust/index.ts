// GitHub Trust Sync — deterministic mock star/contribution scoring

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function lcg(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

export interface GithubTrust {
  handle: string;
  stars: number;
  contributions12mo: number;
  repos: number;
  score: number;         // 0-100 composite
  verified: boolean;     // score >= 30
}

export function getGithubTrust(handle: string): GithubTrust {
  let seed = djb2(handle + "github");
  seed = lcg(seed);
  const stars = (seed % 5000);
  seed = lcg(seed);
  const contributions12mo = (seed % 800);
  seed = lcg(seed);
  const repos = 1 + (seed % 80);

  // Composite: 50% stars (capped at 1000), 30% contributions (capped at 400), 20% repos (capped at 50)
  const starNorm = Math.min(stars, 1000) / 1000;
  const contribNorm = Math.min(contributions12mo, 400) / 400;
  const repoNorm = Math.min(repos, 50) / 50;
  const score = Math.round((0.5 * starNorm + 0.3 * contribNorm + 0.2 * repoNorm) * 100);

  return {
    handle,
    stars,
    contributions12mo,
    repos,
    score,
    verified: score >= 30,
  };
}

/** Returns true when the handle should show an "unverified" flag on their MDs */
export function isUnverified(handle: string): boolean {
  return !getGithubTrust(handle).verified;
}
