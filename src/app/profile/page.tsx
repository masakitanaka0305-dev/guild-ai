"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";
import { RankShield } from "@/components/RankShield";
import { HexRankBadge } from "@/components/ui/HexRankBadge";
import { aggregateRoyalty } from "@/lib/intelligence-balance";
import { ComplexityMeter } from "@/components/ComplexityMeter";
import { AreaChart } from "@/components/AreaChart";
import { ImpactCard } from "@/components/ImpactCard";
import {
  getDailyUsage, getWeeklyUsage, getLifetimeUsage,
  getDeltas, getLockUnlockedRewards, getUsageHistory,
} from "@/lib/api-usage";
import { getComplexityBreakdown } from "@/lib/complexity-score";
import { getMyAssets } from "@/lib/portfolio";
import { getImpactStats } from "@/lib/impact";
import { getMicroBalance } from "@/lib/shima-ledger";
import { getRecentSettlements, getSettlementSummary, seedDemoSettlements, CURRENCY_LABELS, type Currency } from "@/lib/global-settlement";
import { getTierUsageBreakdown } from "@/lib/individual-tier";
import { screenSubmission } from "@/lib/originality-watch";
import { useUserId } from "@/components/AuthProvider";

function formatMilliDisplay(milliJpy: number): string {
  const jpy = milliJpy / 1_000;
  const intPart = Math.floor(jpy).toLocaleString("ja-JP");
  const frac = (jpy % 1).toFixed(2).slice(1);
  return `¥${intPart}${frac}`;
}

// ─── Monogram circle ─────────────────────────────────────────────────────────

