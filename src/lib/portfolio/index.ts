export type AssetStatus = "active" | "reviewing" | "paused";
export type SortKey = "monthly" | "calls" | "lastCalled" | "postedAt";

export interface PortfolioAsset {
  guildId: string;
  titleJa: string;
  status: AssetStatus;
  endpointShort: string;
  monthlyJpy: number;
  callsLast30: number;
  sparkline: number[];
  lastCalledAt: string;
  postedAt: string;
}

export interface PortfolioSummary {
  active: number;
  reviewing: number;
  paused: number;
  total: number;
}

export function getMyAssets(): PortfolioAsset[] {
  const now = Date.now();
  return [
    {
      guildId: "GUILD:0001-TS01-PAT1",
      titleJa: "TypeScript設計パターン集",
      status: "active",
      endpointShort: "TS01-PAT1",
      monthlyJpy: 4800,
      callsLast30: 1240,
      sparkline: [120, 145, 190, 160, 210, 175, 240],
      lastCalledAt: new Date(now - 3 * 60_000).toISOString(),
      postedAt: "2025-11-10T09:00:00Z",
    },
    {
      guildId: "GUILD:0002-RS01-MEM1",
      titleJa: "Rustメモリ安全設計ノート",
      status: "active",
      endpointShort: "RS01-MEM1",
      monthlyJpy: 2100,
      callsLast30: 580,
      sparkline: [60, 80, 75, 90, 85, 100, 90],
      lastCalledAt: new Date(now - 60 * 60_000).toISOString(),
      postedAt: "2025-12-05T14:00:00Z",
    },
    {
      guildId: "GUILD:0003-LLM1-PRO1",
      titleJa: "LLM Prompt Engineering集",
      status: "active",
      endpointShort: "LLM1-PRO1",
      monthlyJpy: 980,
      callsLast30: 310,
      sparkline: [30, 35, 40, 45, 40, 55, 65],
      lastCalledAt: new Date(now - 25 * 60_000).toISOString(),
      postedAt: "2025-12-20T11:30:00Z",
    },
    {
      guildId: "GUILD:0004-CSS1-ANI1",
      titleJa: "CSSアニメーション逆引き辞典",
      status: "active",
      endpointShort: "CSS1-ANI1",
      monthlyJpy: 540,
      callsLast30: 185,
      sparkline: [20, 25, 22, 30, 28, 35, 25],
      lastCalledAt: new Date(now - 3 * 60 * 60_000).toISOString(),
      postedAt: "2026-01-08T08:00:00Z",
    },
    {
      guildId: "GUILD:0005-PY01-DAT1",
      titleJa: "Pythonデータ分析ベストプラクティス",
      status: "reviewing",
      endpointShort: "PY01-DAT1",
      monthlyJpy: 0,
      callsLast30: 0,
      sparkline: [0, 0, 0, 0, 0, 0, 0],
      lastCalledAt: new Date(now - 2 * 24 * 60 * 60_000).toISOString(),
      postedAt: "2026-04-25T10:00:00Z",
    },
    {
      guildId: "GUILD:0006-SQL1-OPT1",
      titleJa: "SQLクエリ最適化パターン",
      status: "paused",
      endpointShort: "SQL1-OPT1",
      monthlyJpy: 0,
      callsLast30: 0,
      sparkline: [50, 45, 30, 20, 10, 0, 0],
      lastCalledAt: new Date(now - 14 * 24 * 60 * 60_000).toISOString(),
      postedAt: "2025-10-15T16:00:00Z",
    },
  ];
}

export function summarize(assets: PortfolioAsset[]): PortfolioSummary {
  return {
    active:    assets.filter((a) => a.status === "active").length,
    reviewing: assets.filter((a) => a.status === "reviewing").length,
    paused:    assets.filter((a) => a.status === "paused").length,
    total:     assets.length,
  };
}

export function sortAssets(assets: PortfolioAsset[], key: SortKey): PortfolioAsset[] {
  return [...assets].sort((a, b) => {
    switch (key) {
      case "monthly":    return b.monthlyJpy - a.monthlyJpy;
      case "calls":      return b.callsLast30 - a.callsLast30;
      case "lastCalled": return new Date(b.lastCalledAt).getTime() - new Date(a.lastCalledAt).getTime();
      case "postedAt":   return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    }
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "たった今";
  if (mins < 60) return `${mins} 分前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} 時間前`;
  const days = Math.floor(hrs / 24);
  return `${days} 日前`;
}
