// GUILD AI — Leaderboard (Hall of Fame) data
//
// Static, deterministic mock entries for the S-rank leaderboard.
// Entries are ordered by cumulative JPY descending and pinned at 10
// rows so the screen never shows non-S-rank operators.

import type { Rank } from "@/types";

export interface LeaderboardEntry {
  /** Stable handle used to route into /profile/[handle]. */
  handle: string;
  title: string;
  category: string;
  /** Always "S" — this list is the Hall of Fame. */
  rank: Extract<Rank, "S">;
  cumulativeJpy: number;
}

// Frozen at 10 — the spec asks for "S ランク 10 件 (モック)".
const RAW: readonly Omit<LeaderboardEntry, "rank">[] = [
  { handle: "ml-architect-jp",   title: "MLパイプライン設計集",        category: "ml-pipeline",   cumulativeJpy: 4_280_000 },
  { handle: "rag-master-tk",      title: "RAG設計の系譜",                category: "rag-design",    cumulativeJpy: 3_910_000 },
  { handle: "agent-arch-yk",      title: "Agent Architecture Notes",    category: "agent-arch",    cumulativeJpy: 3_140_000 },
  { handle: "infra-go-sage",      title: "Goインフラ実装ノート",         category: "infra-go",      cumulativeJpy: 2_870_000 },
  { handle: "feature-store-mk",   title: "Feature Store ベストプラクティス", category: "feature-store", cumulativeJpy: 2_610_000 },
  { handle: "obs-pipeline-hr",    title: "可観測性 — メトリクスから物語へ", category: "observability", cumulativeJpy: 2_290_000 },
  { handle: "compliance-shimon",  title: "金融コンプライアンス × API",     category: "compliance",    cumulativeJpy: 1_980_000 },
  { handle: "rust-memory-an",     title: "Rustメモリ安全設計ノート",      category: "infra-rust",    cumulativeJpy: 1_750_000 },
  { handle: "ts-design-ko",       title: "TypeScript設計パターン集",     category: "ts-design",     cumulativeJpy: 1_540_000 },
  { handle: "llm-prompt-na",      title: "LLM Prompt Engineering集",      category: "prompt",        cumulativeJpy: 1_320_000 },
] as const;

export const LEADERBOARD_S: readonly LeaderboardEntry[] = RAW.map((r) => ({
  ...r,
  rank: "S" as const,
}));

export function getSRankLeaderboard(): readonly LeaderboardEntry[] {
  return LEADERBOARD_S;
}
