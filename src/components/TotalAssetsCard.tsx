"use client";

import { useState, useEffect, useRef, useId } from "react";
import { getTotalPortfolio } from "@/lib/portfolio";
import { incomeStream } from "@/lib/income-stream";
import type { IncomeEvent } from "@/lib/income-stream";

// ─── SVG Donut chart helpers ──────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number, cy: number, R: number, r: number,
  startDeg: number, endDeg: number,
): string {
  const delta = endDeg - startDeg;
  if (delta >= 360) {
    const m = startDeg + 180;
    return arcPath(cx, cy, R, r, startDeg, m) + " " + arcPath(cx, cy, R, r, m, startDeg + 359.99);
  }
  const s  = polarToCartesian(cx, cy, R, startDeg);
  const e  = polarToCartesian(cx, cy, R, endDeg);
  const si = polarToCartesian(cx, cy, r, endDeg);
  const ei = polarToCartesian(cx, cy, r, startDeg);
  const large = delta > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return `M ${f(s.x)} ${f(s.y)} A ${R} ${R} 0 ${large} 1 ${f(e.x)} ${f(e.y)} L ${f(si.x)} ${f(si.y)} A ${r} ${r} 0 ${large} 0 ${f(ei.x)} ${f(ei.y)} Z`;
}

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const CX = 50, CY = 50, R = 42, r = 26;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let currentDeg = 0;

  const paths = segments.map((seg) => {
    const sweep = (seg.value / total) * 360;
    const path = arcPath(CX, CY, R, r, currentDeg, currentDeg + sweep - 0.5);
    currentDeg += sweep;
    return { ...seg, path };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      width={96}
      height={96}
      role="img"
      aria-label="資産の内訳"
      className="flex-shrink-0"
    >
      <title>資産の内訳ドーナツチャート</title>
      {paths.map((seg) => (
        <path key={seg.label} d={seg.path} fill={seg.color} />
      ))}
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize={8} fill="#6B6456" fontWeight="600">
        内訳
      </text>
      <text x={CX} y={CY + 6} textAnchor="middle" fontSize={7} fill="#9890A8">
        3区分
      </text>
    </svg>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function TotalAssetsCard() {
  const portfolio = getTotalPortfolio();
  const [balance, setBalance] = useState(portfolio.currentBalanceJpy);
  const lastUpdateRef = useRef(0);
  const tipId = useId();
  const [tipVisible, setTipVisible] = useState(false);

  useEffect(() => {
    const handler = (evt: IncomeEvent) => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= 10_000) {
        lastUpdateRef.current = now;
        setBalance((b) => Math.round(b + evt.amountJpy));
      }
    };
    incomeStream.subscribe(handler);
    return () => incomeStream.unsubscribe(handler);
  }, []);

  const isPositive = portfolio.monthlyChangePct >= 0;

  const donutSegments: DonutSegment[] = [
    { value: portfolio.breakdown.current,   color: "#0E9F4F", label: "現在の残高" },
    { value: portfolio.breakdown.running,   color: "#D4AF37", label: "運用評価" },
    { value: portfolio.breakdown.withdrawn, color: "#C8C0B0", label: "累計引出" },
  ];

  return (
    <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-3xl shadow-sm p-6 sm:p-8 mb-6 sm:mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full bg-[var(--primary,#06B6D4)] flex-shrink-0" />
        <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">総資産</p>
        <div className="relative">
          <button
            type="button"
            aria-describedby={tipId}
            onClick={() => setTipVisible((v) => !v)}
            onBlur={() => setTipVisible(false)}
            className="w-4 h-4 rounded-full bg-[var(--n-surface-2,#F5F3EE)] text-slate-400 text-[10px] font-bold flex items-center justify-center hover:bg-[var(--n-divider,rgba(0,0,0,0.08))] transition-colors"
          >
            ？
          </button>
          {tipVisible && (
            <span
              id={tipId}
              role="tooltip"
              className="absolute left-6 top-0 z-10 w-52 rounded-xl bg-[#1A1714] text-white text-[11px] leading-snug px-3 py-2 shadow-lg"
            >
              現在の残高と運用中の資産価値の合計です
            </span>
          )}
        </div>
      </div>

      {/* Main balance */}
      <div className="mb-5">
        <p className="text-sm text-slate-400 mb-1">現在の残高</p>
        <p
          aria-live="polite"
          aria-atomic="true"
          data-testid="balance-prime"
          className="metric-prime-white"
          style={{ fontSize: "2.25rem", lineHeight: 1.05 }}
        >
          ¥{balance.toLocaleString("ja-JP")}
        </p>
      </div>

      {/* Sub metrics — responsive: stacked on mobile, 3-col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-[#1E293B] rounded-2xl px-4 py-3">
          <p className="text-[10px] text-slate-400 mb-1">累計報酬</p>
          <p className="metric-prime" style={{ fontSize: "1.25rem" }}>
            ¥{portfolio.lifetimeEarningsJpy.toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="bg-[#1E293B] rounded-2xl px-4 py-3">
          <p className="text-[10px] text-slate-400 mb-1">運用資産の評価額</p>
          <p className="metric-prime" style={{ fontSize: "1.25rem" }}>
            ¥{portfolio.runningAssetValueJpy.toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="bg-[#1E293B] rounded-2xl px-4 py-3">
          <p className="text-[10px] text-slate-400 mb-1">今月の伸び</p>
          <p
            className={`text-xl font-semibold tabular-nums tracking-tight ${
              isPositive ? "text-ai-action" : "text-[#F87171]"
            }`}
          >
            {isPositive ? "+" : ""}¥{portfolio.monthlyChangeJpy.toLocaleString("ja-JP")}
            <span className="text-sm ml-1">
              ({isPositive ? "+" : ""}{portfolio.monthlyChangePct}%)
            </span>
          </p>
        </div>
      </div>

      {/* Donut chart + legend */}
      <div className="flex items-center gap-4 sm:gap-6">
        <DonutChart segments={donutSegments} />
        <ul className="space-y-1.5 text-xs flex-1">
          {donutSegments.map((seg) => (
            <li key={seg.label} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[var(--n-muted,#6B6456)] flex-1">{seg.label}</span>
              <span className="tabular-nums font-semibold text-[var(--n-text,#1A1714)]">
                ¥{seg.value.toLocaleString("ja-JP")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
