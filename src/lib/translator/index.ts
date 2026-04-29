// Autonomous Translation Layer — converts MD to agent-friendly English + JSON Schema
// Uses keyword dictionary (no LLM calls). Non-dictionary Japanese wrapped as [Japanese:〜].

import { generateSchemas, type GeneratedSchemas } from "@/lib/schema-generator";

// ─── 30-word translation dictionary ──────────────────────────────────────────

export const TRANSLATION_DICT: Array<[string, string]> = [
  ["請求書",       "invoice"],
  ["自動化",       "automation"],
  ["分類",         "classification"],
  ["変換",         "conversion"],
  ["抽出",         "extraction"],
  ["生成",         "generation"],
  ["分析",         "analysis"],
  ["最適化",       "optimization"],
  ["統合",         "integration"],
  ["処理",         "processing"],
  ["管理",         "management"],
  ["検索",         "search"],
  ["フィルタリング", "filtering"],
  ["認証",         "authentication"],
  ["暗号化",       "encryption"],
  ["データ",       "data"],
  ["出力",         "output"],
  ["入力",         "input"],
  ["エラー",       "error"],
  ["設定",         "configuration"],
  ["実行",         "execution"],
  ["テスト",       "testing"],
  ["デプロイ",     "deployment"],
  ["バックアップ", "backup"],
  ["監視",         "monitoring"],
  ["通知",         "notification"],
  ["ログ",         "logging"],
  ["接続",         "connection"],
  ["スケジュール", "scheduling"],
  ["スクリプト",   "script"],
];

// ─── CJK Unicode range detector ───────────────────────────────────────────────

const CJK_RE = /[\u3000-\u9FFF\uF900-\uFAFF\u30A0-\u30FF\u3040-\u309F\uFF00-\uFFEF]+/g;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranslateMeta {
  title: string;
  rank?: string;
  guildId?: string;
}

export interface AgentTranslation {
  english: string;
  schema: GeneratedSchemas;
  summary60w: string;
  version: "v1";
}

// ─── Core function ────────────────────────────────────────────────────────────

export function translateForAgent(mdContent: string, meta: TranslateMeta): AgentTranslation {
  // 1. Apply dictionary substitutions (longest-first avoids partial matches)
  let english = mdContent;
  for (const [jp, en] of TRANSLATION_DICT) {
    english = english.split(jp).join(en);
  }

  // 2. Wrap remaining CJK sequences with [Japanese:〜] placeholder
  english = english.replace(CJK_RE, (m) => `[Japanese:${m}]`);

  // 3. Generate JSON Schema using schema-generator
  const schema = generateSchemas(mdContent, { title: meta.title, rank: meta.rank ?? "B" });

  // 4. Build 60-word English summary
  //    Take whitespace tokens, skip [Japanese:...] placeholders
  const tokens = english.split(/\s+/).filter(Boolean);
  const realWords: string[] = [];
  for (const t of tokens) {
    if (!t.startsWith("[Japanese:")) {
      realWords.push(t.replace(/[^\w$.,!?-]/g, ""));
    }
    if (realWords.length >= 60) break;
  }
  const summary60w = realWords.filter(Boolean).join(" ");

  return { english, schema, summary60w, version: "v1" };
}

// ─── Snippet helper for display (first 120 chars of English) ─────────────────

export function englishSnippet(translation: AgentTranslation, maxChars = 120): string {
  const plain = translation.english
    .replace(/\[Japanese:[^\]]+\]/g, "…")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxChars ? plain.slice(0, maxChars) + "…" : plain;
}
