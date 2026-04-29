"use client";

import { useState } from "react";
import Link from "next/link";
import { getMyAssets, summarize, sortAssets, relativeTime } from "@/lib/portfolio";
import type { AssetStatus, SortKey } from "@/lib/portfolio";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AssetStatus, { label: string; className: string }> = {
  active:    { label: "運用中", className: "bg-green-100 text-green-700" },
  reviewing: { label: "審査中", className: "bg-amber-100 text-amber-700" },
  paused:    { label: "停止中", className: "bg-gray-100 text-gray-600" },
};

function StatusBadge({ status }: { status: AssetStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      role="status"
      aria-label={`ステータス: ${cfg.label}`}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data, title }: { data: number[]; title: string }) {
  const W = 60, H = 16;
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - (v / max) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <polyline
        points={pts}
        fill="none"
        stroke="#0E9F4F"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "monthly",    label: "報酬順" },
  { value: "calls",      label: "コール数順" },
  { value: "lastCalled", label: "最終呼び出し順" },
  { value: "postedAt",   label: "投稿日順" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function AssetPortfolio() {
  const [sortKey, setSortKey] = useState<SortKey>("monthly");
  const allAssets = getMyAssets();
  const assets    = sortAssets(allAssets, sortKey);
  const summary   = summarize(allAssets);

  if (allAssets.length === 0) {
    return (
      <div className="bg-white border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-8 text-center">
        <p className="text-[var(--n-muted,#6B6456)] mb-4">まだ投稿された資産はありません</p>
        <Link
          href="/sell"
          className="inline-flex items-center px-5 py-2.5 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          投稿する
        </Link>
      </div>
    );
  }

  return (
    <section>
      {/* Summary row + controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-xs leading-relaxed">
          <span className="font-semibold text-green-700">運用中 {summary.active} 件</span>
          {" ／ "}
          <span className="font-semibold text-amber-700">審査中 {summary.reviewing} 件</span>
          {" ／ "}
          <span className="font-semibold text-gray-500">停止中 {summary.paused} 件</span>
          {" — "}
          <span className="font-semibold text-[var(--n-text,#1A1714)]">合計 {summary.total} 件</span>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="並び替え"
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-[var(--n-muted,#6B6456)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--n-primary,#E64545)]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Link
            href="/sell"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--n-primary,#E64545)] text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            ＋ 新しく投稿する
          </Link>
        </div>
      </div>

      {/* PC table (md+) */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--n-divider,rgba(0,0,0,0.08))] hidden md:block">
        <table className="w-full text-xs bg-white">
          <caption className="sr-only">運用中の資産一覧</caption>
          <thead>
            <tr className="border-b border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[var(--n-surface-2,#F5F3EE)]">
              {["タイトル", "ステータス", "公開エンドポイント", "今月の報酬", "累計コール数", "最終呼び出し", ""].map((h) => (
                <th key={h} scope="col" className="px-4 py-2.5 text-left font-semibold text-[var(--n-muted,#6B6456)] first:rounded-tl-2xl last:rounded-tr-2xl">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, i) => (
              <tr
                key={asset.guildId}
                aria-rowindex={i + 1}
                className="border-b border-[var(--n-divider,rgba(0,0,0,0.08))] last:border-0 hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
              >
                <td className="px-4 py-3 font-bold text-[var(--n-text,#1A1714)] max-w-[160px] truncate">
                  {asset.titleJa}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={asset.status} />
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-[var(--n-muted,#6B6456)]">
                  /api/note/…{asset.endpointShort}
                </td>
                <td className="px-4 py-3 text-right font-bold text-[var(--n-primary,#E64545)] tabular-nums">
                  {asset.monthlyJpy > 0 ? `¥${asset.monthlyJpy.toLocaleString("ja-JP")}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-[var(--n-muted,#6B6456)]">
                      {asset.callsLast30.toLocaleString("ja-JP")}
                    </span>
                    <Sparkline
                      data={asset.sparkline}
                      title={`${asset.titleJa} の直近7日コール推移`}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--n-muted,#6B6456)]">
                  {relativeTime(asset.lastCalledAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/asset/${asset.guildId}`}
                      className="px-3 py-1 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] hover:border-[var(--n-primary,#E64545)] hover:text-[var(--n-primary,#E64545)] transition-colors"
                    >
                      詳細
                    </Link>
                    <Link
                      href={`/lineage/${encodeURIComponent(asset.guildId)}`}
                      aria-label={`${asset.titleJa} の家系図を見る`}
                      title="家系図"
                      className="px-2 py-1 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] hover:border-[var(--n-gold,#D4AF37)] hover:text-[var(--n-gold,#D4AF37)] transition-colors text-xs"
                    >
                      🌳
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {assets.map((asset) => (
          <li
            key={asset.guildId}
            className="bg-white border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-bold text-sm text-[var(--n-text,#1A1714)] leading-tight">{asset.titleJa}</p>
              <StatusBadge status={asset.status} />
            </div>
            <p className="text-[10px] font-mono text-[var(--n-muted,#6B6456)] mb-3">
              /api/note/…{asset.endpointShort}
            </p>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-0.5">今月の報酬</p>
                <p className="text-sm font-bold text-[var(--n-primary,#E64545)] tabular-nums">
                  {asset.monthlyJpy > 0 ? `¥${asset.monthlyJpy.toLocaleString("ja-JP")}` : "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-0.5">累計コール数</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs tabular-nums text-[var(--n-muted,#6B6456)]">
                    {asset.callsLast30.toLocaleString("ja-JP")}
                  </span>
                  <Sparkline
                    data={asset.sparkline}
                    title={`${asset.titleJa} の直近7日コール推移`}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-0.5">最終呼び出し</p>
                <p className="text-xs text-[var(--n-muted,#6B6456)]">{relativeTime(asset.lastCalledAt)}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Link
                href={`/lineage/${encodeURIComponent(asset.guildId)}`}
                aria-label={`${asset.titleJa} の家系図を見る`}
                title="家系図"
                className="px-2 py-1 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-xs text-[var(--n-muted,#6B6456)] hover:border-[var(--n-gold,#D4AF37)] hover:text-[var(--n-gold,#D4AF37)] transition-colors"
              >
                🌳
              </Link>
              <Link
                href={`/asset/${asset.guildId}`}
                className="px-3 py-1 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-xs text-[var(--n-muted,#6B6456)] hover:border-[var(--n-primary,#E64545)] hover:text-[var(--n-primary,#E64545)] transition-colors"
              >
                詳細
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
