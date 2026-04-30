// GUILD AI — Context Depth (コンテキスト深度)
// Evaluates how context-rich an MD file is on 6 dimensions.
// Returns a score 0–6 used to gate S rank in ai-auditor.
// All evaluation is keyword-dictionary based (deterministic, no LLM).

export interface ContextCriterion {
  label: string;
  met: boolean;
}

export interface ContextDepthResult {
  score: number; // 0–6
  criteria: ContextCriterion[];
}

const CRITERIA_DEFS: { label: string; keywords: string[] }[] = [
  {
    label: "実装意図の明文化（why）",
    keywords: [
      "なぜ", "理由", "目的", "意図", "動機", "背景",
      "because", "why", "purpose", "rationale", "motivation", "reason",
    ],
  },
  {
    label: "制約条件の列挙",
    keywords: [
      "制約", "条件", "前提", "要件", "制限",
      "constraint", "limitation", "requirement", "assumption", "prerequisite",
    ],
  },
  {
    label: "非自明な分岐・落とし穴",
    keywords: [
      "落とし穴", "注意", "警告", "非自明", "バグ", "失敗例",
      "gotcha", "caveat", "pitfall", "footgun", "edge case", "trap", "watch out",
    ],
  },
  {
    label: "パフォーマンス／コスト議論",
    keywords: [
      "パフォーマンス", "速度", "コスト", "計算量",
      "o(", "latency", "throughput", "performance", "optimize", "memory", "bottleneck",
    ],
  },
  {
    label: "検証手順／テストの記述",
    keywords: [
      "テスト", "検証", "確認", "サンプル",
      "example", "test", "verify", "validate", "assert", "spec", "expect(",
    ],
  },
  {
    label: "失敗時の挙動／フォールバック",
    keywords: [
      "失敗時", "エラー時", "フォールバック", "リトライ",
      "fallback", "retry", "error handling", "on failure", "recover", "catch",
    ],
  },
];

/**
 * Computes context depth of an MD string.
 * @returns score 0–6 and per-criterion results.
 * Deterministic: same input always produces the same output.
 */
export function computeContextDepth(md: string): ContextDepthResult {
  const lower = md.toLowerCase();
  const criteria: ContextCriterion[] = CRITERIA_DEFS.map((def) => ({
    label: def.label,
    met: def.keywords.some((k) => lower.includes(k)),
  }));
  return { score: criteria.filter((c) => c.met).length, criteria };
}

// S rank requires at least this many context criteria met
export const S_RANK_CONTEXT_DEPTH_MIN = 4;
