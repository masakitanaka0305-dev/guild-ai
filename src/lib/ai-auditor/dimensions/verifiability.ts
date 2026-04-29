// v1 dimension: 検証可能性
// 主張が後から検証できるか
//
// 計測シグナル:
// - 出典 URL / リポジトリ / commit hash / version の有無
// - 再現手順（コマンド・コードブロック）
// - 実測値（数値 + 単位）の頻度
// - 反証可能な記述形式（"X は Y より速い (測定: …)"）

import type { DimensionScore } from "./types";

const SOURCE_PATTERNS = [
  /https?:\/\/[\w./-]+/g,
  /\b[a-f0-9]{7,40}\b/g,                              // commit hash
  /PR\s*#?\d+/gi,
  /issue\s*#?\d+/gi,
  /version\s+\d+/gi,
  /\bv\d+\.\d+(?:\.\d+)?\b/g,
  /参考:\s*\S+/g,
  /出典:\s*\S+/g,
];

const REPRODUCTION_PATTERNS = [
  /^\s*\$\s+\S+/gm,                                   // shell prompts
  /```[\s\S]*?```/g,                                  // code blocks
  /手順\s*\d+/g,
  /step\s*\d+/gi,
];

const MEASUREMENT_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:ms|秒|分|時間|MB|GB|KB|req\/s|rps|tps|%|円|USD|EUR|JPY)\b/gi,
  /(?:平均|median|avg|p\d+).{0,20}\d+/gi,
  /(?:before|after).{0,30}\d+/gi,
  /(?:before|after|改善前|改善後).{0,30}\d+/gi,
];

const FALSIFIABLE_PATTERNS = [
  /\d+\s*(?:倍|times)\s+(?:速い|遅い|fast|slow)/gi,
  /\(?測定[:：]\s*\S+\)?/g,
  /\(?ベンチマーク[:：]\s*\S+\)?/g,
];

function countAll(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, p) => acc + (text.match(p)?.length ?? 0), 0);
}

export function computeVerifiability(md: string): DimensionScore {
  const sourceCount = countAll(md, SOURCE_PATTERNS);
  const reproCount = countAll(md, REPRODUCTION_PATTERNS);
  const measureCount = countAll(md, MEASUREMENT_PATTERNS);
  const falsifiableCount = countAll(md, FALSIFIABLE_PATTERNS);

  const sourceBonus = Math.min(35, sourceCount * 5);
  const reproBonus = Math.min(30, reproCount * 5);
  const measureBonus = Math.min(25, measureCount * 4);
  const falsifiableBonus = Math.min(15, falsifiableCount * 5);

  const baseScore = 25;
  const score = Math.max(0, Math.min(100,
    baseScore + sourceBonus + reproBonus + measureBonus + falsifiableBonus
  ));

  return {
    score: Math.round(score),
    signals: {
      source_references: sourceCount,
      reproduction_blocks: reproCount,
      measurement_values: measureCount,
      falsifiable_claims: falsifiableCount,
    },
  };
}
