// v1 dimension: AI parse 容易性
// AI が機械的に読み込んで構造化できるか
//
// 計測シグナル:
// - 見出し階層の整合性
// - 用語ゆらぎ率
// - コピペ可能ブロック数（コード / JSON / コマンド）
// - 要約セクション（最初の段落で全体像）

import type { DimensionScore } from "./types";

interface HeadingInfo { level: number; text: string; }

function parseHeadings(md: string): HeadingInfo[] {
  const lines = md.split("\n");
  const result: HeadingInfo[] = [];
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.+)$/.exec(line);
    if (m) result.push({ level: m[1].length, text: m[2].trim() });
  }
  return result;
}

function isHierarchyConsistent(headings: HeadingInfo[]): boolean {
  // Heading levels should not jump (H1 → H3 without H2)
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level > headings[i - 1].level + 1) return false;
  }
  return true;
}

function detectTermVariations(md: string): { totalTerms: number; varyingTerms: number; ratio: number } {
  // Heuristic: detect alphanumeric terms that appear in 3+ different casings/spacings
  const candidates: Map<string, Set<string>> = new Map();
  // Match Japanese-prefixed terms like "API キー" / "APIキー" / "API キー"
  const tokens = md.match(/[A-Za-z][A-Za-z0-9]+(?:[\s　-]?[A-Za-zぁ-んァ-ヴー一-龯]+)?/g) || [];

  for (const token of tokens) {
    const normalized = token.toLowerCase().replace(/[\s　-]/g, "");
    if (normalized.length < 3) continue;
    if (!candidates.has(normalized)) candidates.set(normalized, new Set());
    candidates.get(normalized)!.add(token);
  }

  let varyingTerms = 0;
  for (const [, variations] of candidates) {
    if (variations.size >= 2) varyingTerms++;
  }
  const totalTerms = candidates.size;
  return {
    totalTerms,
    varyingTerms,
    ratio: totalTerms === 0 ? 0 : varyingTerms / totalTerms,
  };
}

export function computeParseReadability(md: string): DimensionScore {
  const headings = parseHeadings(md);
  const hierarchyOk = isHierarchyConsistent(headings);

  // Signal 1: heading structure
  const headingCount = headings.length;
  const headingScore = headingCount === 0
    ? 0
    : (hierarchyOk ? Math.min(25, headingCount * 4) : Math.min(15, headingCount * 2));

  // Signal 2: copyable blocks
  const codeBlocks = (md.match(/```[\s\S]*?```/g) || []).length;
  const tables = (md.match(/^\|.*\|.*\|$/gm) || []).length;
  const lists = (md.match(/^\s*[-*]\s+/gm) || []).length;
  const blocksScore = Math.min(30, codeBlocks * 5 + Math.min(10, tables) + Math.min(10, lists / 3));

  // Signal 3: term variation (lower variation = better parse)
  const termInfo = detectTermVariations(md);
  const termPenalty = Math.min(20, termInfo.ratio * 100);

  // Signal 4: summary at top (first paragraph length & content)
  const firstParagraph = md.split(/\n{2,}/)[0] || "";
  const hasSummary = firstParagraph.length > 80 && firstParagraph.length < 600
    && !firstParagraph.startsWith("#");
  const summaryBonus = hasSummary ? 15 : 0;

  // Signal 5: line length / formatting consistency
  const lines = md.split("\n");
  const avgLineLength = lines.reduce((sum, l) => sum + l.length, 0) / Math.max(1, lines.length);
  const formatBonus = avgLineLength > 30 && avgLineLength < 200 ? 10 : 0;

  const baseScore = 30;
  const score = Math.max(0, Math.min(100,
    baseScore + headingScore + blocksScore + summaryBonus + formatBonus - termPenalty
  ));

  return {
    score: Math.round(score),
    signals: {
      heading_count: headingCount,
      hierarchy_consistent: hierarchyOk,
      code_blocks: codeBlocks,
      tables: tables,
      list_items: lists,
      term_variation_ratio: Number(termInfo.ratio.toFixed(3)),
      term_total: termInfo.totalTerms,
      term_varying: termInfo.varyingTerms,
      has_summary_paragraph: hasSummary,
      avg_line_length: Math.round(avgLineLength),
    },
  };
}
