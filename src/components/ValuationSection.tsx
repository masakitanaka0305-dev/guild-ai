"use client";

import { RankRadar } from "@/components/RankRadar";
import type { Rank } from "@/types";

interface ValuationSectionProps {
  rank: Rank;
  floorPrice: number;
  thoughtDensity: number;
  iterations: number;
  uptimeDays: number;
  justification?: string;
}

export function ValuationSection({
  rank,
  floorPrice,
  thoughtDensity,
  iterations,
  uptimeDays,
  justification,
}: ValuationSectionProps) {
  return (
    <section className="mt-4 section-card p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        知能の品質ランク
      </h2>

      <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-start gap-6">
        <RankRadar
          thoughtDensity={thoughtDensity}
          iterations={iterations}
          uptimeDays={uptimeDays}
          size={200}
        />
        <div className="flex-1 space-y-3">
          {justification && (
            <p className="text-sm text-text-primary leading-relaxed">{justification}</p>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-400">お値段の目安</span>
            <span className="text-2xl font-bold tabular-nums text-white">
              ¥{floorPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
