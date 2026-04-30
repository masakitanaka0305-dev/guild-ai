"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { RankBadge } from "@/components/RankBadge";
import { Tip } from "@/components/Tip";
import { AssetPortfolio } from "@/components/AssetPortfolio";
import { TotalAssetsCard } from "@/components/TotalAssetsCard";
import { getWeapons } from "@/lib/weapons";
import { getApplications } from "@/lib/jobs";
import { getPassbookSnapshot } from "@/lib/passbook";
import { getPassbookSnapshotAction } from "@/app/actions/passbook";
import { useLiveEarnings } from "@/lib/live-earnings";
import { FloatingPayoutToast } from "@/components/FloatingPayoutToast";
import { useRoyaltyStream } from "@/lib/royalty-stream";
import { MicroWalletPanel } from "@/components/MicroWalletPanel";
import { ChainNotifyToast } from "@/components/ChainNotifyToast";
import { getRecentSettlements, seedDemoSettlements } from "@/lib/global-settlement";
import { useUserId } from "@/components/AuthProvider";
import { WaveLine } from "@/components/ui/WaveLine";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Weapon, PassbookTransaction } from "@/types";

// ─── Pulse indicator ──────────────────────────────────────────────────────────

function PulseIndicator() {
  return (
    <span className="relative inline-flex items-center justify-center w-5 h-5" aria-hidden>
      <span className="absolute inline-flex w-full h-full rounded-full bg-[var(--n-positive,#0E9F4F)] opacity-60 animate-ping motion-reduce:animate-none" />
      <span className="relative inline-flex w-3 h-3 rounded-full bg-[var(--n-positive,#0E9F4F)]" />
    </span>
  );
}

// ─── Section heading band ─────────────────────────────────────────────────────

