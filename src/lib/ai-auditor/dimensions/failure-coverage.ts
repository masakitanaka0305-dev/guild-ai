// v1 dimension: 失敗例被覆
// 反例・エッジケース・落とし穴の記述量
//
// 計測シグナル:
// - 失敗系キーワード密度
// - 症状 → 原因 → 対処 の triple 出現
// - 条件分岐の場合分け頻度（"X の場合は…"）
// - "成功例のみ" 検出 → 減点

import type { DimensionScore } from "./types";

const FAILURE_KEYWORDS = [
  /失敗/g, /エラー/g, /落とし穴/g, /罠/g, /アンチパターン/g,
  /気をつけ/g, /注意/g, /避ける/g, /誤り/g, /バグ/g, /不具合/g,
  /failure/gi, /pitfall/gi, /gotcha/gi, /caveat/gi, /anti-?pattern/gi,
  /mistake/gi, /\bbug\b/gi,
];

const SYMPTOM_CAUSE_FIX_HINTS = [
  /症状[\s\S]{0,150}原因/g,
  /原因[\s\S]{0,150}対処/g,
  /問題[\s\S]{0,150}解決/g,
  /symptom[\s\S]{0,150}cause/gi,
  /cause[\s\S]{0,150}fix/gi,
];

const CONDITIONAL_PATTERNS = [
  /の場合は/g,
  /の場合に/g,
  /のとき/g,
  /であれば/g,
  /\bif\s+\w+/gi,
  /\bwhen\s+\w+/gi,
  /\bunless\s+\w+/gi,
];

const SUCCESS_ONLY_HINTS = [
  /成功し?ました/g,
  /うまくいきました/g,
  /正常動作/g,
  /works (?:fine|well|great)/gi,
];

function countAll(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, p) => acc + (text.match(p)?.length ?? 0), 0);
}

export function computeFailureCoverage(md: string): DimensionScore {
  const wordCount = md.split(/\s+/).length || 1;

  const failureCount = countAll(md, FAILURE_KEYWORDS);
  const tripleCount = countAll(md, SYMPTOM_CAUSE_FIX_HINTS);
  const conditionalCount = countAll(md, CONDITIONAL_PATTERNS);
  const successOnlyCount = countAll(md, SUCCESS_ONLY_HINTS);

  const failureDensity = failureCount / Math.max(1, wordCount / 100);
  const conditionalDensity = conditionalCount / Math.max(1, wordCount / 100);

  // Triples are highly valuable — explicit symptom→cause→fix pattern
  const tripleBonus = Math.min(35, tripleCount * 10);
  const failureBonus = Math.min(40, failureDensity * 6);
  const conditionalBonus = Math.min(20, conditionalDensity * 3);

  // Success-only penalty: if there are LOTS of success mentions but few failures
  const successOnlyPenalty = failureCount === 0 ? Math.min(25, successOnlyCount * 5) : 0;

  const baseScore = 30;
  const score = Math.max(0, Math.min(100,
    baseScore + tripleBonus + failureBonus + conditionalBonus - successOnlyPenalty
  ));

  return {
    score: Math.round(score),
    signals: {
      failure_keyword_count: failureCount,
      symptom_cause_fix_triples: tripleCount,
      conditional_branches: conditionalCount,
      success_only_mentions: successOnlyCount,
      failure_density_per_100w: Number(failureDensity.toFixed(2)),
    },
  };
}
