// v1 dimension: オリジナリティ
// 一般的 LLM の事前学習で到達できない情報か
//
// 計測シグナル:
// - 一般論フレーズの比率（"〜は重要です" "〜することが大切" 等）
// - 固有数値 / 制約 / プロジェクト依存情報の出現密度
// - 失敗体験 / インシデントレポート 構造の有無
// - 内部出典（commit hash, 内部 URL, 自社ログ等）の有無

import type { DimensionScore } from "./types";

const GENERIC_PATTERNS = [
  /は重要です/g,
  /することが大切/g,
  /best practice/gi,
  /should be noted/gi,
  /it is important to/gi,
  /generally speaking/gi,
  /一般的に/g,
  /通常は/g,
  /基本的には/g,
];

const SPECIFIC_PATTERNS = [
  /\b\d{1,3}(?:,\d{3})+(?:\s*(?:ms|秒|円|USD|req\/s|tps|rps))?\b/g,  // numerics with units
  /\b[a-f0-9]{7,40}\b/g,                                            // commit-hash-like
  /version\s+\d+/gi,
  /\bv\d+\.\d+\.\d+\b/g,
  /https?:\/\/(?:github|gitlab|bitbucket)\.com\/[\w-]+\/[\w-]+/g,
  /api\.[\w.-]+\.com/g,
];

const FAILURE_KEYWORDS = [
  "failed", "error", "incident", "post-mortem", "regression",
  "失敗", "障害", "事故", "ミス", "罠", "落とし穴", "アンチパターン",
];

const INTERNAL_HINTS = [
  /commit\s+[a-f0-9]{7,}/gi,
  /PR\s*#?\d+/gi,
  /internal[\s-]?(?:doc|wiki|confluence)/gi,
  /社内/g,
  /\.guild\//g,
];

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, p) => acc + (text.match(p)?.length ?? 0), 0);
}

export function computeOriginality(md: string): DimensionScore {
  const wordCount = md.split(/\s+/).length || 1;
  const length = md.length;

  const genericHits = countMatches(md, GENERIC_PATTERNS);
  const specificHits = countMatches(md, SPECIFIC_PATTERNS);
  const failureHits = FAILURE_KEYWORDS.reduce((acc, k) => acc + (md.match(new RegExp(k, "gi"))?.length ?? 0), 0);
  const internalHits = countMatches(md, INTERNAL_HINTS);

  const genericRatio = genericHits / wordCount;       // higher = bad
  const specificDensity = specificHits / Math.max(1, wordCount / 50); // per 50 words
  const failureDensity = failureHits / Math.max(1, wordCount / 100);

  const baseScore = 50;
  const genericPenalty = Math.min(40, genericRatio * 500);    // strong penalty
  const specificBonus = Math.min(35, specificDensity * 8);
  const failureBonus = Math.min(15, failureDensity * 4);
  const internalBonus = Math.min(15, internalHits * 3);

  const score = Math.max(0, Math.min(100,
    baseScore - genericPenalty + specificBonus + failureBonus + internalBonus
  ));

  return {
    score: Math.round(score),
    signals: {
      generic_phrase_ratio: Number(genericRatio.toFixed(4)),
      specific_density_per_50w: Number(specificDensity.toFixed(2)),
      failure_keyword_density: Number(failureDensity.toFixed(2)),
      internal_source_hints: internalHits,
      length_chars: length,
    },
  };
}
