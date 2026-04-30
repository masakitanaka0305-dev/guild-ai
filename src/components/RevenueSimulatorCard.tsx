"use client";

import { useMemo } from "react";
import { simulateRevenue } from "@/lib/revenue-simulator";
import type { SimulatorInput } from "@/lib/revenue-simulator";

// ─── 30-day mini line chart ───────────────────────────────────────────────────

function DayChart({ data }: { data: number[] }) {
  const W = 240, H = 48;
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - (v / max) * (H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="30日間の想定収益推移"
      className="w-full"
    >
      <title>30日間の想定収益推移</title>
      <polyline
        points={pts}
        fill="none"
        stroke="#E64545"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

// ─── Simulator Card ───────────────────────────────────────────────────────────

import type { Rank } from "@/types";

interface Props {
  rank: Rank;
  floorPrice: number;
  title?: string;
}

export function RevenueSimulatorCard({ rank, floorPrice, title = "" }: Props) {
  const input: SimulatorInput = useMemo(() => {
    // infer category from title keywords
    const lower = title.toLowerCase();
    let category = "default";
    for (const key of ["typescript", "rust", "python", "llm", "prompt", "css", "sql", "react", "go"]) {
      if (lower.includes(key)) { category = key; break; }
    }
    const perCallJpy = Math.max(0.1, floorPrice / 10_000);
    return { rank, perCallJpy, category, ccafScore: 72 };
  }, [rank, floorPrice, title]);

  const sim = useMemo(() => simulateRevenue(input), [input]);

  return (
    <div
      className="rounded-2xl border border-[var(--n-gold,#D4AF37)]/40 bg-[#FFFDF5] p-4"
      aria-label="想定収益シミュレーター"
    >
      {/* Header */}
      <p className="text-xs font-bold text-[var(--n-gold,#D4AF37)] mb-2 tracking-wide">
        あなたの想定収益
      </p>

      {/* Main range */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-[10px] text-[var(--n-muted,#6B6456)]">月</span>
        <span className="text-2xl font-black tabular-nums text-[var(--n-primary,#E64545)]">
          ¥{sim.p10Jpy.toLocaleString("ja-JP")}
        </span>
        <span className="text-sm text-[var(--n-muted,#6B6456)] font-semibold">〜</span>
        <span className="text-2xl font-black tabular-nums text-[var(--n-primary,#E64545)]">
          ¥{sim.p90Jpy.toLocaleString("ja-JP")}
        </span>
      </div>
      <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-3">
        中央値 ¥{sim.monthlyMedianJpy.toLocaleString("ja-JP")} ·
        想定コール数 {sim.expectedCalls.toLocaleString("ja-JP")} 回/月
      </p>

      {/* 30-day chart */}
      <DayChart data={sim.distributionByDay} />

      {/* Caption */}
      <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-1 leading-relaxed">
        直近 30 日の API トラフィックから推計。実績で変動します。
      </p>
    </div>
  );
}
