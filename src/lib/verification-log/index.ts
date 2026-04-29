// Real-World Verification Log — deterministic mock, no external calls

export type Outcome = "success" | "partial" | "fail";
export type Environment = "prod" | "staging" | "pilot";
export type Region = "tokyo" | "osaka" | "fukuoka" | "singapore" | "seoul";
export type PayerType = "individual" | "business" | "agent";

export interface LogEntry {
  ts: string;            // ISO-8601
  env: Environment;
  outcome: Outcome;
  durationMs: number;
  region: Region;
  payerType: PayerType;
  hash: string;          // short hex, e.g. "0xab12cf45"
}

export interface VerificationSummary {
  totalRuns: number;
  successRate: number;   // 0–100
  lastSuccessAt: string; // ISO-8601
  environments: string[];
}

export interface VerificationLog {
  entries: LogEntry[];
  summary: VerificationSummary;
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

const ENVS: Environment[]    = ["prod", "staging", "pilot"];
const REGIONS: Region[]      = ["tokyo", "osaka", "fukuoka", "singapore", "seoul"];
const PAYERS: PayerType[]    = ["individual", "business", "agent"];

// Outcome weights: success=90%, partial=7%, fail=3%
function pickOutcome(n: number): Outcome {
  const r = n % 100;
  if (r < 90) return "success";
  if (r < 97) return "partial";
  return "fail";
}

const REGION_LABELS: Record<Region, string> = {
  tokyo: "東京", osaka: "大阪", fukuoka: "福岡", singapore: "シンガポール", seoul: "ソウル",
};
export { REGION_LABELS };

// ─── Core function ────────────────────────────────────────────────────────────

export function getVerificationLog(guildId: string, count = 50): VerificationLog {
  let seed = djb2(guildId + "verif");
  const now = new Date("2026-04-29T06:00:00Z").getTime();

  const entries: LogEntry[] = [];
  for (let i = 0; i < count; i++) {
    seed = lcg(seed);
    // Each entry: roughly spread over past 30 days
    const ageMs = (seed % (30 * 24 * 3600 * 1000));
    const ts = new Date(now - ageMs).toISOString();

    seed = lcg(seed);
    const env = ENVS[seed % ENVS.length];

    seed = lcg(seed);
    const outcome = pickOutcome(seed % 100);

    seed = lcg(seed);
    const durationMs = 50 + (seed % 900); // 50–950ms

    seed = lcg(seed);
    const region = REGIONS[seed % REGIONS.length];

    seed = lcg(seed);
    const payerType = PAYERS[seed % PAYERS.length];

    const hash = `0x${(seed & 0xFFFFFFFF).toString(16).padStart(8, "0").slice(0, 8)}`;

    entries.push({ ts, env, outcome, durationMs, region, payerType, hash });
  }

  // Sort newest first
  entries.sort((a, b) => b.ts.localeCompare(a.ts));

  const totalRuns = entries.length;
  const successCount = entries.filter((e) => e.outcome === "success").length;
  const successRate = Math.round((successCount / totalRuns) * 1000) / 10;
  const lastSuccess = entries.find((e) => e.outcome === "success");
  const lastSuccessAt = lastSuccess?.ts ?? entries[0]?.ts ?? new Date().toISOString();
  const environments = [...new Set(entries.map((e) => e.env))];

  return {
    entries,
    summary: { totalRuns, successRate, lastSuccessAt, environments },
  };
}
