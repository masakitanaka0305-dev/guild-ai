"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { RankBadge } from "@/components/RankBadge";
import { Tip } from "@/components/Tip";
import { getWeapons } from "@/lib/weapons";
import { getApplications } from "@/lib/jobs";
import { getPassbookSnapshot } from "@/lib/passbook";
import { getPassbookSnapshotAction } from "@/app/actions/passbook";
import { useLiveEarnings } from "@/lib/live-earnings";
import { FloatingPayoutToast } from "@/components/FloatingPayoutToast";
import { useRoyaltyStream } from "@/lib/royalty-stream";
import type { Weapon, PassbookTransaction } from "@/types";

// ─── Mock active notes ────────────────────────────────────────────────────────

const ACTIVE_NOTES = [
  { id: "note-001", title: "TypeScript設計パターン集",    callsLast1m: 4, perCallJpy: 1.2, totalEarned: 184.8 },
  { id: "note-002", title: "Rustメモリ安全設計ノート",    callsLast1m: 2, perCallJpy: 1.8, totalEarned:  97.2 },
  { id: "note-003", title: "LLM Prompt Engineering集", callsLast1m: 1, perCallJpy: 0.9, totalEarned:  43.2 },
] as const;

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
      <div className="w-1 h-5 rounded-full bg-[var(--n-primary,#E64545)] flex-shrink-0" />
      <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">{title}</p>
      {tip && <Tip text={tip} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuildPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [mounted, setMounted] = useState(false);
  const [snap, setSnap] = useState(() => getPassbookSnapshot("demo-user"));
  const stats = { aumJpy: 1_240_000, momPct: 8.3 };

  useEffect(() => {
    setMounted(true);
    setWeapons(getWeapons());
    getPassbookSnapshotAction("demo-user").then(setSnap);
  }, []);

  const applications = mounted ? getApplications() : [];
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

  const earnings = useLiveEarnings("demo-user");
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

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8 relative">
      <FloatingPayoutToast
        deltaJpy={earnings.lastDelta}
        bumpCount={earnings.bumpCount}
        label="おだちん入金"
      />
      <FloatingPayoutToast
        deltaJpy={royaltyDelta}
        bumpCount={royaltyBump}
        label="API印税"
      />

      {/* ── マイ銀行 ヒーローブロック ─────────────────────────── */}
      <section className="mb-5 bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-lg font-bold text-[var(--n-text,#1A1714)]">
            マイ銀行：あなたの "おだちん" を まとめる場所
          </h1>
          <Link
            href="/bank"
            className="px-4 py-2 rounded-full bg-[var(--n-primary,#E64545)] text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shrink-0"
          >
            ＋ のこす
          </Link>
        </div>
        <p className="text-sm text-[var(--n-muted,#6B6456)] leading-relaxed">
          <span className="text-[#E64545] font-semibold">今日の おだちん</span>・
          <span className="text-[#E64545] font-semibold">今月の合計</span>・
          <span className="text-[#E64545] font-semibold">いまの推定時給</span>
          を見ながら、過去のお取引も{" "}
          <span className="font-semibold text-[var(--n-text,#1A1714)]">通帳</span>
          で確認できます。
        </p>
      </section>

      {/* ── いまの推定時給 ────────────────────────────────────────────── */}
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
              className="text-3xl font-black tabular-nums text-[var(--n-positive,#0E9F4F)]"
            >
              ¥{hourlyRate.toLocaleString("ja-JP")}
              <span className="text-base font-bold text-[var(--n-muted,#6B6456)] ml-1">/ 時間</span>
            </p>
            <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-1">
              直近 60 秒の API 印税から推計
            </p>
          </div>
          <PulseIndicator />
        </div>
      </div>

      {/* ── 今日のおだちん / 今月の合計 ──────────────────────────────────── */}
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

      {/* ── 稼働中ノート上位3件 ───────────────────────────────────────── */}
      <section className="mb-4">
        <SectionBand title="稼働中ノート 上位3件" tip="直近1分のコール数が多いノートです" />
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory lg:flex-col lg:overflow-visible">
          {ACTIVE_NOTES.map((n) => (
            <div
              key={n.id}
              className="snap-start flex-shrink-0 w-56 lg:w-auto bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-3 shadow-sm"
            >
              <p className="text-xs font-bold text-[var(--n-text,#1A1714)] truncate mb-2">{n.title}</p>
              <div className="flex items-center justify-between text-[10px] text-[var(--n-muted,#6B6456)]">
                <span>直近1分 {n.callsLast1m} コール</span>
                <span className="tabular-nums font-semibold text-[var(--n-positive,#0E9F4F)]">
                  +¥{n.totalEarned.toFixed(1)}
                </span>
              </div>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-0.5">
                1コール ¥{n.perCallJpy}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 通帳：これまでの お取引 ───────────────────────────────────── */}
      {guildTransactions.length > 0 && (
        <section className="mb-4">
          <SectionBand title="通帳：これまでの お取引" tip="過去の入出金が時系列で確認できます" />
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl overflow-hidden">
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
                {[
                  ...guildTransactions.map((tx) => ({
                    id: tx.id,
                    at: tx.at,
                    label: tx.assetTitle,
                    amount: tx.amount,
                    type: "おだちん",
                  })),
                  ...royalties.slice(0, 3).map((r) => ({
                    id: r.id,
                    at: r.at,
                    label: `API印税 #${r.apiCallId}`,
                    amount: r.amountJpy,
                    type: "印税",
                  })),
                ]
                  .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                  .slice(0, 10)
                  .map((row, i, arr) => {
                    const running = arr.slice(i).reduce((s, r) => s + r.amount, 0);
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
                        <td className="px-3 py-2.5 text-[var(--n-text,#1A1714)]">{row.type}</td>
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
                  })}
              </tbody>
            </table>
          </div>
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
        <p className="text-sm text-[var(--n-muted,#6B6456)]">読み込み中…</p>
      ) : weapons.length === 0 ? (
        <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-3xl p-8 text-center">
          <p className="text-[var(--n-muted,#6B6456)] mb-4">まだノートがありません</p>
          <Link
            href="/bank"
            className="px-5 py-2.5 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            はじめてのこす →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {weapons.map((w) => (
            <li
              key={w.id}
              className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--n-primary,#E64545)]/30 hover:shadow-sm transition-all"
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
