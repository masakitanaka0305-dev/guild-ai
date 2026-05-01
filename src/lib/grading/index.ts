// GUILD AI — Intelligence Grading
// Computes a four-rank classification (S / A / B / D) over three pillars:
//   - Structure   (length + heading hierarchy)
//   - Density     (technical + business term frequency)
//   - Consistency (alignment between MD claims and GitHub activity)
//
// Total = structure*0.4 + density*0.4 + consistency*0.2
// Total ≥ 85 → S, ≥ 70 → A, ≥ 50 → B, otherwise D.
//
// The D-rank gate from `recipe-gate` still wins: if there is no running
// code in the MD, the result is forced to D regardless of the score.

import type { Rank } from "@/types";

export interface HeadingCounts {
  h1: number;
  h2: number;
  h3: number;
}

export interface GitHubSignals {
  /** Total number of commits attributed to the author over the lookback window. */
  commitCount: number;
  /** True when the author committed within the last 30 days. */
  recentActivity: boolean;
  /** Repository / project topic strings — used for consistency scoring. */
  topics?: readonly string[];
}

export interface GradingInput {
  mdText: string;
  headings?: HeadingCounts;
  /** When false, the result is forced to D (mirrors recipe-gate). */
  hasRunningCode?: boolean;
  githubSignals?: GitHubSignals;
}

export interface GradingBreakdown {
  structure: number;    // 0..100
  density:   number;    // 0..100
  consistency: number;  // 0..100
}

export interface GradingResult {
  rank: Rank;
  /** Total composite score, 0..100. */
  total: number;
  subLabel: string;
  breakdown: GradingBreakdown;
}

// ─── Sub-label table (Friendly Tone — 金/銀/銅/みならい) ─────────────────────

export const RANK_SUB_LABEL: Record<Rank, string> = {
  S: "金の太鼓判。市場価値トップ1%",
  A: "銀の太鼓判。すぐ役立つ即戦力の知恵",
  B: "銅の太鼓判。これからもっと光る知恵",
  D: "みならい。育成枠の知恵",
};

// ─── Rank tier label (friendly Japanese tag) ─────────────────────────────────

export const RANK_TIER: Record<Rank, "金" | "銀" | "銅" | "みならい"> = {
  S: "金",
  A: "銀",
  B: "銅",
  D: "みならい",
};

// ─── Color tokens shared with HexRankBadge ───────────────────────────────────

export const RANK_COLOR_TOKEN: Record<Rank, { fill: string; ink: string; text: string }> = {
  S: { fill: "#FDE047", ink: "#0B1121", text: "text-[#FDE047]" }, // 金
  A: { fill: "#CBD5E1", ink: "#0B1121", text: "text-[#CBD5E1]" }, // 銀 (silver)
  B: { fill: "#D2A06B", ink: "#0B1121", text: "text-[#D2A06B]" }, // 銅 (bronze)
  D: { fill: "#94A3B8", ink: "#0B1121", text: "text-slate-400"   }, // みならい
};

// ─── Term dictionaries (Density scoring) ─────────────────────────────────────

const TECH_TERMS = [
  "API", "REST", "GraphQL", "TypeScript", "JavaScript", "Python", "Go", "Rust",
  "OpenAPI", "JSON Schema", "Postgres", "Redis", "Kafka", "Kubernetes", "Docker",
  "OAuth", "JWT", "WebSocket", "gRPC", "OpenTelemetry", "Grafana",
  "RAG", "LLM", "Embedding", "Vector", "Prompt", "Agent", "Pipeline",
  "Observability", "SLO",
] as const;

const BIZ_TERMS = [
  "ROI", "KPI", "OKR", "P&L", "GMV", "ARR", "MRR", "LTV", "CAC",
  "TAM", "SAM", "SOM", "Pricing", "Margin", "Conversion", "Retention",
  "Funnel", "Stakeholder", "Roadmap", "Milestone",
] as const;

// Density: occurrences per 1000 chars, scaled so ~20/1000 saturates at 100.
// Each term is counted once per MD (presence > frequency) which matches how
// authors mention concepts in technical writing.
function densityScore(mdText: string): number {
  if (!mdText) return 0;
  const lower = mdText.toLowerCase();
  let hits = 0;
  for (const t of TECH_TERMS) if (lower.includes(t.toLowerCase())) hits += 1;
  for (const t of BIZ_TERMS)  if (lower.includes(t.toLowerCase())) hits += 1;
  const perKilo = (hits / Math.max(1, mdText.length)) * 1000;
  return Math.max(0, Math.min(100, Math.round(perKilo * 6)));
}

// Structure: length ≥ 2,000 chars (+50), h2 ≥ 3 (+30), h3 ≥ 5 (+20). Clamp 100.
function structureScore(mdText: string, headings?: HeadingCounts): number {
  const h = headings ?? extractHeadings(mdText);
  let s = 0;
  if (mdText.length >= 2000) s += 50;
  if (h.h2 >= 3) s += 30;
  if (h.h3 >= 5) s += 20;
  return Math.min(100, s);
}

/**
 * Heading detector — counts ATX-style markdown headings (#, ##, ###).
 * Public so callers can inject precomputed counts.
 */
export function extractHeadings(mdText: string): HeadingCounts {
  let h1 = 0, h2 = 0, h3 = 0;
  for (const line of mdText.split(/\r?\n/)) {
    const m = /^(#{1,3})\s+/.exec(line);
    if (!m) continue;
    if (m[1].length === 1) h1++;
    else if (m[1].length === 2) h2++;
    else if (m[1].length === 3) h3++;
  }
  return { h1, h2, h3 };
}

// Consistency: GitHub commit count + recency + topic overlap with MD.
function consistencyScore(mdText: string, signals?: GitHubSignals): number {
  if (!signals) return 50; // neutral when no signals are wired
  let s = 0;
  if (signals.commitCount >= 100) s += 60;
  else if (signals.commitCount >= 30) s += 40;
  else if (signals.commitCount >= 10) s += 20;
  if (signals.recentActivity) s += 20;
  if (signals.topics && signals.topics.length > 0) {
    const lower = mdText.toLowerCase();
    const matched = signals.topics.filter((t) => lower.includes(t.toLowerCase())).length;
    s += Math.min(20, matched * 5);
  }
  return Math.max(0, Math.min(100, s));
}

function pickRank(total: number, hasRunningCode: boolean): Rank {
  if (!hasRunningCode) return "D";
  if (total >= 85) return "S";
  if (total >= 70) return "A";
  if (total >= 50) return "B";
  return "D";
}

export function gradeIntelligence(input: GradingInput): GradingResult {
  const structure   = structureScore(input.mdText, input.headings);
  const density     = densityScore(input.mdText);
  const consistency = consistencyScore(input.mdText, input.githubSignals);
  const total = Math.round(structure * 0.4 + density * 0.4 + consistency * 0.2);
  // Default `hasRunningCode` to true when not provided so plain MD samples
  // don't get force-demoted; recipe-gate callers should always pass it.
  const rank = pickRank(total, input.hasRunningCode ?? true);
  return {
    rank,
    total,
    subLabel: RANK_SUB_LABEL[rank],
    breakdown: { structure, density, consistency },
  };
}
