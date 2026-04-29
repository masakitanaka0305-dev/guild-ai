// Originality Watch — plagiarism screening, freeze, royalty redirect

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

export type OriginalityVerdict = "ok" | "review" | "plagiarism";

export interface SimilarityMatch {
  guildId: string;
  similarity: number;  // 0..1
  titleHint: string;
}

export interface ScreeningResult {
  flagged: boolean;
  topMatches: SimilarityMatch[];
  verdict: OriginalityVerdict;
}

export interface FrozenAccount {
  handle: string;
  frozenAt: string;
  reason: string;
}

export interface RoyaltyRedirect {
  fromGuildId: string;
  toCreatorHandle: string;
  redirectedAt: string;
}

// ─── In-memory stores ─────────────────────────────────────────────────────────

const _frozenAccounts = new Map<string, FrozenAccount>();
const _royaltyRedirects = new Map<string, RoyaltyRedirect>();

// ─── Similarity computation (mock n-gram shingling) ───────────────────────────

export function computeSimilarity(newMd: string, existingMd: string): number {
  if (!newMd || !existingMd) return 0;
  // Deterministic: hash-based pseudo cosine similarity
  const hashA = djb2(newMd.trim().toLowerCase());
  const hashB = djb2(existingMd.trim().toLowerCase());
  // Normalized overlap: XOR distance → similarity
  const xorDist = (hashA ^ hashB) >>> 0;
  const maxUint32 = 0xffffffff;
  return 1 - xorDist / maxUint32;
}

// ─── Screening ────────────────────────────────────────────────────────────────

export interface ExistingAsset {
  guildId: string;
  title: string;
  mdContent: string;
}

export function screenSubmission(
  newMd: string,
  existingPool: ExistingAsset[],
): ScreeningResult {
  const matches: SimilarityMatch[] = existingPool
    .map((a) => ({
      guildId: a.guildId,
      similarity: computeSimilarity(newMd, a.mdContent),
      titleHint: a.title,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  const topSimilarity = matches[0]?.similarity ?? 0;

  let verdict: OriginalityVerdict;
  if (topSimilarity >= 0.85) {
    verdict = "plagiarism";
  } else if (topSimilarity >= 0.7) {
    verdict = "review";
  } else {
    verdict = "ok";
  }

  return {
    flagged: verdict !== "ok",
    topMatches: matches,
    verdict,
  };
}

// ─── Freeze & Redirect ────────────────────────────────────────────────────────

export function freezeAccount(handle: string, reason: string): FrozenAccount {
  const record: FrozenAccount = {
    handle,
    frozenAt: new Date().toISOString(),
    reason,
  };
  _frozenAccounts.set(handle, record);
  return record;
}

export function isAccountFrozen(handle: string): boolean {
  return _frozenAccounts.has(handle);
}

export function redirectFutureRoyalty(
  fromGuildId: string,
  toCreatorHandle: string,
): RoyaltyRedirect {
  const record: RoyaltyRedirect = {
    fromGuildId,
    toCreatorHandle,
    redirectedAt: new Date().toISOString(),
  };
  _royaltyRedirects.set(fromGuildId, record);
  return record;
}

export function getRoyaltyRedirect(guildId: string): RoyaltyRedirect | null {
  return _royaltyRedirects.get(guildId) ?? null;
}

// ─── Test helper ──────────────────────────────────────────────────────────────

export function _resetOriginalityWatch(): void {
  _frozenAccounts.clear();
  _royaltyRedirects.clear();
}
