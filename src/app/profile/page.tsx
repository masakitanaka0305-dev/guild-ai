"use client";

import Link from "next/link";
import { RankShield } from "@/components/RankShield";
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

const HANDLE = "demo-user";

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

export default function ProfilePage() {
  const daily    = getDailyUsage(HANDLE);
  const weekly   = getWeeklyUsage(HANDLE);
  const lifetime = getLifetimeUsage(HANDLE);
  const deltas   = getDeltas(HANDLE);
  const lockReward = getLockUnlockedRewards(HANDLE);
  const history  = getUsageHistory(HANDLE);
  const complexity = getComplexityBreakdown(HANDLE);
  const assets   = getMyAssets();
  const topRank  = assets.find((a) => a.status === "active") ? "S" : "A";
  const activeCount = assets.filter((a) => a.status === "active").length;
  const totalCalls  = assets.reduce((s, a) => s + a.callsLast30, 0);
  const impact = getImpactStats(HANDLE);
  const microBalance = getMicroBalance(HANDLE);

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8 pb-24 sm:pb-12">
      <h1 className="sr-only">プロフィール</h1>

      <Link href="/guild" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline mb-4 inline-block">
        ← 運用に戻る
      </Link>

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
            <p className="text-[10px] text-[#9890A8] mt-1">Genesis 遡及解禁</p>
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

      {/* ── 2b. 社会インパクト ─────────────────────────────────────── */}
      <ImpactCard
        savedProjects={impact.savedProjects}
        contributionScore={impact.contributionScore}
        thisMonthRank={impact.ranks.thisMonth}
        allTimeRank={impact.ranks.allTime}
      />

      {/* ── 3. 自己紹介（最小限） ──────────────────────────────────── */}
      <section className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Monogram handle={HANDLE} />
          <div>
            <p className="font-bold text-[var(--n-text,#1A1714)]">@{HANDLE}</p>
            <p className="text-xs text-[var(--n-muted,#6B6456)]">AI Ops Engineer / SQL × LLM</p>
          </div>
        </div>
        <p className="text-sm text-[var(--n-muted,#6B6456)] leading-relaxed">
          エージェント時代の知識を MD ファイルに蒸留し、AI が自律的に活用できる形で公開しています。
          設計難度の高い案件を中心に 100 件超の実績。
        </p>
      </section>
    </main>
  );
}
