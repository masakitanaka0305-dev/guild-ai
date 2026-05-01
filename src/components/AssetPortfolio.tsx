"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getMyAssets, summarize, sortAssets, relativeTime, isAssetImplemented } from "@/lib/portfolio";
import type { AssetStatus, SortKey, PortfolioAsset } from "@/lib/portfolio";
import { computeStatus, statusSortOrder, STATUS_META } from "@/lib/asset-status";
import type { AssetStatusCode } from "@/lib/asset-status";
import { incomeStream } from "@/lib/income-stream";
import { ComingSoonModal } from "@/components/ui/ComingSoonModal";

/**
 * Asset detail trigger — Link when /asset/[id] exists, else a button that
 * opens the Coming Soon modal so the click is never a dead end.
 */
function DetailTrigger({
  guildId,
  className,
  onComingSoon,
  children = "詳細",
}: {
  guildId: string;
  className: string;
  onComingSoon: () => void;
  children?: React.ReactNode;
}) {
  if (isAssetImplemented(guildId)) {
    return (
      <Link href={`/asset/${guildId}`} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      data-testid="asset-detail-coming-soon"
      onClick={onComingSoon}
      className={className}
    >
      {children}
    </button>
  );
}

// ─── Status badge — Water Guild v3 contrast ──────────────────────────────────

const ASSET_STATUS_CONFIG: Record<AssetStatus, { label: string; className: string }> = {
  active:    { label: "運用中", className: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40" },
  reviewing: { label: "審査中", className: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40" },
  paused:    { label: "停止中", className: "bg-slate-500/20 text-slate-300 ring-1 ring-slate-400/40" },
};

function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const cfg = ASSET_STATUS_CONFIG[status];
  return (
    <span
      role="status"
      aria-label={cfg.label}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Live status badge — Water Guild v3 contrast ─────────────────────────────

const LIVE_STATUS_STYLE: Record<AssetStatusCode, { className: string; dot: string; label: string }> = {
  ready:           { className: "bg-brand-primary/20 text-brand-primary ring-1 ring-brand-primary/40",       dot: "bg-brand-primary",    label: "待機中" },
  executing:       { className: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40", dot: "bg-emerald-300", label: "実行中" },
  awaiting_update: { className: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40",    dot: "bg-amber-300",   label: "要メンテナンス" },
};

function LiveStatusBadge({ code, reducedMotion }: { code: AssetStatusCode; reducedMotion: boolean }) {
  const style = LIVE_STATUS_STYLE[code];
  const meta  = STATUS_META[code];
  return (
    <span
      title={meta.description}
      aria-label={style.label}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${style.className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot} ${
          code === "executing" && !reducedMotion ? "animate-ping" : ""
        }`}
      />
      {style.label}
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
  { value: "status",     label: "ステータス別" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function AssetPortfolio() {
  const [sortKey, setSortKey] = useState<SortKey>("monthly");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const execTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showComingSoon = () => setComingSoonOpen(true);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Subscribe to incomeStream: randomly mark an active asset as "executing" for 5s
  useEffect(() => {
    const activeIds = getMyAssets()
      .filter((a) => a.status === "active")
      .map((a) => a.guildId);

    const handler = () => {
      if (activeIds.length === 0) return;
      const idx = Math.floor(Math.random() * activeIds.length);
      setExecutingId(activeIds[idx]);
      if (execTimerRef.current) clearTimeout(execTimerRef.current);
      execTimerRef.current = setTimeout(() => setExecutingId(null), 5_000);
    };

    incomeStream.subscribe(handler);
    return () => {
      incomeStream.unsubscribe(handler);
      if (execTimerRef.current) clearTimeout(execTimerRef.current);
    };
  }, []);

  const allAssets = getMyAssets();
  const summary   = summarize(allAssets);
  const now       = Date.now();

  // Compute live status for each asset
  const getLiveStatus = (asset: PortfolioAsset): AssetStatusCode => {
    if (executingId === asset.guildId) return "executing";
    return computeStatus(asset, now);
  };

  // Sort assets
  const assets =
    sortKey === "status"
      ? [...allAssets].sort((a, b) => statusSortOrder(getLiveStatus(a)) - statusSortOrder(getLiveStatus(b)))
      : sortAssets(allAssets, sortKey);

  if (allAssets.length === 0) {
    return (
      <div className="bg-midnight-surface border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-slate-400 mb-4">まだ投稿された資産はありません</p>
        <Link
          href="/sell"
          className="inline-flex items-center min-h-[44px] px-5 py-2.5 rounded-full bg-ai-action text-text-on-primary font-semibold hover:shadow-[0_0_0_2px_rgba(76,29,149,0.4),0_0_18px_rgba(76,29,149,0.25)] outline-none focus:outline focus:outline-2 focus:outline-brand-primary"
        >
          投稿する
        </Link>
      </div>
    );
  }

  return (
    <section>
      {/* Summary row + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm leading-relaxed text-white">
          <span className="font-semibold text-emerald-300 tabular-nums">運用中 {summary.active} 件</span>
          <span className="text-slate-400 mx-1">／</span>
          <span className="font-semibold text-amber-300 tabular-nums">審査中 {summary.reviewing} 件</span>
          <span className="text-slate-400 mx-1">／</span>
          <span className="font-semibold text-slate-300 tabular-nums">停止中 {summary.paused} 件</span>
          <span className="text-slate-400 mx-1">—</span>
          <span className="font-semibold text-white tabular-nums">合計 {summary.total} 件</span>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="並び替え"
            className="min-h-[44px] text-xs rounded-lg px-3 py-2 bg-midnight-surface text-text-primary border border-white/10 focus:outline-none focus:border-ai-action focus:ring-1 focus:ring-[#4C1D95]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Link
            href="/sell"
            data-testid="new-listing-cta"
            className="inline-flex items-center gap-1 min-h-[44px] px-4 py-2 rounded-full bg-ai-action text-text-on-primary text-sm font-semibold hover:shadow-[0_0_0_2px_rgba(76,29,149,0.4),0_0_18px_rgba(76,29,149,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-brand-primary whitespace-nowrap"
          >
            ＋ 新しく投稿する
          </Link>
        </div>
      </div>

      {/* PC table (md+) */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 hidden md:block">
        <table className="w-full text-sm bg-midnight-surface">
          <caption className="sr-only">運用中の資産一覧</caption>
          <thead>
            <tr className="border-b border-white/10 bg-[#1E293B]">
              {["タイトル", "ステータス", "実行状態", "公開エンドポイント", "今月の報酬", "累計コール数", "最終呼び出し", ""].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 first:rounded-tl-2xl last:rounded-tr-2xl"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, i) => {
              const liveStatus = getLiveStatus(asset);
              return (
                <tr
                  key={asset.guildId}
                  aria-rowindex={i + 1}
                  className="border-b border-white/10 last:border-0 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-semibold text-base text-white tracking-tight max-w-[180px] truncate">
                    {asset.titleJa}
                  </td>
                  <td className="px-4 py-3">
                    <AssetStatusBadge status={asset.status} />
                  </td>
                  <td className="px-4 py-3">
                    <LiveStatusBadge code={liveStatus} reducedMotion={reducedMotion} />
                  </td>
                  <td className="px-4 py-3">
                    <code
                      aria-label="公開エンドポイント"
                      title={`/api/note/…${asset.endpointShort}`}
                      className="font-mono text-xs text-slate-400 hover:text-ai-action truncate inline-block max-w-[200px]"
                    >
                      /api/note/…{asset.endpointShort}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {asset.monthlyJpy > 0 ? (
                      <span className="text-ai-action font-semibold text-base">
                        ¥{asset.monthlyJpy.toLocaleString("ja-JP")}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-white font-semibold">
                        {asset.callsLast30.toLocaleString("ja-JP")}
                      </span>
                      <Sparkline
                        data={asset.sparkline}
                        title={`${asset.titleJa} の直近7日コール推移`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">
                    {relativeTime(asset.lastCalledAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <DetailTrigger
                        guildId={asset.guildId}
                        onComingSoon={showComingSoon}
                        className="inline-flex items-center justify-center min-h-[44px] px-3 text-brand-primary underline-offset-4 hover:underline outline-none focus:outline focus:outline-2 focus:outline-brand-primary rounded"
                      />
                      <Link
                        href={`/lineage/${encodeURIComponent(asset.guildId)}`}
                        aria-label={`${asset.titleJa} の家系図を見る`}
                        title="家系図"
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-slate-300 hover:text-ai-action"
                      >
                        🌳
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {assets.map((asset) => {
          const liveStatus = getLiveStatus(asset);
          return (
            <li
              key={asset.guildId}
              className="bg-midnight-surface border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-brand-primary/40"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3
                  data-testid="asset-card-title"
                  className="font-semibold text-base sm:text-lg text-white tracking-tight leading-tight"
                >
                  {asset.titleJa}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <AssetStatusBadge status={asset.status} />
                </div>
              </div>
              <div className="mb-3">
                <LiveStatusBadge code={liveStatus} reducedMotion={reducedMotion} />
              </div>
              <code
                aria-label="公開エンドポイント"
                title={`/api/note/…${asset.endpointShort}`}
                className="block text-xs font-mono text-text-muted hover:text-ai-action truncate mb-4"
              >
                /api/note/…{asset.endpointShort}
              </code>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">今月の報酬</p>
                  <p className="metric-prime tabular-nums" style={{ fontSize: "1.125rem" }}>
                    {asset.monthlyJpy > 0 ? `¥${asset.monthlyJpy.toLocaleString("ja-JP")}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">累計コール数</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base tabular-nums text-white font-semibold">
                      {asset.callsLast30.toLocaleString("ja-JP")}
                    </span>
                    <Sparkline
                      data={asset.sparkline}
                      title={`${asset.titleJa} の直近7日コール推移`}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">最終呼び出し</p>
                  <p className="text-xs text-slate-300 tabular-nums">{relativeTime(asset.lastCalledAt)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Link
                  href={`/lineage/${encodeURIComponent(asset.guildId)}`}
                  aria-label={`${asset.titleJa} の家系図を見る`}
                  title="家系図"
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-slate-300 hover:text-ai-action"
                >
                  🌳
                </Link>
                <DetailTrigger
                  guildId={asset.guildId}
                  onComingSoon={showComingSoon}
                  className="inline-flex items-center justify-center min-h-[44px] px-3 text-sm text-brand-primary underline-offset-4 hover:underline outline-none focus:outline focus:outline-2 focus:outline-brand-primary rounded"
                />
              </div>
            </li>
          );
        })}
      </ul>
      <ComingSoonModal open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
    </section>
  );
}
