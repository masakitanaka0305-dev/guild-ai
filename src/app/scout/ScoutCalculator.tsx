"use client";

import { useState } from "react";
import { simulateRevenue } from "@/lib/revenue-simulator";

// USD exchange rate mock (1 JPY ≈ 0.0067 USD)
const JPY_TO_USD = 0.0067;

function jpy2usd(jpy: number): string {
  return (jpy * JPY_TO_USD).toFixed(0);
}

export function ScoutCalculator() {
  const [stars, setStars] = useState("");
  const [result, setResult] = useState<{ low: string; high: string; median: string } | null>(null);

  function calculate() {
    const n = parseInt(stars, 10);
    if (!n || n < 1) return;

    // Estimate rank based on star count
    const rank = n >= 1000 ? "S" : n >= 100 ? "A" : "B";
    // Estimate price per call: ~¥3 for A/S, ¥1 for B
    const perCall = rank === "S" ? 5 : rank === "A" ? 3 : 1;
    const category = "typescript"; // default global-friendly category
    const ccafScore = Math.min(80, Math.round((n / 1000) * 40 + 30));

    const sim = simulateRevenue({ rank, perCallJpy: perCall, category, ccafScore });
    setResult({
      low: jpy2usd(sim.p10Jpy),
      high: jpy2usd(sim.p90Jpy),
      median: jpy2usd(sim.monthlyMedianJpy),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="number"
          min="1"
          placeholder="e.g. 500"
          value={stars}
          onChange={(e) => setStars(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && calculate()}
          className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#B5860A]"
          aria-label="Your GitHub star count"
        />
        <button
          onClick={calculate}
          className="rounded-xl bg-[#B5860A] px-6 py-3 font-bold text-white hover:bg-yellow-600 transition-colors active:scale-95"
          aria-label="Calculate estimated income"
        >
          Calculate
        </button>
      </div>

      {result && (
        <div className="rounded-2xl border border-[#B5860A]/40 bg-[#B5860A]/10 p-5 text-left">
          <p className="text-xs text-slate-400 mb-1">Estimated monthly royalty</p>
          <p className="text-3xl font-extrabold text-[#B5860A]">
            ${result.low}–${result.high}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Median: <span className="text-white font-semibold">${result.median}/mo</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-3">
            * Estimate based on rank, category, and historical API call patterns. Actual earnings vary.
          </p>
        </div>
      )}
    </div>
  );
}
