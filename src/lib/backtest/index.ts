// Performance Proof (Backtest): deterministic mock stats per guildId

export interface BacktestStats {
  samples: number;
  accuracyPct: number;     // 0–100
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorRatePct: number;    // 0–5
  lastRunAt: string;       // ISO-8601
  monthlyTrend: number[];  // 12 values, accuracy pct per month
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

// ─── Core function ────────────────────────────────────────────────────────────

export function getBacktestStats(guildId: string): BacktestStats {
  let seed = djb2(guildId + "backtest");

  // Base accuracy: 82–99.5% (higher-ranked items tend to have better seeds)
  const rawAcc = 820 + (seed % 175);       // 820–994 in tenths of %
  const accuracyPct = rawAcc / 10;          // 82.0–99.4

  seed = lcg(seed);
  const avgLatencyMs = 80 + (seed % 420);  // 80–500ms

  seed = lcg(seed);
  const p95LatencyMs = avgLatencyMs + 50 + (seed % 350); // avg+50 to avg+400

  seed = lcg(seed);
  const errorRatePct = (seed % 40) / 10;   // 0.0–3.9%

  seed = lcg(seed);
  // samples in units of ~1000, range 12k–180k
  const samples = (12 + (seed % 168)) * 1000;

  // 12-month accuracy trend (slight upward drift ±3%)
  const monthlyTrend: number[] = [];
  let trendSeed = djb2(guildId + "trend");
  const base = accuracyPct - 2;
  for (let i = 0; i < 12; i++) {
    trendSeed = lcg(trendSeed);
    const delta = ((trendSeed % 60) - 30) / 10; // ±3.0
    monthlyTrend.push(Math.max(70, Math.min(100, +(base + delta + i * 0.15).toFixed(1))));
  }

  const lastRunAt = "2026-04-29T06:00:00Z";

  return { samples, accuracyPct, avgLatencyMs, p95LatencyMs, errorRatePct, lastRunAt, monthlyTrend };
}

// ─── Formatter helpers ────────────────────────────────────────────────────────

export function formatSamples(n: number): string {
  if (n >= 100_000) return `${(n / 10000).toFixed(0)}万`;
  if (n >= 10_000)  return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString("ja-JP");
}
