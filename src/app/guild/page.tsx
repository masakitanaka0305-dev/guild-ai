"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RankBadge } from "@/components/RankBadge";
import { getWeapons } from "@/lib/weapons";
import { getApplications } from "@/lib/jobs";
import { getPassbookSnapshot } from "@/lib/passbook";
import { getPassbookSnapshotAction } from "@/app/actions/passbook";
import { useLiveEarnings } from "@/lib/live-earnings";
import { FloatingPayoutToast } from "@/components/FloatingPayoutToast";
import { useRoyaltyStream } from "@/lib/royalty-stream";
import { getPortfolioStats } from "@/lib/terminal-data";
import type { Weapon, PassbookTransaction } from "@/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuildPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [mounted, setMounted] = useState(false);
  // Mock for initial render; server action overrides with DB-enriched snapshot on mount.
  const [snap, setSnap] = useState(() => getPassbookSnapshot("demo-user"));
  const stats = getPortfolioStats();

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

  // ─── Nameraka layout (マイ銀行 / メルカリ売上管理 style) ─────────────────

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
        <div className="bg-[var(--n-surface-2,#F5F3EE)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl px-4 py-2 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--n-muted,#6B6456)]">API印税（累計 {royalties.length} 件）</span>
          </div>
          <span className="text-xs font-bold text-[var(--n-gold,#D4AF37)] tabular-nums">
            +¥{royaltyTotal.toFixed(1)}
          </span>
        </div>
      )}

      {/* Note cards */}
      {!mounted ? (
        <p className="text-sm text-[var(--n-muted,#6B6456)]">読み込み中…</p>
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
              <RankBadge rank={w.rank} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--n-text,#1A1714)] text-sm truncate">{w.title}</p>
                <p className="text-xs text-[var(--n-muted,#6B6456)] mt-0.5">
                  スコア {w.score.toFixed(1)} · クエスト {w.jobsCompleted.length} 件
                </p>
              </div>
              <p className="text-xs text-[var(--n-muted,#6B6456)] shrink-0">
                {(w as unknown as { createdAt?: string }).createdAt ? new Date((w as unknown as { createdAt: string }).createdAt).toLocaleDateString("ja-JP") : "—"}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Passbook table */}
      {guildTransactions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-3">通帳</h2>
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--n-divider,rgba(0,0,0,0.08))]">
                  {["日時", "種類", "金額", "残高"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[var(--n-muted,#6B6456)] font-medium">{h}</th>
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
                      <tr key={row.id} className="border-b border-[var(--n-divider,rgba(0,0,0,0.08))] last:border-0">
                        <td className="px-3 py-2.5 tabular-nums text-[var(--n-muted,#6B6456)]">
                          {new Date(row.at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--n-text,#1A1714)]">{row.type}</td>
                        <td className="px-3 py-2.5 tabular-nums text-[#4DD08F] font-bold">+¥{row.amount.toFixed ? row.amount.toFixed(1) : row.amount.toLocaleString("ja-JP")}</td>
                        <td className="px-3 py-2.5 tabular-nums text-[var(--n-muted,#6B6456)]">¥{running.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}</td>
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
