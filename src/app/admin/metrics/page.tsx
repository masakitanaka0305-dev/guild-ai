"use client";

import { useEffect, useState } from "react";
import { getAllRuns, getMedianRunSeconds, getP95RunSeconds, recordExpressRun } from "@/lib/metrics/express";
import type { ExpressRunRecord } from "@/lib/metrics/express";

export default function AdminMetricsPage() {
  const [runs, setRuns] = useState<ExpressRunRecord[]>([]);
  const [median, setMedian] = useState(0);
  const [p95, setP95] = useState(0);

  useEffect(() => {
    // Seed with demo data if store is empty
    if (getAllRuns().length === 0) {
      const seeds = [43, 51, 67, 38, 72, 55, 49, 61, 44, 58];
      seeds.forEach((s, i) => recordExpressRun(`demo_${i}`, s));
    }
    setRuns(getAllRuns().slice(-100));
    setMedian(getMedianRunSeconds());
    setP95(getP95RunSeconds());
  }, []);

  const budget = 180;
  const withinBudget = runs.filter((r) => r.seconds < budget).length;
  const pct = runs.length > 0 ? Math.round((withinBudget / runs.length) * 100) : 0;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
      <p className="text-xs text-[var(--n-muted,#6B6456)] mb-1">管理用 · 非公開</p>
      <h1 className="text-xl font-black text-[var(--n-text,#1A1714)] mb-6">
        Express Path メトリクス
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "中央値", value: `${median}s`, sub: "秒" },
          { label: "p95", value: `${p95}s`, sub: "秒" },
          { label: "3分以内", value: `${pct}%`, sub: "達成率" },
          { label: "件数", value: String(runs.length), sub: "直近100件" },
        ].map((stat) => (
          <div key={stat.label} className="section-card p-4 text-center">
            <p className="text-xs text-[var(--n-muted,#6B6456)] mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-[var(--primary,#4C1D95)]">{stat.value}</p>
            <p className="text-[10px] text-[var(--n-muted,#6B6456)]">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="section-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--n-divider,rgba(0,0,0,0.06))]">
          <p className="text-xs font-bold text-[var(--n-text,#1A1714)]">直近実行ログ</p>
        </div>
        <div className="divide-y divide-[var(--n-divider,rgba(0,0,0,0.04))]">
          {runs.slice(-20).reverse().map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2">
              <span className="text-xs text-[var(--n-muted,#6B6456)] font-mono">{r.handle}</span>
              <span className={`text-xs font-bold ${r.seconds < budget ? "text-green-600" : "text-red-500"}`}>
                {r.seconds}s
              </span>
            </div>
          ))}
          {runs.length === 0 && (
            <p className="px-4 py-4 text-xs text-[var(--n-muted,#6B6456)]">データなし</p>
          )}
        </div>
      </div>
    </main>
  );
}
