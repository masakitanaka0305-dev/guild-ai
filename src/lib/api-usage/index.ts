function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface UsagePeriod {
  jpy: number;
  calls: number;
}

export interface UsageDeltas {
  dailyPct: number;
  weeklyPct: number;
}

export function getDailyUsage(handle: string): UsagePeriod {
  const seed = djb2(handle + "_daily");
  return {
    jpy: 1200 + (seed % 3800),
    calls: 80 + (seed % 420),
  };
}

export function getWeeklyUsage(handle: string): UsagePeriod {
  const seed = djb2(handle + "_weekly");
  const d = getDailyUsage(handle);
  return {
    jpy: d.jpy * 7 + (seed % 5000),
    calls: d.calls * 7 + (seed % 400),
  };
}

export function getLifetimeUsage(handle: string): UsagePeriod {
  const seed = djb2(handle + "_lifetime");
  const w = getWeeklyUsage(handle);
  return {
    jpy: w.jpy * 52 + (seed % 100_000),
    calls: w.calls * 52 + (seed % 10_000),
  };
}

export function getDeltas(handle: string): UsageDeltas {
  const ds = djb2(handle + "_ddelta");
  const ws = djb2(handle + "_wdelta");
  return {
    dailyPct:  -20 + (ds % 61),
    weeklyPct: -15 + (ws % 56),
  };
}

export function getLockUnlockedRewards(handle: string): { jpy: number } {
  const seed = djb2(handle + "_lock");
  return { jpy: 5_000 + (seed % 45_000) };
}

export function getUsageHistory(handle: string): number[] {
  const d = getDailyUsage(handle);
  return Array.from({ length: 30 }, (_, i) => {
    const seed = djb2(handle + `_hist${i}`);
    return Math.max(100, Math.round(d.jpy * (0.4 + (seed % 120) / 100)));
  });
}
