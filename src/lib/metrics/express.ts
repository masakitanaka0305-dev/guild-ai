// GUILD AI — Express Path Metrics
// Append-only mock store for Express Path run durations.

export interface ExpressRunRecord {
  handle: string;
  seconds: number;
  ranAt: string; // ISO8601
}

const runs: ExpressRunRecord[] = [];

export function recordExpressRun(handle: string, seconds: number): ExpressRunRecord {
  const rec: ExpressRunRecord = { handle, seconds, ranAt: new Date().toISOString() };
  runs.push(rec);
  return rec;
}

export function getAllRuns(): ExpressRunRecord[] {
  return [...runs];
}

export function getRecentRuns(limit = 100): ExpressRunRecord[] {
  return runs.slice(-limit);
}

function percentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function getMedianRunSeconds(): number {
  const sorted = runs.map((r) => r.seconds).sort((a, b) => a - b);
  return percentile(sorted, 50);
}

export function getP95RunSeconds(): number {
  const sorted = runs.map((r) => r.seconds).sort((a, b) => a - b);
  return percentile(sorted, 95);
}

export function _resetMetrics(): void {
  runs.length = 0;
}
