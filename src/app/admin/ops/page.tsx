"use client";

import { AlertTriangle } from "lucide-react";
import { PipelineStepper } from "@/components/ui/PipelineStepper";

// Deterministic 7-day series for the trend chart. Values are
// percentages (response success rate) — render as a static SVG
// area chart, never animated.
const TREND_7D = [98.6, 99.1, 99.0, 98.4, 99.3, 99.5, 99.2];

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
}

function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <div
      data-testid="ops-kpi"
      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--color-text-primary)] metric-prime">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)] tabular-nums">
          {hint}
        </p>
      )}
    </div>
  );
}

function TrendChart({ data }: { data: readonly number[] }) {
  if (data.length === 0) return null;
  const W = 600;
  const H = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(0.5, max - min);
  const stepX = W / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = H - ((v - min) / range) * (H - 12) - 6;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="直近 7 日の応答成功率の推移"
      data-testid="ops-trend-chart"
      className="w-full h-32"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="ops-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="#4F46E5" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#ops-fill)" />
      <path d={path} fill="none" stroke="#4F46E5" strokeWidth="2" />
    </svg>
  );
}

export default function OpsDashboardPage() {
  // Static demo metrics — deterministic so the page never flickers.
  const responseRate    = "99.2%";
  const successRate     = "97.8%";
  const monthlyCalls    = "2,481,329";

  // Latest alert (single, prominent banner).
  const alert = {
    severity: "high" as const,
    title:    "推論おしごと窓口の p95 レイテンシが 800ms を超えました",
    detected: "2 分前",
    runbook:  "/admin/ops/runbook/p95-latency",
  };

  return (
    <main className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] min-h-screen min-h-dvh px-5 sm:px-8 py-8 max-w-5xl mx-auto">
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1
            data-testid="ops-h1"
            className="text-2xl font-bold tracking-tight"
          >
            監視ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            応答率・成功率・月間コール数を一目で確認します。
          </p>
        </div>
      </header>

      {/* 3 KPI cards */}
      <section
        data-testid="ops-kpi-row"
        aria-labelledby="ops-kpi-label"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
      >
        <h2 id="ops-kpi-label" className="sr-only">主要指標</h2>
        <KpiCard label="応答率"     value={responseRate} hint="直近 24 時間" />
        <KpiCard label="成功率"     value={successRate}  hint="直近 24 時間" />
        <KpiCard label="月間コール" value={monthlyCalls} hint="今月累計" />
      </section>

      {/* Latest alert banner */}
      <section
        data-testid="ops-alert"
        role="alert"
        aria-live="polite"
        className="rounded-2xl border border-[var(--color-ai-negative)]/40 bg-[#FEF2F2] p-5 mb-6"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-ai-negative)] text-white"
          >
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-ai-negative)]">
              障害アラート
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--color-text-primary)] leading-snug">
              {alert.title}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              検知：{alert.detected}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <section
          data-testid="ops-trend"
          aria-labelledby="ops-trend-label"
          className="lg:col-span-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5"
        >
          <h2 id="ops-trend-label" className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            応答成功率（直近 7 日）
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            日次で集計した成功率の推移を表示します。
          </p>
          <TrendChart data={TREND_7D} />
          <ul className="mt-2 grid grid-cols-7 gap-1 text-[10px] text-[var(--color-text-muted)] tabular-nums">
            {TREND_7D.map((v, i) => (
              <li key={i} className="text-center">
                {v.toFixed(1)}%
              </li>
            ))}
          </ul>
        </section>

        {/* Side stepper + CTA */}
        <aside className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            対応ステップ
          </h2>
          <PipelineStepper
            ariaLabel="観測 → 検知 → 対応"
            steps={[
              { label: "観測",   done: true },
              { label: "検知",   active: true },
              { label: "対応",   todo: true },
            ]}
          />
          <button
            type="button"
            data-testid="ops-respond-cta"
            aria-label="アラートに対応します"
            className="mt-4 w-full inline-flex items-center justify-center h-12 rounded-lg bg-[var(--color-ai-action)] text-white font-semibold hover:bg-[#4338CA] focus:outline focus:outline-2 focus:outline-[var(--color-ai-action)]"
          >
            対応します
          </button>
        </aside>
      </div>
    </main>
  );
}
