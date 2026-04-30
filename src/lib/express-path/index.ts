// GUILD AI — Express Path (3-Minute Path)
// 8-step flow: source(user) → connect → select-repo → analyze → validate → publish → first-royalty → confirmed
// Total automated duration (excluding source step) < 180s for all seeds.

import type { Rank } from "@/types";

export type ExpressStepId =
  | "source"
  | "connect"
  | "select-repo"
  | "analyze"
  | "validate"
  | "publish"
  | "first-royalty"
  | "confirmed";

export interface ExpressStep {
  id: ExpressStepId;
  label: string;
  description: string;
  durationMs: number; // 0 = user-driven (not auto-timed)
}

export const EXPRESS_STEPS: ExpressStep[] = [
  {
    id: "source",
    label: "コンテンツ投入",
    description: "URL・ファイル・テキストで MD コンテンツを渡します（ユーザー操作待ち）",
    durationMs: 0,
  },
  {
    id: "connect",
    label: "GitHub 接続",
    description: "GitHub アカウントを認証します",
    durationMs: 800,
  },
  {
    id: "select-repo",
    label: "リポジトリ選択",
    description: "公開する MD リポジトリを選択します",
    durationMs: 500,
  },
  {
    id: "analyze",
    label: "AI コンテンツ解析",
    description: "投入されたコンテンツを解析・分類します",
    durationMs: 3200,
  },
  {
    id: "validate",
    label: "Validation Score 確定",
    description: "コンテンツの品質からランクとスコアを確定します",
    durationMs: 2100,
  },
  {
    id: "publish",
    label: "Asset Ledger 登記・公開",
    description: "エンドポイント発行 → Marketplace 掲載",
    durationMs: 1400,
  },
  {
    id: "first-royalty",
    label: "First Royalty 待機中",
    description: "AtoA 取引の初回発火を待っています（30〜60 秒）",
    durationMs: 40_000,
  },
  {
    id: "confirmed",
    label: "3 分以内に利益確定",
    description: "初回印税が通帳に記録されました",
    durationMs: 800,
  },
];

export const BUDGET_MS = 180_000; // 3 minutes

// Automated steps only (source is user-driven, excluded from budget calc)
export const TOTAL_DURATION_MS = EXPRESS_STEPS
  .filter((s) => s.id !== "source")
  .reduce((s, st) => s + st.durationMs, 0);

// ─── Content input ────────────────────────────────────────────────────────────

export type SourceKind = "url" | "file" | "text";

export interface ExpressInput {
  kind: SourceKind;
  content: string;  // raw text (URL string, file text, or pasted text)
  meta?: { fileName?: string; fileSize?: number };
}

// ─── Content analysis (first 5KB) ────────────────────────────────────────────

export interface ContentAnalysis {
  hash: string;
  title: string;
  density: number;        // chars per 1000
  hasRunningCode: boolean;
  rank: Rank;
  validationScore: number;
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

export function analyzeContent(input: ExpressInput): ContentAnalysis {
  const slice = input.content.slice(0, 5120); // first 5KB

  const hash = djb2(slice).toString(16).padStart(8, "0");

  // Title: first H1 or first non-empty line
  const lines = slice.split("\n").map((l) => l.trim()).filter(Boolean);
  const h1 = lines.find((l) => /^#{1,3}\s/.test(l));
  const title = (h1 ?? lines[0] ?? "Untitled")
    .replace(/^#{1,6}\s*/, "")
    .slice(0, 60);

  const density = slice.length / 1000;

  // Running code detection: code fences, function/class/def/const/let patterns
  const hasRunningCode = /```[\s\S]{10,}```|(?:function|class|def|const\s+\w+\s*=\s*(?:async\s+)?\(|export\s+(?:default\s+)?(?:function|class))/.test(slice);

  // Rank from content quality
  let rank: Rank;
  if (density >= 3 && hasRunningCode) {
    rank = "S";
  } else if (density >= 1.5 || hasRunningCode) {
    rank = "A";
  } else {
    rank = "B";
  }

  // Validation score: content-aware (60–94)
  const seedScore = djb2(hash) % 15;
  const validationScore =
    rank === "S" ? 80 + seedScore :
    rank === "A" ? 65 + seedScore :
    50 + seedScore;

  return { hash, title, density, hasRunningCode, rank, validationScore };
}

// ─── Input validation ─────────────────────────────────────────────────────────

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateExpressInput(input: ExpressInput): ValidationResult {
  if (input.kind === "url") {
    if (!/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(input.content)) {
      return { ok: false, error: "有効な GitHub リポジトリ URL を入力してください（例: https://github.com/user/repo）" };
    }
    return { ok: true };
  }
  if (input.kind === "file") {
    if ((input.meta?.fileSize ?? 0) > 200 * 1024) {
      return { ok: false, error: "ファイルサイズは 200KB 以下にしてください" };
    }
    if (input.content.length < 10) {
      return { ok: false, error: "ファイルの内容が空です" };
    }
    return { ok: true };
  }
  if (input.kind === "text") {
    if (input.content.trim().length < 100) {
      return { ok: false, error: "100 文字以上のテキストを入力してください" };
    }
    return { ok: true };
  }
  return { ok: false, error: "入力が不足しています" };
}

// ─── Timeline simulation ──────────────────────────────────────────────────────

export interface ExpressTimelineStep {
  id: ExpressStepId;
  label: string;
  seconds: number;
}

export interface ExpressTimeline {
  steps: ExpressTimelineStep[];
  totalSeconds: number;
  analysis: ContentAnalysis | null;
}

export function simulateExpressTimeline(
  seed: string,
  input?: ExpressInput,
): ExpressTimeline {
  const hash = djb2(seed);
  const royaltyMs = 30_000 + (hash % 30_001); // 30–60s

  const analysis = input ? analyzeContent(input) : null;

  const steps: ExpressTimelineStep[] = EXPRESS_STEPS
    .filter((s) => s.id !== "source") // source is user-driven, not timed
    .map((step) => {
      let durationMs = step.durationMs;
      if (step.id === "first-royalty") durationMs = royaltyMs;
      // URL input: skip select-repo (repo already specified)
      if (step.id === "select-repo" && input?.kind === "url") durationMs = 0;
      return { id: step.id, label: step.label, seconds: Math.round(durationMs / 1000) };
    });

  const totalSeconds = steps.reduce((s, st) => s + st.seconds, 0);
  return { steps, totalSeconds, analysis };
}

// ─── First Royalty ────────────────────────────────────────────────────────────

export const FIRST_ROYALTY_JPY: Record<"S" | "A" | "B", number> = {
  S: 420,
  A: 180,
  B: 60,
};

export function getFirstRoyaltyJpy(rank: Rank): number {
  if (rank === "S") return FIRST_ROYALTY_JPY.S;
  if (rank === "A") return FIRST_ROYALTY_JPY.A;
  return FIRST_ROYALTY_JPY.B;
}