function SectionBand({ title, tip }: { title: string; tip?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-5 rounded-full bg-[var(--primary,#06B6D4)] flex-shrink-0" />
      <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">{title}</p>
      {tip && <Tip text={tip} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuildPage() {
  const userId = useUserId();
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [mounted, setMounted] = useState(false);
  const [snap, setSnap] = useState(() => getPassbookSnapshot(userId));
  const stats = { aumJpy: 1_240_000, momPct: 8.3 };

  useEffect(() => {
    setMounted(true);
    setWeapons(getWeapons());
    setSnap(getPassbookSnapshot(userId));
    getPassbookSnapshotAction(userId).then(setSnap);
    seedDemoSettlements();
  }, [userId]);

  const applications = mounted ? getApplications() : [];
  const guildTransactions: PassbookTransaction[] = [
    ...snap.recentTransactions,
    ...applications.map((app, i) => ({
      id: `app_tx_${i}`,
      type: "card" as const,
      amount: app.reward,
      assetTitle: "クエスト報酬",
      at: app.appliedAt,
    })),
  ].slice(0, 8);

  const [showAllTx, setShowAllTx] = useState(false);

  const earnings = useLiveEarnings(userId);
  const royalties = useRoyaltyStream(true);
  const royaltyTotal = royalties.reduce((s, r) => s + r.amountJpy, 0);

  // ── 推定時給: 直近60秒の印税合計 × 60 ────────────────────────────────────
  const [hourlyRate, setHourlyRate] = useState(0);
  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const last60s = royalties.filter(
        (r) => now - new Date(r.at).getTime() < 60_000,
      );
      const sum = last60s.reduce((s, r) => s + r.amountJpy, 0);
      setHourlyRate(
        sum > 0 ? Math.round(sum * 60) : Math.round(earnings.jpy / 720),
      );
    };
    calc();
    const t = setInterval(calc, 10_000);
    return () => clearInterval(t);
  }, [royalties, earnings.jpy]);

  // ── 頻度制限付きロイヤリティトースト（最大1分に1回）─────────────────────
  const [royaltyBump, setRoyaltyBump] = useState(0);
  const [royaltyDelta, setRoyaltyDelta] = useState(0);
  const lastToastAt = useRef(0);
  useEffect(() => {
    if (royalties.length === 0) return;
    const now = Date.now();
    if (now - lastToastAt.current >= 60_000) {
      lastToastAt.current = now;
      setRoyaltyDelta(royalties[0].amountJpy);
      setRoyaltyBump((n) => n + 1);
    }
  }, [royalties]);

  // ── Mercari-style hero numbers ──────────────────────────────────────────
  const totalSalesJpy = 1_248_400;
  const monthlyEstJpy = Math.round(earnings.jpy * 1.15);
  const activeMdCount = weapons.length > 0 ? weapons.length : 3;
  const totalCallCount = royalties.length + 48;

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8 pb-24 sm:pb-12 relative">
      {/* ── Water Guild — dashboard hairline header ─────────────────── */}
      <header className="mb-3" aria-labelledby="ledger-title">
        <div className="flex items-baseline justify-between">
          <h1
            id="ledger-title"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--water-muted,#94A3B8)]"
          >
            資産台帳 — Asset Ledger
          </h1>
          <span className="text-[10px] font-mono text-[var(--water-muted,#94A3B8)] opacity-60">
            Water Guild
          </span>
        </div>
        <WaveLine ariaLabel="水の意匠 — 静的波線" />
      </header>
      <FloatingPayoutToast
        deltaJpy={earnings.lastDelta}
        bumpCount={earnings.bumpCount}
        label="報酬入金"
      />
      <FloatingPayoutToast
        deltaJpy={royaltyDelta}
        bumpCount={royaltyBump}
        label="API印税"
      />
      <ChainNotifyToast />

      {/* ── Mercari-style 売上金ヒーロー ───────────────────────────────── */}
      <section className="mb-5 sm:mb-6 bg-[var(--n-surface,#FFFFFF)] border-2 border-[var(--n-gold,#D4AF37)]/40 rounded-2xl px-5 py-5 shadow-sm">
        <p className="text-[11px] font-bold text-slate-400 mb-1 tracking-wider uppercase">
          稼ぐ — Asset Ledger
        </p>
        <p className="text-[11px] text-slate-400 mb-2">現在の合計売上</p>
        <p
          aria-live="polite"
          aria-atomic="true"
          data-testid="guild-total-sales"
          className="metric-prime-white mb-4"
          style={{ fontSize: "2.75rem", lineHeight: 1.05 }}
        >
          ¥{totalSalesJpy.toLocaleString("ja-JP")}
        </p>

        {/* 3-pill stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "今月の予想収益", value: `¥${monthlyEstJpy.toLocaleString("ja-JP")}`, prime: true },
            { label: "稼働中 MD",      value: `${activeMdCount} 件`, prime: false },
            { label: "累計コール",      value: `${totalCallCount} 回`, prime: false },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1E293B] rounded-xl px-3 py-2 text-center"
            >
              <p className="text-[9px] text-slate-400 mb-0.5 leading-tight">{stat.label}</p>
              <p
                className={
                  stat.prime
                    ? "metric-prime"
                    : "text-base font-bold tabular-nums text-white"
                }
                style={stat.prime ? { fontSize: "1.05rem" } : undefined}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="flex-1 py-2.5 rounded-xl bg-[var(--primary,#06B6D4)] text-white text-sm font-bold text-center hover:bg-[#0891B2] transition-colors"
          >
            さらに稼ぐ →
          </Link>
          <Link
            href="/profile"
            className="px-4 py-2.5 rounded-xl border border-[var(--n-divider,rgba(0,0,0,0.1))] text-[var(--n-muted,#6B6456)] text-xs font-semibold hover:border-[var(--primary,#06B6D4)] hover:text-[var(--primary,#06B6D4)] transition-colors"
          >
            プロフィール
          </Link>
        </div>
      </section>

      {/* ── 総資産ヒーローカード ──────────────────────────────────────── */}
      <TotalAssetsCard />

      {/* ── 端数残高 ────────────────────────────────────────────────── */}
      <MicroWalletPanel />

      {/* ── 運用中のリアルタイム指標 ─────────────────────────────────── */}
      <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-positive,#0E9F4F)]/30 rounded-2xl px-5 py-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] text-[var(--n-muted,#6B6456)] mb-1 flex items-center">
              いまの推定時給
              <Tip text="直近60秒の API 印税×60 で計算しています" />
            </p>
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-5xl font-black tabular-nums text-[var(--n-positive,#0E9F4F)] leading-none"
            >
              ¥{hourlyRate.toLocaleString("ja-JP")}
              <span className="text-base font-bold text-[var(--n-muted,#6B6456)] ml-1">/ 時間</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-0.5">今日の報酬</p>
              <p className="text-sm font-bold tabular-nums text-[var(--n-positive,#0E9F4F)]">
                ¥{Math.round(earnings.jpy / 30).toLocaleString("ja-JP")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-0.5">今月の合計</p>
              <p className="text-sm font-bold tabular-nums text-[var(--n-text,#1A1714)]">
                ¥{earnings.jpy.toLocaleString("ja-JP")}
              </p>
            </div>
            <PulseIndicator />
          </div>
        </div>
      </div>

      {/* API royalty indicator */}
      {royalties.length > 0 && (
        <div className="bg-[var(--n-surface-2,#F5F3EE)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl px-4 py-2 mb-4 flex items-center justify-between">
          <span className="text-[10px] text-[var(--n-muted,#6B6456)]">
            API印税（累計 {royalties.length} 件）
          </span>
          <span className="text-xs font-bold text-[var(--n-gold,#D4AF37)] tabular-nums">
            +¥{royaltyTotal.toFixed(1)}
          </span>
        </div>
      )}

      {/* ── 運用中の資産（MDファイル） ────────────────────────────────── */}
      <section className="mb-6 sm:mb-8">
        <SectionBand
          title="運用中の資産：あなたが投稿したMDファイル"
          tip="投稿したノートと、その稼働状況をまとめます"
        />
        <AssetPortfolio />
      </section>

      {/* ── 通帳：これまでの お取引 ───────────────────────────────────── */}
      {guildTransactions.length > 0 && (
        <section className="mb-6 sm:mb-8">
          <SectionBand title="通帳：これまでの取引" tip="過去の入出金が時系列で確認できます" />
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--n-divider,rgba(0,0,0,0.08))]">
                  {["日時", "種類", "金額", "残高"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-[var(--n-muted,#6B6456)] font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const settlements = mounted ? getRecentSettlements(5) : [];
                  const allRows = [
                    ...guildTransactions.map((tx) => ({
                      id: tx.id,
                      at: tx.at,
                      label: tx.assetTitle,
                      amount: tx.amount,
                      type: "報酬",
                      currency: undefined as string | undefined,
                    })),
                    ...royalties.slice(0, 3).map((r) => ({
                      id: r.id,
                      at: r.at,
                      label: `API印税 #${r.apiCallId}`,
                      amount: r.amountJpy,
                      type: "印税",
                      currency: undefined as string | undefined,
                    })),
                    ...settlements.map((s) => ({
                      id: s.id,
                      at: new Date(s.settledAtMs).toISOString(),
                      label: `グローバル着金`,
                      amount: Math.round(s.totalJpyEq * 10) / 10,
                      type: "着金",
                      currency: s.input.payerCurrency as string,
                    })),
                  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
                  const visibleRows = showAllTx ? allRows.slice(0, 30) : allRows.slice(0, 10);
                  return visibleRows.map((row, i) => {
                    const running = allRows.slice(i).reduce((s, r) => s + r.amount, 0);
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-[var(--n-divider,rgba(0,0,0,0.08))] last:border-0"
                      >
                        <td className="px-3 py-2.5 tabular-nums text-[var(--n-muted,#6B6456)]">
                          {new Date(row.at).toLocaleString("ja-JP", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--n-text,#1A1714)]">
                          <span className="flex items-center gap-1.5">
                            {row.type}
                            {row.currency && (
                              <span
                                className="inline-block rounded px-1 py-0.5 text-[9px] font-bold bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)] tabular-nums"
                                aria-label={`通貨: ${row.currency}`}
                              >
                                {row.currency}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-[#4DD08F] font-bold">
                          +¥{typeof row.amount === "number" && row.amount % 1 !== 0
                            ? row.amount.toFixed(1)
                            : row.amount.toLocaleString("ja-JP")}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-[var(--n-muted,#6B6456)]">
                          ¥{running.toLocaleString("ja-JP", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 1,
                          })}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          {guildTransactions.length + royalties.slice(0, 3).length > 10 && !showAllTx && (
            <button
              type="button"
              onClick={() => setShowAllTx(true)}
              className="mt-2 w-full text-xs text-[var(--n-muted,#6B6456)] hover:text-[var(--primary,#06B6D4)] transition-colors py-2"
            >
              もっと見る ↓
            </button>
          )}
        </section>
      )}

      {/* ── くわしく見る（AUM / MoM / APR）──────────────────────────── */}
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

      {/* ── 登記済みノート一覧 ────────────────────────────────────────── */}
      {!mounted ? (
        <p className="text-sm text-[#22D3EE]">読み込み中...</p>
      ) : weapons.length === 0 ? (
        <EmptyState
          title="まだ知能を登記していません"
          description="GitHub のコードベースから 3 分で資産化を始められます。"
          ctaLabel="GitHub から始める"
          ctaHref="/onboarding"
        />
      ) : (
        <ul className="space-y-3">
          {weapons.map((w) => (
            <li
              key={w.id}
              className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--primary,#06B6D4)]/30 hover:shadow-sm transition-all"
            >
              <RankBadge rank={w.rank} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--n-text,#1A1714)] text-sm truncate">{w.title}</p>
                <p className="text-xs text-[var(--n-muted,#6B6456)] mt-0.5">
                  スコア {w.score.toFixed(1)} · クエスト {w.jobsCompleted.length} 件
                </p>
              </div>
              <p className="text-xs text-[var(--n-muted,#6B6456)] shrink-0">
                {(w as unknown as { createdAt?: string }).createdAt
                  ? new Date(
                      (w as unknown as { createdAt: string }).createdAt,
                    ).toLocaleDateString("ja-JP")
                  : "—"}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="h-24" />
    </main>
  );
}
