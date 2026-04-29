"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Shimaenaga } from "@/components/Shimaenaga";
import { Confetti } from "@/components/Confetti";
import { RankBadge } from "@/components/RankBadge";
import { RatingPlate } from "@/components/RatingPlate";
import { GoldenSeal } from "@/components/GoldenSeal";
import { PassbookTable } from "@/components/PassbookTable";
import { Sparkline } from "@/components/charts/Sparkline";
import { DeployStatusPanel } from "@/components/charts/DeployStatusPanel";
import { getWeapons } from "@/lib/weapons";
import { getApplications } from "@/lib/jobs";
import { getPassbookSnapshot } from "@/lib/passbook";
import { getPassbookSnapshotAction } from "@/app/actions/passbook";
import { playPassbookChime, playSuccessChime } from "@/lib/sound";
import { getPortfolioStats, getSparklineData, getDeployStatus } from "@/lib/terminal-data";
import { useLiveEarnings } from "@/lib/live-earnings";
import { FloatingPayoutToast } from "@/components/FloatingPayoutToast";
import { useRoyaltyStream } from "@/lib/royalty-stream";
import type { Weapon, PassbookTransaction } from "@/types";

// ─── Kawaii helpers ──────────────────────────────────────────────────────────

function CoinRain({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} className="absolute text-lg coin-fall" style={{ left: `${10 + i * 11}%`, top: "30%", animationDelay: `${i * 0.08}s` }}>🪙</span>
      ))}
    </div>
  );
}

function FriendlyRankSummary({ weapons }: { weapons: Weapon[] }) {
  const counts = { S: 0, A: 0, B: 0 };
  weapons.forEach((w) => { counts[w.rank]++; });
  const topRank = counts.S > 0 ? "S" : counts.A > 0 ? "A" : "B";
  return (
    <div className="flex flex-wrap gap-3 items-center mt-2">
      <div className="text-sm text-ink-muted">いまのあなたのランク：</div>
      {weapons.length > 0 ? <RankBadge rank={topRank} large friendly /> : <span className="text-sm text-ink-muted">まだ ぶきがありません</span>}
      {(["S", "A", "B"] as const).map((r) => counts[r] > 0 ? (
        <span key={r} className="text-xs text-ink-muted"><RankBadge rank={r} friendly /> × {counts[r]}</span>
      ) : null)}
    </div>
  );
}

function WeaponCard({ weapon }: { weapon: Weapon }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="section-card p-4 border border-gold-soft transition-all hover:border-gold">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5"><RankBadge rank={weapon.rank} friendly /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-ink text-base leading-snug truncate">{weapon.title}</h2>
            {weapon.jobsCompleted.length > 0 && <span className="shrink-0 rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-[10px] font-bold text-gold">そうびちゅう</span>}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {weapon.tags.map((tag) => <span key={tag} className="rounded-full bg-gold-light border border-gold-soft px-2 py-0.5 text-[10px] font-semibold text-[#7A5000]">{tag}</span>)}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
            <span>スコア {weapon.score.toFixed(1)}</span>
            <span>クエスト {weapon.jobsCompleted.length} かいクリア</span>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs text-ink-muted hover:text-gold shrink-0" aria-label="ノートをみる">
          {expanded ? "▲" : "▼"}
        </button>
      </div>
      {expanded && (
        <pre className="mt-3 text-xs font-mono text-ink-muted bg-snow-soft rounded-2xl p-3 whitespace-pre-wrap overflow-auto max-h-32 border border-gold-soft">
          {weapon.noteContent}
        </pre>
      )}
    </li>
  );
}

const DEMO_STEPS = [
  { label: "📝 ノートをシマエナガ銀行においた", duration: 800 },
  { label: "✨ AIがしらべた → Aランクのぶきが できた！", duration: 1000 },
  { label: "⚔️ クエストボードでそうびした", duration: 800 },
  { label: "🎯 クエストクリア！", duration: 700 },
  { label: "💰 おだちん ¥25,000 うけとった", duration: 700 },
  { label: "📖 ギルド通帳にきろくされた", duration: 600 },
] as const;

