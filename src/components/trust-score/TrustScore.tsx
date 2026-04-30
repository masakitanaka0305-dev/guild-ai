"use client";

// GUILD AI — TrustScore UI component
// Renders the dynamic Trust Score (0-1000) along with rank badge and breakdown.
// Spec: docs/マスター設計図.md §4.

import { useMemo } from "react";
import type { TrustScoreInput } from "@/types";
import { computeTrustScore } from "@/lib/trust-score";

export interface TrustScoreProps {
  input: TrustScoreInput;
  ownerName?: string;
  className?: string;
}

const rankColor: Record<string, string> = {
  S: "bg-kaki text-white",
  A: "bg-zinc-300 text-white",
  B: "bg-amber-700 text-white"
};

export function TrustScore({ input, ownerName = "Owner", className = "" }: TrustScoreProps) {
  const result = useMemo(() => computeTrustScore(input), [input]);

  return (
    <section
      className={`section-card p-5 ${className}`}
      aria-label="Trust Score"
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400">Trust Score</p>
          <h3 className="text-sm font-semibold text-white mt-0.5">{ownerName}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${rankColor[result.rank]}`}
          aria-label={`Rank ${result.rank}`}
        >
          {result.rank}
        </span>
      </header>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-white tabular-nums">{result.score}</span>
        <span className="text-sm text-slate-400">/ 1000</span>
      </div>

      <dl className="mt-4 space-y-2.5">
        <Bar label="品質履歴" value={input.qualityHistory} weight={0.5} />
        <Bar label="Discord 貢献" value={input.discordContribution} weight={0.3} />
        <Bar label="X 拡散" value={input.xAmplification} weight={0.2} />
      </dl>

      <p className="mt-3 text-[11px] text-slate-400">
        最終更新: {new Date(result.updatedAt).toLocaleString("ja-JP")}
      </p>
    </section>
  );
}

function Bar({ label, value, weight }: { label: string; value: number; weight: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between text-xs text-[#E2E8F0]">
        <dt>
          {label} <span className="text-slate-400">×{weight}</span>
        </dt>
        <dd className="tabular-nums font-medium">{Math.round(pct)}</dd>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-kuroko/10">
        <div
          className="h-1.5 rounded-full bg-kaki"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export default TrustScore;
