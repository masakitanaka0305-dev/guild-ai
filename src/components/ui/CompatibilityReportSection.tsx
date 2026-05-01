// GUILD AI — Intelligence Compatibility Report (Pre-Check) section.
//
// Surfaces a single percentage + a personalised context line + supporting
// pills above the Connected Intelligence Assets card. Renders only via
// pre-built data (no client-side computation).

import type { CompatibilityReport } from "@/lib/compatibility-report";

interface CompatibilityReportSectionProps {
  report: CompatibilityReport;
}

export function CompatibilityReportSection({ report }: CompatibilityReportSectionProps) {
  const tip =
    "事前診断（Pre-Check）：実際の参画前に、ノート資産と要件の整合性を可視化します。";
  return (
    <section
      role="region"
      aria-labelledby="compat-h"
      data-testid="intelligence-compatibility-report"
      data-component="intelligence-compatibility-report"
      className="rounded-2xl border border-white/10 bg-midnight-surface border-l-4 border-l-brand-primary p-5 sm:p-6 mb-4"
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <h2
          id="compat-h"
          className="text-white font-semibold text-base sm:text-lg leading-snug"
        >
          Intelligence Compatibility Report
        </h2>
        <span
          aria-describedby="compat-h"
          title={tip}
          className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/5 text-slate-400 text-[11px] cursor-help"
        >
          ?
        </span>
      </header>

      <div className="flex items-baseline gap-3 flex-wrap">
        <p
          data-testid="compat-percent"
          className="text-brand-primary metric-prime tabular-nums"
        >
          Compatibility {Math.max(0, Math.min(100, report.percent))}%
        </p>
        <p className="text-slate-400 text-xs tabular-nums">
          マッチ {report.matched} / {report.total} 件
        </p>
      </div>

      <p
        data-testid="compat-context-sentence"
        className="mt-3 text-slate-200 text-sm leading-relaxed"
      >
        {report.contextSentence}
      </p>

      <p className="mt-2 text-slate-400 text-xs leading-relaxed max-w-prose">
        この事前診断は、人間が参画する際のミスマッチを減らし、オンボーディングを加速させるためのものです。
      </p>

      <ul
        data-testid="compat-pills"
        aria-label="適合状況"
        className="mt-4 flex flex-wrap items-center gap-2 text-[11px]"
      >
        {report.fulfilled.length > 0 && (
          <li>
            <span
              data-testid="compat-pill-fulfilled"
              aria-label={`充足要件 ${report.fulfilled.join(", ")}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 px-2 py-0.5"
            >
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              充足要件：{report.fulfilled.join(", ")}
            </span>
          </li>
        )}
        {report.unfulfilled.length > 0 && (
          <li>
            <span
              data-testid="compat-pill-unfulfilled"
              aria-label={`未充足 ${report.unfulfilled.join(", ")}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/30 px-2 py-0.5"
            >
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              未充足：{report.unfulfilled.join(", ")}
            </span>
          </li>
        )}
        {report.bonus && (
          <li>
            <span
              data-testid="compat-pill-bonus"
              aria-label={`ボーナス ${report.bonus}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/30 px-2 py-0.5"
            >
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
              ボーナス：{report.bonus}
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}
