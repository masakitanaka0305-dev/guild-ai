// v1 dimension: 情報密度
// 単位トークンあたりの新規情報量（重複排除後）
//
// 計測シグナル:
// - 段落間 Jaccard 類似度（高いほど冗長）
// - 接続詞・前置きフレーズ比率
// - 結論先出し度（最初の 200 文字に core 用語が出るか）
// - 固有名詞 / 数値 / 固有手順 出現密度

import type { DimensionScore } from "./types";

const FILLER_PHRASES = [
  "さて", "ところで", "まず最初に", "それでは", "つまり",
  "ということで", "なお", "ちなみに", "もちろん", "とはいえ",
  "as you know", "in short", "to be clear", "as we discussed",
];

const CONJUNCTIONS = ["しかし", "そして", "また", "さらに", "つまり", "ですので", "したがって"];

function jaccardSim(a: string, b: string): number {
  const aw = new Set(a.split(/\s+/).filter((w) => w.length > 1));
  const bw = new Set(b.split(/\s+/).filter((w) => w.length > 1));
  const inter = [...aw].filter((w) => bw.has(w));
  const union = new Set([...aw, ...bw]);
  return union.size === 0 ? 0 : inter.length / union.size;
}

function avgPairwiseJaccard(paragraphs: string[]): number {
  if (paragraphs.length < 2) return 0;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    for (let j = i + 1; j < paragraphs.length; j++) {
      total += jaccardSim(paragraphs[i], paragraphs[j]);
      pairs++;
    }
  }
  return pairs === 0 ? 0 : total / pairs;
}

export function computeInformationDensity(md: string): DimensionScore {
  const paragraphs = md.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (paragraphs.length === 0) {
    return { score: 0, signals: { reason: "empty document" } };
  }

  // Signal 1: paragraph redundancy (lower is better)
  const avgJaccard = avgPairwiseJaccard(paragraphs);
  const redundancyPenalty = Math.min(40, avgJaccard * 100); // up to -40

  // Signal 2: filler phrase ratio
  const wordCount = md.split(/\s+/).length || 1;
  const fillerCount = FILLER_PHRASES.reduce((acc, p) => acc + (md.match(new RegExp(p, "g"))?.length ?? 0), 0);
  const fillerRatio = fillerCount / wordCount;
  const fillerPenalty = Math.min(20, fillerRatio * 100); // up to -20

  // Signal 3: conjunction-only paragraphs
  const connOnly = paragraphs.filter((p) => CONJUNCTIONS.some((c) => p.startsWith(c)) && p.length < 80).length;
  const connPenalty = Math.min(10, connOnly * 2);

  // Signal 4: numerics + proper nouns density (heuristic)
  const numericMatches = (md.match(/\b\d+(?:[.,]\d+)?\b/g) || []).length;
  const codeBlocks = (md.match(/```[\s\S]*?```/g) || []).length;
  const densityBonus = Math.min(20, numericMatches * 0.5 + codeBlocks * 3);

  // Signal 5: 結論先出し — first 200 chars share words with later ones
  const head = md.slice(0, 200);
  const tail = md.slice(200, 1000);
  const leadSim = head && tail ? jaccardSim(head, tail) : 0;
  const leadBonus = Math.min(10, leadSim * 30);

  const baseScore = 70;
  const score = Math.max(0, Math.min(100,
    baseScore - redundancyPenalty - fillerPenalty - connPenalty + densityBonus + leadBonus
  ));

  return {
    score: Math.round(score),
    signals: {
      avg_paragraph_jaccard: Number(avgJaccard.toFixed(3)),
      filler_ratio: Number(fillerRatio.toFixed(4)),
      conjunction_only_paragraphs: connOnly,
      numeric_count: numericMatches,
      code_blocks: codeBlocks,
      lead_continuity: Number(leadSim.toFixed(3)),
    },
  };
}
