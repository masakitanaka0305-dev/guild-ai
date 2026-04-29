// Differential Insight Tagging — deterministic mock

export type DeltaIntensity = "high" | "medium" | "low";

export interface DeltaTag {
  tag: string;       // machine key
  label: string;     // display label
  tooltip: string;   // "現場で得た学び" etc.
  intensity: DeltaIntensity;
}

export interface DeltaCompare {
  generic: {
    points: string[];
  };
  pro: {
    points: string[];
    differentiators: DeltaTag[];
    valueDeltaPct: number; // mock % improvement over generic
  };
}

// ─── Deterministic helpers ────────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function lcg(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

// ─── Tag pool ─────────────────────────────────────────────────────────────────

const ALL_TAGS: DeltaTag[] = [
  { tag: "error-handling",  label: "現場のエラー対処",   tooltip: "本番で実際に遭遇したエラーへの対処パターン", intensity: "high" },
  { tag: "regulation",      label: "業界規制への適合",   tooltip: "特定業界の法規制に準拠した実装判断", intensity: "high" },
  { tag: "cost-opt",        label: "コスト最適化",       tooltip: "実運用で削減したインフラ・API コスト実績", intensity: "medium" },
  { tag: "anonymize",       label: "データ匿名化",       tooltip: "個人情報保護に対応した前処理手順", intensity: "high" },
  { tag: "audit-log",       label: "監査ログ",           tooltip: "コンプライアンスに対応した操作ログ設計", intensity: "medium" },
  { tag: "edge-cases",      label: "エッジケース対応",   tooltip: "汎用 AI が見落とす特殊ケースを網羅", intensity: "medium" },
  { tag: "performance",     label: "パフォーマンス調整", tooltip: "大量データ処理での実績ベースの最適化", intensity: "low" },
];

const GENERIC_TEMPLATES = [
  "一般的な入力をテキスト形式で受け取り処理します",
  "標準的なアルゴリズムを用いて変換・抽出を行います",
  "結果を JSON 形式で返します",
  "エラーが発生した場合は例外をスローします",
  "ドキュメントに従って実装することが推奨されます",
];

const PRO_TEMPLATES = [
  "本番環境で実際に発生した障害パターンを事前にハンドリング",
  "処理速度を平均 2.3x 向上させた独自の前処理を適用",
  "規制上の要件（ISMS・ISO27001）に準拠したログ設計を内蔵",
  "エッジケース（文字化け・空白・重複キー）を自動吸収",
  "実コスト削減実績：月間 API コストを 40% 削減した設定を同梱",
];

// ─── Core function ────────────────────────────────────────────────────────────

export function getDeltaCompare(guildId: string): DeltaCompare {
  let seed = djb2(guildId + "delta");

  // Select 2–4 differentiator tags deterministically
  seed = lcg(seed);
  const tagCount = 2 + (seed % 3); // 2, 3, or 4
  const usedIndices = new Set<number>();
  const differentiators: DeltaTag[] = [];

  for (let i = 0; i < tagCount; i++) {
    seed = lcg(seed);
    let idx = seed % ALL_TAGS.length;
    // avoid duplicates
    let tries = 0;
    while (usedIndices.has(idx) && tries < 10) {
      seed = lcg(seed);
      idx = seed % ALL_TAGS.length;
      tries++;
    }
    usedIndices.add(idx);
    differentiators.push(ALL_TAGS[idx]);
  }

  // Generic points: pick 3 from template
  seed = lcg(seed);
  const gStart = seed % (GENERIC_TEMPLATES.length - 2);
  const generic = {
    points: GENERIC_TEMPLATES.slice(gStart, gStart + 3),
  };

  // Pro points: pick 3 from pro template
  seed = lcg(seed);
  const pStart = seed % (PRO_TEMPLATES.length - 2);
  const pro = {
    points: PRO_TEMPLATES.slice(pStart, pStart + 3),
    differentiators,
    valueDeltaPct: 20 + (seed % 61), // 20–80%
  };

  return { generic, pro };
}
