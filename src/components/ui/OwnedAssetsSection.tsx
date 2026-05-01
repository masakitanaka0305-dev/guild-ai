"use client";

import { HexRankBadge } from "@/components/ui/HexRankBadge";
import {
  getOwnedAssets,
  getValueTimeline,
  getTotalValuationJpy,
} from "@/lib/asset-portfolio";
import {
  ROLE_TEXT_CLASS,
  ROLE_RING_CLASS,
  ROLE_BG_CLASS,
  ROLE_LABEL,
  type AssetRoleType,
} from "@/lib/role-colors";

const STATUS_PILL: Record<string, string> = {
  "Private (Vault)": "bg-slate-500/15 text-slate-200 ring-slate-400/30",
  "Encrypted":       "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "Deployed":        "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
};

const STATUS_DOT: Record<string, string> = {
  "Private (Vault)": "bg-slate-400",
  "Encrypted":       "bg-emerald-400",
  "Deployed":        "bg-cyan-400",
};

// Friendly-tone display for the internal status enum.
const STATUS_FRIENDLY: Record<string, string> = {
  "Private (Vault)": "自分だけ",
  "Encrypted":       "鍵つき",
  "Deployed":        "お貸出し中",
};

function formatJpy(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

/**
 * Self-contained SVG sparkline-style area chart for the Owned Assets header.
 * Renders the deterministic timeline from getValueTimeline() — no animation.
 */
function ValueTimelineChart({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const W = 600;
  const H = 80;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const stepX = W / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const fill = `${path} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="もちもの時価のうごき（過去 30 日）"
      data-testid="value-timeline-chart"
      className="w-full h-20"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="value-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#value-fill)" />
      <path d={path} fill="none" stroke="#22D3EE" strokeWidth="1.5" />
    </svg>
  );
}

function TypePill({ type }: { type: AssetRoleType }) {
  const isCross = type === "Cross-functional";
  return (
    <span
      data-testid="owned-asset-type-pill"
      data-type={type}
      aria-label={`カードのジャンル ${ROLE_LABEL[type]}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs uppercase tracking-wide ring-1 ${ROLE_BG_CLASS[type]} ${ROLE_TEXT_CLASS[type]} ${ROLE_RING_CLASS[type]}`}
    >
      {isCross ? (
        <span aria-hidden className="relative inline-block w-2 h-2 rounded-full overflow-hidden">
          <span className="absolute inset-0 bg-cyan-400" />
          <span className="absolute inset-0 left-1/2 bg-violet-400" />
        </span>
      ) : (
        <span
          aria-hidden
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: type === "Dev" ? "#22D3EE" : type === "Design" ? "#A78BFA" : "#FDE047" }}
        />
      )}
      {ROLE_LABEL[type]}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const friendly = STATUS_FRIENDLY[status] ?? status;
  return (
    <span
      data-testid="owned-asset-status-pill"
      data-status={status}
      aria-label={`カードの状態 ${friendly}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${STATUS_PILL[status] ?? "bg-slate-500/15 text-slate-200 ring-slate-400/30"}`}
    >
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-slate-400"}`} />
      {friendly}
    </span>
  );
}

export function OwnedAssetsSection() {
  const assets = getOwnedAssets();
  const total = getTotalValuationJpy();
  const timeline = getValueTimeline(30, "demo-user");
  const last = timeline[timeline.length - 1] ?? total;
  const first = timeline[0] ?? total;
  const deltaPct = first === 0 ? 0 : Math.round(((last - first) / first) * 1000) / 10;
  const deltaPositive = deltaPct >= 0;

  return (
    <section
      role="region"
      aria-labelledby="owned-h"
      data-testid="owned-assets-section"
      className="rounded-2xl border border-white/10 bg-[#162035] border-l-4 border-l-cyan-400 p-5 sm:p-6 mb-4"
    >
      <header className="flex items-baseline justify-between gap-3 mb-3">
        <h2 id="owned-h" className="text-white font-semibold text-base sm:text-lg leading-snug">
          知恵のカード一覧
        </h2>
        <p className="text-[11px] text-slate-400">{assets.length} 枚</p>
      </header>

      {/* もちもの時価のうごき */}
      <div className="rounded-xl border border-white/5 bg-[#0F1827] p-4 mb-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            もちもの時価のうごき
          </p>
          <p className="text-[10px] text-slate-400">過去 30 日</p>
        </div>
        <p
          data-testid="owned-total-valuation"
          className="text-cyan-400 metric-prime tabular-nums mt-1"
        >
          今のあなたの価値：{formatJpy(total)}
        </p>
        <p
          data-testid="owned-delta"
          className={`text-[11px] mt-0.5 tabular-nums ${
            deltaPositive ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {deltaPositive ? "▲" : "▼"} {Math.abs(deltaPct)}%（30 日）
        </p>
        <ValueTimelineChart data={timeline} />
      </div>

      {/* Asset cards */}
      <ul
        data-testid="owned-assets-list"
        aria-label="知恵のカード一覧"
        className="space-y-3"
      >
        {assets.map((a) => (
          <li
            key={a.guildId}
            data-testid="owned-asset-card"
            className="rounded-2xl border border-white/10 bg-[#0F1827] p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <TypePill type={a.type} />
              <StatusPill status={a.status} />
            </div>
            <p className="text-white font-semibold text-sm leading-snug">
              {a.titleJa}
            </p>
            <p className="mt-1 text-[11px] font-mono text-slate-400 truncate">
              {a.guildId}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <HexRankBadge rank={a.rank} size={32} />
              <p className="text-cyan-400 metric-prime tabular-nums">
                {formatJpy(a.valuationJpy)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
