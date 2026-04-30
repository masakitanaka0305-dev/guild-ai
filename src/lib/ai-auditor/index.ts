// GUILD AI — ai-auditor (知能鑑定士)
// Decides S/A/B rank from CCAF + Vercel uptime + running code evidence.
// Quality-Gate (Shima-Final): S rank requires hasRunningCode + test evidence.

import type { AuditResult, CCAF, Rank } from "@/types";

export interface AuditInput {
  ccaf: CCAF;
  vercelUptimeDays: number;
  mdContent?: string;  // optional: raw MD text for running-code detection
}

// Quality-Gate Shima-Final: S rank tightened
const S_THRESHOLD = { density: 70, uptime: 30, intentSignals: 3 } as const;
const A_THRESHOLD = { density: 60, uptime: 7 } as const;
// D-rank: low-quality submissions are hidden from marketplace
const D_THRESHOLD = { maxDensity: 30 } as const;

const D_FEEDBACK_TEMPLATES = [
  "コードが不足しています。`function`／`class`／`async` を含む実行可能なブロックを 3 個以上含めてください。",
  "具体性に欠けます。あなた独自の工夫・閾値・エラー処理の意図を 1〜2 段落で追記してください。",
  "README の再録は別物です。実装ポイントの記述を増やしてください。",
];

// Running code keywords (execution declarations)
const RUNNING_CODE_PATTERNS = [/\bfunction\b/, /\basync\b/, /\bdef\b/, /\bclass\b/, /\bfn\s/];
const TEST_EVIDENCE_PATTERNS = [/\btest\b/i, /\bverify\b/i, /\bexample\b/i, /output:/i];

/** Detect if MD contains at least 3 running-code declarations */
export function evaluateDepth(mdContent: string): { hasRunningCode: boolean; hasTestEvidence: boolean } {
  const runningCodeCount = RUNNING_CODE_PATTERNS.filter((p) => p.test(mdContent)).length;
  const hasTestEvidence = TEST_EVIDENCE_PATTERNS.some((p) => p.test(mdContent));
  return { hasRunningCode: runningCodeCount >= 3, hasTestEvidence };
}

function buildJustification(ccaf: CCAF, vercelUptimeDays: number, rank: Rank): string {
  const signals = ccaf.intentSignals.length;
  return `思考密度${ccaf.thoughtDensity}、試行回数${ccaf.iterations}回、稼働実績${vercelUptimeDays}日、意思シグナル「${signals}個」により ${rank} ランクと判定。${
    rank === "S" ? "魂の登記基準を満たし最高格付けを付与。" :
    rank === "A" ? "高品質基準を満たす。意思シグナルを追加することでSランクへ昇格可能。" :
    rank === "D" ? "品質基準を満たさないため非公開。改善アドバイスを確認してください。" :
    "基準値を下回るが最低保証ランクを付与。思考密度と稼働日数を改善することでランクアップできる。"
  }`;
}

export function audit(input: AuditInput): AuditResult {
  const { ccaf, vercelUptimeDays, mdContent = "" } = input;
  const reasons: string[] = [];

  const hasIntent = ccaf.intentSignals.length >= S_THRESHOLD.intentSignals;
  const { hasRunningCode, hasTestEvidence } = evaluateDepth(mdContent);

  // D-rank gate: reject low-quality or generic submissions
  const isDRank =
    !hasRunningCode ||
    ccaf.thoughtDensity < D_THRESHOLD.maxDensity;

  let rank: Rank = "B";
  if (isDRank && mdContent !== "") {
    // D-rank: private, not shown in marketplace
    rank = "D";
    if (!hasRunningCode) reasons.push("実稼働コード不足: D ランク（非公開）");
    if (ccaf.thoughtDensity < D_THRESHOLD.maxDensity) reasons.push(`思考密度 ${ccaf.thoughtDensity} < 30: D ランク（非公開）`);
    const feedback = D_FEEDBACK_TEMPLATES.slice(hasRunningCode ? 1 : 0);
    const composite = 0.6 * ccaf.thoughtDensity + 0.3 * (Math.min(vercelUptimeDays, 60) / 60 * 100);
    return {
      rank,
      score: Math.round(composite * 100) / 100,
      reasons,
      justification: buildJustification(ccaf, vercelUptimeDays, rank),
      feedback,
    };
  } else if (
    ccaf.thoughtDensity >= S_THRESHOLD.density &&
    vercelUptimeDays >= S_THRESHOLD.uptime &&
    hasIntent &&
    hasRunningCode &&
    hasTestEvidence
  ) {
    rank = "S";
    reasons.push("魂の登記: thoughtDensity ≥ 70, uptime ≥ 30d, intentSignals ≥ 3, 実稼働コード ✓, テスト証跡 ✓");
  } else if (
    ccaf.thoughtDensity >= S_THRESHOLD.density &&
    vercelUptimeDays >= S_THRESHOLD.uptime &&
    hasIntent &&
    (!hasRunningCode || !hasTestEvidence)
  ) {
    rank = "A";
    if (!hasRunningCode) reasons.push("実稼働コード ✗：S ランク条件を満たしません");
    if (!hasTestEvidence) reasons.push("テスト証跡 ✗：S ランク条件を満たしません");
  } else if (
    ccaf.thoughtDensity >= A_THRESHOLD.density &&
    vercelUptimeDays >= A_THRESHOLD.uptime
  ) {
    rank = "A";
    reasons.push("A rank: thoughtDensity ≥ 60, uptime ≥ 7d");
    if (!hasIntent) reasons.push("Intent signals missing — capped at A (no 魂の登記)");
  } else {
    rank = "B";
    reasons.push("B rank: baseline guarantee");
  }

  const uptimePart = Math.min(vercelUptimeDays, 60) / 60;
  const intentPart = hasIntent ? 1 : 0;
  const composite =
    0.6 * ccaf.thoughtDensity +
    0.3 * (uptimePart * 100) +
    0.1 * (intentPart * 100);

  return {
    rank,
    score: Math.round(composite * 100) / 100,
    reasons,
    justification: buildJustification(ccaf, vercelUptimeDays, rank),
  };
}

/**
 * Promote an A-rank result to S by adding a voice intent signal.
 * Caller should provide the raw transcript from the user's voice input.
 */
export function promoteWithIntent(input: AuditInput, voiceLog: string): AuditResult {
  const base = audit(input);
  const promoted: CCAF = {
    ...input.ccaf,
    intentSignals: [...input.ccaf.intentSignals, "voice-intent"],
  };
  const boostedScore = Math.min(100, base.score + 15);
  const snippet = voiceLog.slice(0, 40).trim();
  return {
    rank: "S",
    score: boostedScore,
    reasons: [
      ...base.reasons,
      `意思シグナル追加: 「${snippet}${voiceLog.length > 40 ? "…" : ""}」により S ランクへ昇格`,
    ],
    justification: buildJustification(promoted, input.vercelUptimeDays, "S"),
  };
}

/**
 * Compute Floor Price from base price and Trust Score (0-1000).
 * floorPrice = basePrice * (1 + score/2000) — capped at +50%.
 * JPY is integer-only by convention; result is rounded to whole yen.
 */
export function computeFloorPrice(basePrice: number, trustScore: number): number {
  const ratio = 1 + Math.min(trustScore, 1000) / 2000;
  return Math.round(basePrice * ratio);
}