function LoopDemo({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startDemo() {
    setRunning(true);
    setCurrentStep(0);
    let step = 0;
    function advance() {
      step++;
      if (step < DEMO_STEPS.length) {
        setCurrentStep(step);
        timerRef.current = setTimeout(advance, DEMO_STEPS[step].duration);
      } else {
        setRunning(false);
        playSuccessChime();
        onComplete();
      }
    }
    timerRef.current = setTimeout(advance, DEMO_STEPS[0].duration);
  }
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="section-card p-5 border border-gold-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-ink">ためしに ちえを のこしてみる</h2>
        <button type="button" onClick={startDemo} disabled={running} className="rounded-2xl bg-gradient-to-r from-gold to-timee-yellow text-[#7A5000] font-bold px-4 py-1.5 text-sm disabled:opacity-50" aria-label="ループ実演を開始">
          {running ? "じっこんちゅう…" : "▶ はじめる"}
        </button>
      </div>
      <div className="space-y-2">
        {DEMO_STEPS.map((s, i) => (
          <div key={s.label} className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm transition-all duration-300 ${currentStep === i ? "bg-gold-light border border-gold text-[#7A5000] font-semibold scale-[1.01]" : currentStep > i ? "text-ink-muted line-through" : "text-ink"}`}>
            <span className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center shrink-0 ${currentStep > i ? "bg-accent-green border-accent-green text-white" : currentStep === i ? "bg-gold border-gold text-white animate-pulse" : "border-ink-muted text-ink-muted"}`}>
              {currentStep > i ? "✓" : i + 1}
            </span>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Terminal: portfolio row ─────────────────────────────────────────────────

function RecipeRow({ weapon }: { weapon: Weapon }) {
  const [expanded, setExpanded] = useState(false);
  const sparkData = getSparklineData(weapon.id);
  const yieldPct = weapon.rank === "S" ? 18.4 : weapon.rank === "A" ? 12.3 : 7.2;
  const aprPct = (yieldPct * 1.2).toFixed(1);

  return (
    <>
      <tr className="border-b border-[var(--divider,#2A2F38)] text-[11px] font-mono hover:bg-[var(--obsidian-2,#11141A)] transition-colors duration-100 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <RatingPlate rank={weapon.rank} size="sm" />
            {weapon.jobsCompleted.length > 0 && <GoldenSeal size={24} />}
          </div>
        </td>
        <td className="px-3 py-2 text-[var(--text-primary,#E8EBF0)] max-w-[180px]">
          <span className="truncate block">{weapon.title}</span>
        </td>
        <td className="px-3 py-2 text-[var(--text-muted,#98A1B0)] hidden sm:table-cell">
          {weapon.tags.slice(0, 2).join(", ") || "—"}
        </td>
        <td className="px-3 py-2 text-[var(--text-primary,#E8EBF0)] tabular-nums hidden sm:table-cell">
          {weapon.score.toFixed(1)}
        </td>
        <td className="px-3 py-2 text-positive tabular-nums">{yieldPct}%</td>
        <td className="px-3 py-2 text-[var(--t-gold,#D4AF37)] tabular-nums hidden lg:table-cell">{aprPct}%</td>
        <td className="px-3 py-2 hidden md:table-cell">
          <Sparkline data={sparkData.slice(-12)} width={60} height={20} label={`${weapon.title} demand`} />
        </td>
        <td className="px-3 py-2 text-[var(--text-muted,#98A1B0)] text-[9px]">
          {weapon.jobsCompleted.length} runs
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-[var(--divider,#2A2F38)]">
          <td colSpan={8} className="px-3 py-2 bg-[var(--obsidian-2,#11141A)]">
            <pre className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] whitespace-pre-wrap max-h-24 overflow-auto">
              {weapon.noteContent}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuildPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [confetti, setConfetti] = useState(false);
  const [coinRain, setCoinRain] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Mock for initial render; server action overrides with DB-enriched snapshot on mount.
  const [snap, setSnap] = useState(() => getPassbookSnapshot("demo-user"));
  const [theme, setTheme] = useState<string>("nameraka");
  const stats = getPortfolioStats();
  const deployStatus = getDeployStatus();

  useEffect(() => {
    setMounted(true);
    setWeapons(getWeapons());
    getPassbookSnapshotAction("demo-user").then(setSnap);

    const t = document.documentElement.getAttribute("data-theme") ?? "nameraka";
    setTheme(t);
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") ?? "nameraka");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const isPro = theme === "pro";
  const isNameraka = theme === "nameraka";
  const isTerminal = isPro; // legacy compat

  function handleLoopComplete() {
    setConfetti(true);
    setCoinRain(true);
    setTimeout(() => { setConfetti(false); setCoinRain(false); }, 2500);
  }

  const applications = mounted ? getApplications() : [];
  const totalOdachin = applications.reduce((s, a) => s + a.reward, 0);
  const guildTransactions: PassbookTransaction[] = [
    ...snap.recentTransactions,
    ...applications.map((app, i) => ({
      id: `app_tx_${i}`,
      type: "card" as const,
      amount: app.reward,
      assetTitle: "クエストおだちん",
      at: app.appliedAt,
    })),
  ].slice(0, 8);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const earnings = useLiveEarnings("demo-user");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const royalties = useRoyaltyStream(isNameraka);

  // ─── Nameraka layout (マイ銀行 / メルカリ売上管理 style) ─────────────────

  if (isNameraka) {
    const royaltyTotal = royalties.reduce((s, r) => s + r.amountJpy, 0);
    return (
      <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8 relative">
        <FloatingPayoutToast
          deltaJpy={earnings.lastDelta}
          bumpCount={earnings.bumpCount}
          label="おだちん入金"
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)]">マイ銀行</h1>
            <p className="text-sm text-[var(--n-muted,#6B6456)] mt-1">保有資産と報酬履歴</p>
          </div>
          <Link href="/bank" className="px-4 py-2 rounded-full bg-[var(--n-primary,#E64545)] text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shrink-0">
            ＋ のこす
          </Link>
        </div>

        {/* Top 2 metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl px-4 py-4 text-center">
            <p className="text-[11px] text-[var(--n-muted,#6B6456)] mb-1">今日のおだちん</p>
            <p className="text-xl font-black tabular-nums text-[var(--n-positive,#0E9F4F)]">
              ¥{Math.round(earnings.jpy / 30).toLocaleString("ja-JP")}
            </p>
          </div>
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl px-4 py-4 text-center">
            <p className="text-[11px] text-[var(--n-muted,#6B6456)] mb-1">今月の合計</p>
            <p className="text-xl font-black tabular-nums text-[var(--n-text,#1A1714)]">
              ¥{earnings.jpy.toLocaleString("ja-JP")}
            </p>
          </div>
        </div>

        {/* Collapsible advanced stats */}
        <details className="mb-6 bg-[var(--n-surface-2,#F5F3EE)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl overflow-hidden">
          <summary className="px-4 py-3 text-sm text-[var(--n-muted,#6B6456)] cursor-pointer select-none font-medium">
            くわしく見る
          </summary>
          <div className="grid grid-cols-3 gap-2 px-4 pb-4 pt-1">
            {[
              { label: "保有資産（AUM）", value: `¥${(stats.aumJpy / 10000).toFixed(0)}万`, color: "text-[var(--n-gold,#D4AF37)]" },
              { label: "先月比（MoM）", value: `+${stats.momPct}%`, color: "text-[var(--n-positive,#0E9F4F)]" },
              { label: "APR", value: `${(stats.momPct * 1.2).toFixed(1)}%`, color: "text-[var(--n-text,#1A1714)]" },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-2">
                <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-0.5">{stat.label}</p>
                <p className={`text-sm font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </details>

        {/* API royalty indicator */}
        {royalties.length > 0 && (
          <div className="bg-[var(--n-surface-2,#122A4D)] border border-[var(--n-divider,#1F3A66)] rounded-2xl px-4 py-2 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--n-muted,#9FB1C8)]">API印税（累計 {royalties.length} 件）</span>
            </div>
            <span className="text-xs font-bold text-[var(--n-gold,#D4AF37)] tabular-nums">
              +¥{royaltyTotal.toFixed(1)}
            </span>
          </div>
        )}

        {/* Note cards */}
        {!mounted ? (
          <p className="text-sm text-[var(--n-muted,#9FB1C8)]">読み込み中…</p>
        ) : weapons.length === 0 ? (
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-3xl p-8 text-center">
            <p className="text-[var(--n-muted,#6B6456)] mb-4">まだノートがありません</p>
            <Link href="/bank" className="px-5 py-2.5 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all">
              はじめてのこす →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {weapons.map((w) => (
              <li key={w.id} className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--n-primary,#E64545)]/30 hover:shadow-sm transition-all">
                <RatingPlate rank={w.rank} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--n-text,#F1F4F9)] text-sm truncate">{w.title}</p>
                  <p className="text-xs text-[var(--n-muted,#9FB1C8)] mt-0.5">
                    スコア {w.score.toFixed(1)} · クエスト {w.jobsCompleted.length} 件
                  </p>
                </div>
                <p className="text-xs text-[var(--n-muted,#9FB1C8)] shrink-0">
                  {(w as unknown as { createdAt?: string }).createdAt ? new Date((w as unknown as { createdAt: string }).createdAt).toLocaleDateString("ja-JP") : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Passbook table */}
        {guildTransactions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-bold text-[var(--n-text,#F1F4F9)] mb-3">通帳</h2>
            <div className="bg-[var(--n-surface,#0E2240)] border border-[var(--n-divider,#1F3A66)] rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--n-divider,#1F3A66)]">
                    {["日時", "種類", "金額", "残高"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[var(--n-muted,#9FB1C8)] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...guildTransactions.map((tx) => ({
                      id: tx.id, at: tx.at, label: tx.assetTitle, amount: tx.amount, type: "おだちん",
                    })),
                    ...royalties.slice(0, 3).map((r) => ({
                      id: r.id, at: r.at, label: `API印税 #${r.apiCallId}`, amount: r.amountJpy, type: "印税",
                    })),
                  ]
                    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                    .slice(0, 10)
                    .map((row, i, arr) => {
                      const running = arr.slice(i).reduce((s, r) => s + r.amount, 0);
                      return (
                        <tr key={row.id} className="border-b border-[var(--n-divider,#1F3A66)] last:border-0">
                          <td className="px-3 py-2.5 tabular-nums text-[var(--n-muted,#9FB1C8)]">
                            {new Date(row.at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--n-text,#F1F4F9)]">{row.type}</td>
                          <td className="px-3 py-2.5 tabular-nums text-[#4DD08F] font-bold">+¥{row.amount.toFixed ? row.amount.toFixed(1) : row.amount.toLocaleString("ja-JP")}</td>
                          <td className="px-3 py-2.5 tabular-nums text-[var(--n-muted,#9FB1C8)]">¥{running.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="h-24" />
      </main>
    );
  }

  // ─── Pro layout ────────────────────────────────────────────────────────────

  if (isPro) {
    return (
      <main className="flex flex-col h-full min-h-0 bg-[var(--obsidian,#0B0D10)] text-[var(--text-primary,#E8EBF0)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--divider,#2A2F38)] flex-shrink-0">
          <div>
            <h1 className="text-sm font-mono font-bold text-[var(--t-gold,#D4AF37)] uppercase tracking-widest">
              Portfolio
            </h1>
            <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] mt-0.5">
              資産管理 — Yield / AUM / MoM
            </p>
          </div>
          <Link href="/bank" className="px-3 py-1 text-[10px] font-mono font-bold bg-[var(--t-gold,#D4AF37)] text-[#0B0D10] rounded-[var(--radius-sm,2px)] uppercase tracking-widest hover:opacity-90 transition-opacity duration-100">
            + SUBMIT RECIPE
          </Link>
        </div>

        {/* Stats bar */}
        {mounted && (
          <div className="flex items-center gap-0 border-b border-[var(--divider,#2A2F38)] flex-shrink-0 overflow-x-auto">
            {[
              { label: "AUM (Est)", value: `¥${(stats.aumJpy / 10000).toFixed(0)}万`, color: "text-[var(--t-gold,#D4AF37)]" },
              { label: "Yield (Ann)", value: `${stats.yieldPct}%`, color: "text-positive" },
              { label: "MoM", value: `+${stats.momPct}%`, color: "text-positive" },
              { label: "Recipe APR", value: `${stats.recipeAprPct}%`, color: "text-[var(--t-gold,#D4AF37)]" },
              { label: "Recipes", value: `${weapons.length}`, color: "text-[var(--text-primary,#E8EBF0)]" },
              { label: "Engagements", value: `${applications.length}`, color: "text-positive" },
              { label: "Total Reward", value: `¥${totalOdachin.toLocaleString("ja-JP")}`, color: "text-positive" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-start px-4 py-2.5 border-r border-[var(--divider,#2A2F38)] last:border-r-0 shrink-0">
                <span className="text-[9px] font-mono text-[var(--text-muted,#98A1B0)] uppercase tracking-widest">{stat.label}</span>
                <span className={`text-sm font-mono font-bold tabular-nums ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 grid lg:grid-cols-[1fr_280px] gap-0 min-h-0 overflow-hidden">
          {/* Recipe table */}
          <div className="flex flex-col min-h-0 overflow-hidden border-r border-[var(--divider,#2A2F38)]">
            <div className="overflow-auto flex-1">
              {!mounted ? (
                <div className="p-5 text-[10px] font-mono text-[var(--text-muted,#98A1B0)]">Loading...</div>
              ) : weapons.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)]">Recipe未登録</p>
                  <Link href="/bank" className="inline-block mt-3 px-4 py-1.5 text-[10px] font-mono font-bold bg-[var(--t-gold,#D4AF37)] text-[#0B0D10] rounded-[var(--radius-md,4px)] uppercase tracking-widest">ASSET TERMINAL →</Link>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[var(--obsidian,#0B0D10)] z-10">
                    <tr className="border-b border-[var(--divider,#2A2F38)]">
                      {["Rank", "Title", "Tags", "Score", "Yield", "APR", "Demand", "Runs"].map((h, i) => (
                        <th key={h} className={`px-3 py-2 text-left text-[9px] font-mono font-bold text-[var(--text-muted,#98A1B0)] uppercase tracking-widest ${[2, 3].includes(i) ? "hidden sm:table-cell" : ""} ${[5].includes(i) ? "hidden lg:table-cell" : ""} ${[6].includes(i) ? "hidden md:table-cell" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weapons.map((w) => <RecipeRow key={w.id} weapon={w} />)}
                  </tbody>
                </table>
              )}
            </div>

            {/* Passbook — trading-terminal style */}
            <div className="border-t border-[var(--divider,#2A2F38)] flex-shrink-0">
              <div className="px-3 py-2 flex items-center justify-between border-b border-[var(--divider,#2A2F38)]">
                <p className="text-[9px] font-mono text-[var(--text-muted,#98A1B0)] uppercase tracking-widest">取引履歴</p>
                <span className="text-[9px] font-mono text-positive tabular-nums">
                  Total: ¥{totalOdachin.toLocaleString("ja-JP")}
                </span>
              </div>
              <div className="font-mono text-[10px]">
                {guildTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--divider,#2A2F38)] last:border-0">
                    <span className="text-[var(--text-muted,#98A1B0)] truncate flex-1">{tx.assetTitle}</span>
                    <span className="text-positive tabular-nums shrink-0 ml-3">+¥{tx.amount.toLocaleString("ja-JP")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: deploy status */}
          <div className="hidden lg:flex flex-col gap-0 min-h-0 overflow-hidden">
            <div className="border-b border-[var(--divider,#2A2F38)] p-4">
              <p className="text-[9px] font-mono text-[var(--text-muted,#98A1B0)] uppercase tracking-widest mb-3">Deploy Status</p>
              <DeployStatusPanel status={deployStatus} />
            </div>
            <div className="p-4">
              <p className="text-[9px] font-mono text-[var(--text-muted,#98A1B0)] uppercase tracking-widest mb-2">Yield Trend</p>
              {weapons.slice(0, 3).map((w) => (
                <div key={w.id} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono text-[var(--text-muted,#98A1B0)] truncate flex-1">{w.title.slice(0, 18)}</span>
                    <span className="text-[9px] font-mono text-positive tabular-nums">{w.rank === "S" ? "18.4" : w.rank === "A" ? "12.3" : "7.2"}%</span>
                  </div>
                  <Sparkline data={getSparklineData(w.id).slice(-20)} width={220} height={30} label={`${w.title} yield trend`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── Kawaii layout ────────────────────────────────────────────────────────

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      <Confetti active={confetti} duration={2500} />
      <div className="relative flex items-start justify-between gap-4 mb-6 overflow-visible">
        <CoinRain active={coinRain} />
        <div className="flex items-center gap-3">
          <Shimaenaga variant="coin" size="md" mode="guardian" className="shimaenaga-mascot" />
          <div>
            <h1 className="text-2xl font-bold text-ink">おたから をかくにんする</h1>
            <p className="text-sm text-ink-muted">キミの知恵と じっせきがあつまる場所</p>
          </div>
        </div>
        <Link href="/bank" className="rounded-2xl bg-gradient-to-r from-gold to-timee-yellow text-[#7A5000] font-bold px-4 py-2 text-sm shrink-0">+ ちえをのこす</Link>
      </div>

      {mounted && <FriendlyRankSummary weapons={weapons} />}

      {mounted && (
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="section-card p-4 text-center border border-gold-soft"><p className="text-xs text-ink-muted">ぶき</p><p className="text-2xl font-black text-ink tabular-nums">{weapons.length}</p></div>
          <div className="section-card p-4 text-center border border-gold-soft"><p className="text-xs text-ink-muted">クエストクリア</p><p className="text-2xl font-black text-gold tabular-nums">{applications.length}</p></div>
          <div className="section-card p-4 text-center border border-gold-soft"><p className="text-xs text-ink-muted">こんしゅう ふえた金貨</p><p className="text-lg font-black text-accent-green tabular-nums">¥{totalOdachin.toLocaleString("ja-JP")}</p></div>
        </div>
      )}

      <LoopDemo onComplete={handleLoopComplete} />

      <div className="mt-5">
        <h2 className="text-sm font-bold text-ink-muted uppercase tracking-widest mb-3">ぶきいちらん</h2>
        {!mounted ? (
          <div className="section-card p-8 text-center"><p className="text-ink-muted">よみこみちゅう…</p></div>
        ) : weapons.length === 0 ? (
          <div className="section-card p-8 text-center border-2 border-dashed border-gold/30">
            <Shimaenaga variant="wave" size="md" mode="seal" className="mx-auto shimaenaga-mascot" />
            <p className="mt-3 text-sm text-ink-muted">まだ ぶきがありません。</p>
            <Link href="/bank" className="rounded-2xl bg-gradient-to-r from-gold to-timee-yellow text-[#7A5000] font-bold px-5 py-2.5 text-sm mt-4 inline-block">シマエナガ銀行へ →</Link>
          </div>
        ) : (
          <ul className="space-y-3">{weapons.map((w) => <WeaponCard key={w.id} weapon={w} />)}</ul>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-widest">いまのおたから（ギルド通帳）</h2>
          <button type="button" onClick={playPassbookChime} className="text-[10px] text-gold hover:underline" aria-label="通帳チャイムをならす">🔔 チャリン</button>
        </div>
        <PassbookTable transactions={guildTransactions} />
      </div>

      <div className="mt-6 section-card p-4 flex flex-wrap gap-3 text-sm border border-gold-soft">
        <Link href="/wallet" className="text-ink-muted hover:text-gold transition-colors">おさいふ詳細 →</Link>
        <Link href="/marketplace" className="text-ink-muted hover:text-gold transition-colors">保管庫 →</Link>
        <Link href="/showcase" className="text-ink-muted hover:text-gold transition-colors">つくったもの →</Link>
      </div>
    </main>
  );
}