function Monogram({ handle }: { handle: string }) {
  const initials = handle.slice(0, 2).toUpperCase();
  const hue = (handle.charCodeAt(0) * 37 + handle.charCodeAt(1 % handle.length) * 13) % 360;
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0 select-none"
      style={{ backgroundColor: `hsl(${hue},55%,38%)` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ─── Revenue block ───────────────────────────────────────────────────────────

function RevenueBlock({
  label, jpy, calls, deltaPct,
}: { label: string; jpy: number; calls: number; deltaPct?: number }) {
  const positive = (deltaPct ?? 0) >= 0;
  return (
    <div className="bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl px-4 py-4 flex-shrink-0 min-w-[140px]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--n-muted,#6B6456)] mb-2">
        {label}
      </p>
      <p className="text-2xl font-extrabold tabular-nums text-[var(--n-text,#1A1714)] leading-none">
        ¥{jpy.toLocaleString("ja-JP")}
      </p>
      <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-1 tabular-nums">
        {calls.toLocaleString("ja-JP")} コール
      </p>
      {deltaPct !== undefined && (
        <span
          className={`inline-block mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            positive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {positive ? "+" : ""}{deltaPct}%
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Tabs ────────────────────────────────────────────────────────────────────

type TabId = "status" | "md" | "activity";
const TABS: { id: TabId; label: string }[] = [
  { id: "status",   label: "ステータス" },
  { id: "md",       label: "登記済み MD" },
  { id: "activity", label: "活動履歴" },
];

export default function ProfilePage() {
  const handle = useUserId();
  const [activeTab, setActiveTab] = useState<TabId>("status");
  const [copied, setCopied] = useState(false);
  const daily    = getDailyUsage(handle);
  const weekly   = getWeeklyUsage(handle);
  const lifetime = getLifetimeUsage(handle);
  const deltas   = getDeltas(handle);
  const lockReward = getLockUnlockedRewards(handle);
  const history  = getUsageHistory(handle);
  const complexity = getComplexityBreakdown(handle);
  const assets   = getMyAssets();
  const topRank  = assets.find((a) => a.status === "active") ? "S" : "A";
  const activeCount = assets.filter((a) => a.status === "active").length;
  const totalCalls  = assets.reduce((s, a) => s + a.callsLast30, 0);
  const impact = getImpactStats(handle);
  const microBalance = getMicroBalance(handle);
  seedDemoSettlements();
  const settlementSummary = getSettlementSummary(24);
  const recentSettlements = getRecentSettlements(5);
  const totalSettledJpy = Object.values(settlementSummary).reduce((s, v) => s + v, 0);
  const tierBreakdown = getTierUsageBreakdown(totalCalls * 15 / 100, totalCalls * 45 / 100, totalCalls * 40 / 100);

  const cumulativeJpy = daily.jpy + weekly.jpy + lifetime.jpy;
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`@${handle}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard API unavailable in test env — silently ignore */
    }
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8 pb-24 sm:pb-12">
      <h1 className="sr-only">プロフィール</h1>

      <Link href="/guild" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline mb-4 inline-block">
        ← 運用に戻る
      </Link>

      {/* ── Profile header ─────────────────────────────────────────── */}
      <header
        data-testid="profile-header"
        className="mb-5 rounded-2xl border border-white/10 bg-[#162035] p-5"
      >
        <div className="flex items-start gap-4">
          <HexRankBadge rank={topRank as "S" | "A" | "B"} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-semibold text-2xl leading-tight truncate">
              @{handle}
            </h2>
            <button
              type="button"
              onClick={onCopy}
              aria-label="ハンドルをコピー"
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400"
            >
              <Copy aria-hidden className="w-3 h-3" />
              {copied ? "コピーしました" : "ハンドルをコピー"}
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[#CBD5E1] text-xs uppercase tracking-wide">累計報酬 ¥</p>
            <p data-testid="profile-cumulative-jpy" className="text-cyan-400 metric-prime">
              ¥{cumulativeJpy.toLocaleString("ja-JP")}
            </p>
          </div>
          <div>
            <p className="text-[#CBD5E1] text-xs uppercase tracking-wide">稼働中 MD</p>
            <p data-testid="profile-active-md" className="text-cyan-400 metric-prime">
              {activeCount}
            </p>
          </div>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="プロフィール切替"
        data-testid="profile-tablist"
        className="flex border-b border-white/10 mb-5 gap-2"
      >
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`tabpanel-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`relative px-3 py-2 text-sm font-semibold ${
                active ? "text-cyan-400" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-cyan-400"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── ステータス tab ─────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="tabpanel-status"
        aria-labelledby="tab-status"
        hidden={activeTab !== "status"}
      >

      {/* ── Intelligence Balance — predicted royalty range ─────────── */}
      {(() => {
        // Map the user's portfolio assets into balance inputs. Density is
        // approximated from monthly revenue so heavy-traffic MDs nudge the
        // prediction up. In production this would be replaced with the
        // real grading density per MD.
        const items = assets.map((a) => ({
          rank: (a.status === "active" ? "A" : "B") as "A" | "B",
          density: Math.min(100, Math.round(a.monthlyJpy / 200)),
        }));
        const royalty = aggregateRoyalty(items);
        return (
          <section
            data-testid="intelligence-balance"
            className="rounded-2xl border border-cyan-400/30 bg-[#162035] p-5 mb-6 border-l-4 border-l-cyan-400/60"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              Intelligence Balance
            </p>
            <p className="mt-1 text-white text-sm font-semibold">
              予測印税（月額シミュレーション）
            </p>
            <p
              data-testid="intelligence-balance-central"
              className="mt-2 text-cyan-400 metric-prime"
            >
              ¥{royalty.perMonthJpy.toLocaleString("ja-JP")}
            </p>
            <p className="mt-1 text-xs text-slate-400 tabular-nums">
              保守 ¥{royalty.conservativeJpy.toLocaleString("ja-JP")}
              {" 〜 楽観 "}
              ¥{royalty.optimisticJpy.toLocaleString("ja-JP")}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              過去のロイヤリティ実績と類似度から推定（シミュレーション）。
            </p>
          </section>
        );
      })()}

      {/* ── 1. 収益サマリ（ヒーロー） ──────────────────────────────── */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-3">API 利用料の収益</h2>

        {/* 3ブロック + Lock報酬 (横スクロール on mobile, 3 col on sm+) */}
        <div className="flex sm:grid sm:grid-cols-4 gap-3 overflow-x-auto pb-1">
          <RevenueBlock label="本日"  jpy={daily.jpy}    calls={daily.calls}    deltaPct={deltas.dailyPct} />
          <RevenueBlock label="今週"  jpy={weekly.jpy}   calls={weekly.calls}   deltaPct={deltas.weeklyPct} />
          <RevenueBlock label="累計"  jpy={lifetime.jpy} calls={lifetime.calls} />
          <div className="bg-[var(--n-text,#1A1714)] rounded-2xl px-4 py-4 flex-shrink-0 min-w-[140px]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--n-gold,#D4AF37)] mb-2">
              Lock 報酬解除
            </p>
            <p className="text-2xl font-extrabold tabular-nums text-[var(--n-gold,#D4AF37)] leading-none">
              ¥{lockReward.jpy.toLocaleString("ja-JP")}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Genesis 遡及解禁</p>
          </div>
        </div>

        {/* 30-day area chart */}
        <div className="mt-3 h-16 rounded-2xl overflow-hidden bg-[var(--n-surface-2,#F5F3EE)] px-2 py-1">
          <AreaChart data={history} title="直近30日のAPI利用料推移" />
        </div>

        {/* 端数残高 (1-line summary) */}
        <div className="mt-2 flex items-center justify-between px-4 py-2 bg-[var(--n-surface-2,#F5F3EE)] rounded-xl">
          <span className="text-[10px] text-[var(--n-muted,#6B6456)]">端数残高</span>
          <span className="text-xs font-bold tabular-nums text-[var(--n-gold,#D4AF37)]">
            {formatMilliDisplay(microBalance.totalMilliJpy)}
          </span>
        </div>

        {/* ティア別利用 donut */}
        {(() => {
          const { hobby, proIndie, enterprise, total } = tierBreakdown;
          const r = 30;
          const circ = 2 * Math.PI * r;
          const safe = total > 0 ? total : 1;
          const hobbyLen = (hobby / safe) * circ;
          const proLen   = (proIndie / safe) * circ;
          const entLen   = (enterprise / safe) * circ;
          const o0 = circ / 4;
          const o1 = circ / 4 - hobbyLen;
          const o2 = circ / 4 - hobbyLen - proLen;
          const rows = [
            { label: "Hobby",      color: "#0E9F4F", calls: hobby },
            { label: "Pro Indie",  color: "#06B6D4", calls: proIndie },
            { label: "Enterprise", color: "#D4AF37", calls: enterprise },
          ];
          return (
            <div className="mt-3 flex items-center gap-4 bg-[var(--n-surface-2,#F5F3EE)] rounded-xl px-4 py-3">
              <svg width="72" height="72" viewBox="0 0 88 88" role="img" aria-label="ティア別利用比率" className="flex-shrink-0">
                <title>ティア別利用比率</title>
                <circle cx="44" cy="44" r={r} fill="none" stroke="#E9E7E1" strokeWidth="16" />
                <circle cx="44" cy="44" r={r} fill="none" stroke="#0E9F4F" strokeWidth="16"
                  strokeDasharray={`${hobbyLen} ${circ - hobbyLen}`} strokeDashoffset={o0} />
                <circle cx="44" cy="44" r={r} fill="none" stroke="#06B6D4" strokeWidth="16"
                  strokeDasharray={`${proLen} ${circ - proLen}`} strokeDashoffset={o1} />
                <circle cx="44" cy="44" r={r} fill="none" stroke="#D4AF37" strokeWidth="16"
                  strokeDasharray={`${entLen} ${circ - entLen}`} strokeDashoffset={o2} />
              </svg>
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--n-muted,#6B6456)] mb-1.5">ティア別利用</p>
                <div className="space-y-1">
                  {rows.map(({ label, color, calls }) => {
                    const pct = Math.round((calls / safe) * 100);
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-[10px] text-[var(--n-muted,#6B6456)] flex-1">{label}</span>
                        <span className="text-[10px] font-bold tabular-nums text-[var(--n-text,#1A1714)]">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── 2. プロ識別バッジ列 ────────────────────────────────────── */}
      <section className="mb-6 bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-4">プロとしての実績</h2>

        <div className="flex items-start gap-5 mb-5">
          {/* Rank shield */}
          <div className="flex flex-col items-center gap-1">
            <RankShield rank={topRank as "S" | "A" | "B"} size={64} />
            <p className="text-[10px] text-[var(--n-muted,#6B6456)]">鑑定バッジ</p>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-black tabular-nums text-[var(--n-text,#1A1714)]">{complexity.jobsCompleted}</p>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">完了案件</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tabular-nums text-[var(--n-text,#1A1714)]">{totalCalls.toLocaleString("ja-JP")}</p>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">月間コール</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tabular-nums text-[var(--n-text,#1A1714)]">{activeCount}</p>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">鑑定済 件</p>
            </div>
          </div>
        </div>

        {/* Complexity meter */}
        <ComplexityMeter score={complexity.score} label={complexity.label} />
      </section>

      </div>{/* /tabpanel ステータス */}

      {/* ── 登記済み MD tab ───────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="tabpanel-md"
        aria-labelledby="tab-md"
        hidden={activeTab !== "md"}
      >
        <section className="rounded-2xl border border-white/10 bg-[#162035] p-5 mb-4">
          <p className="text-white font-semibold mb-1">登記済み MD（{activeCount} 件）</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            登記済みの知能資産は <Link href="/guild" className="text-cyan-400 underline-offset-4 hover:underline">マイ銀行</Link> に一覧表示されます。
            鑑定状況・呼び出し数・収益はマイ銀行の Asset Portfolio から確認できます。
          </p>
        </section>
      </div>

      {/* ── 活動履歴 tab ─────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="tabpanel-activity"
        aria-labelledby="tab-activity"
        hidden={activeTab !== "activity"}
      >
      <ImpactCard
        savedProjects={impact.savedProjects}
        contributionScore={impact.contributionScore}
        thisMonthRank={impact.ranks.thisMonth}
        allTimeRank={impact.ranks.allTime}
      />

      {/* ── 2c. グローバル着金 ─────────────────────────────────────── */}
      <section className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-[var(--primary,#06B6D4)] flex-shrink-0" />
          <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">グローバル着金</p>
          <span className="text-[10px] text-[var(--n-muted,#6B6456)]">直近24h</span>
        </div>

        {/* 4-currency grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {(["JPY", "USD", "EUR", "GBP"] as Currency[]).map((cur) => (
            <div key={cur} className="bg-[var(--n-surface-2,#F5F3EE)] rounded-xl px-3 py-2.5 text-center">
              <p
                className="text-[10px] font-bold text-[var(--n-muted,#6B6456)] mb-1"
                aria-label={`${cur}: ${CURRENCY_LABELS[cur]}`}
              >
                {cur}
              </p>
              <p className="text-sm font-extrabold tabular-nums text-[var(--n-text,#1A1714)]">
                ¥{Math.round(settlementSummary[cur]).toLocaleString("ja-JP")}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between mb-3 px-3 py-2 bg-[var(--n-surface-2,#F5F3EE)] rounded-xl">
          <span className="text-xs text-[var(--n-muted,#6B6456)]">合計 JPY 換算</span>
          <span className="text-sm font-extrabold tabular-nums text-[var(--n-gold,#D4AF37)]">
            ¥{Math.round(totalSettledJpy).toLocaleString("ja-JP")}
          </span>
        </div>

        {/* Recent 5 settlements */}
        <ol className="space-y-1.5">
          {recentSettlements.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)]"
                  aria-label={`通貨: ${s.input.payerCurrency}`}
                >
                  {s.input.payerCurrency}
                </span>
                <span className="text-[var(--n-muted,#6B6456)] capitalize">{s.input.payerType}</span>
              </span>
              <span className="tabular-nums font-bold text-[var(--n-positive,#0E9F4F)]">
                +¥{Math.round(s.totalJpyEq).toLocaleString("ja-JP")}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 3. オリジナリティスコア ─────────────────────────────── */}
      {(() => {
        const demoMd = "エージェント時代の知識を MD ファイルに蒸留し、AI が自律的に活用できる形で公開しています。";
        const pool = [
          { guildId: "GUILD:SAMPLE001", title: "Sample Asset", mdContent: "サンプルの全く別のコンテンツ" },
        ];
        const screening = screenSubmission(demoMd, pool);
        const topSim = screening.topMatches[0]?.similarity ?? 0;
        const originalityPct = Math.round((1 - topSim) * 100);
        const isS = topRank === "S";

        return (
          <section className="mb-6 bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-[var(--primary,#06B6D4)] flex-shrink-0" />
              <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">オリジナリティ</p>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90" aria-hidden="true">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#F0EDE8" strokeWidth="8" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke={originalityPct >= 80 ? "#0E9F4F" : originalityPct >= 50 ? "#D4AF37" : "#06B6D4"}
                    strokeWidth="8"
                    strokeDasharray={`${(originalityPct / 100) * 163.4} 163.4`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-[var(--n-text,#1A1714)]">
                  {originalityPct}%
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--n-text,#1A1714)]">
                  {originalityPct >= 80 ? "高い独自性" : originalityPct >= 50 ? "一部類似あり" : "要確認"}
                </p>
                <p className="text-xs text-[var(--n-muted,#6B6456)] mt-0.5">
                  類似スコア {Math.round(topSim * 100)}% · {screening.verdict === "ok" ? "✓ 問題なし" : screening.verdict === "review" ? "⚠ 要レビュー" : "🚨 要確認"}
                </p>
                <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-1">
                  Originality Watch v1 · djb2 shingling
                </p>
              </div>
            </div>

            {isS && (
              <div
                className="flex items-center gap-3 rounded-xl border-2 border-yellow-400 bg-yellow-50 px-4 py-3"
                role="status"
                aria-label="S ランク達成バッジ"
              >
                <span className="text-2xl flex-shrink-0">🏆</span>
                <div>
                  <p className="text-sm font-black text-yellow-800">魂の登記 — S ランク達成</p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    思考密度・稼働実績・意思シグナル・実稼働コードの全条件を満たした最高格付け
                  </p>
                </div>
              </div>
            )}
          </section>
        );
      })()}

      {/* ── 4. 自己紹介（最小限） ──────────────────────────────────── */}
      <section className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Monogram handle={handle} />
          <div>
            <p className="font-bold text-[var(--n-text,#1A1714)]">@{handle}</p>
            <p className="text-xs text-[var(--n-muted,#6B6456)]">AI Ops Engineer / SQL × LLM</p>
          </div>
        </div>
        <p className="text-sm text-[var(--n-muted,#6B6456)] leading-relaxed">
          エージェント時代の知識を MD ファイルに蒸留し、AI が自律的に活用できる形で公開しています。
          設計難度の高い案件を中心に 100 件超の実績。
        </p>
      </section>

      </div>{/* /tabpanel 活動履歴 */}
    </main>
  );
}
