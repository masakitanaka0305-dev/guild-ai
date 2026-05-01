"use client";

import { useState } from "react";
import { buildXShareUrl } from "@/lib/social-share";

interface ImpactCardProps {
  savedProjects: number;
  contributionScore: number;
  thisMonthRank: number;
  allTimeRank: number;
}

export function ImpactCard({
  savedProjects,
  contributionScore,
  thisMonthRank,
  allTimeRank,
}: ImpactCardProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `GUILD AI で ${savedProjects} プロジェクトに貢献しました！\n貢献スコア ${contributionScore.toLocaleString("ja-JP")} / 今月ランク #${thisMonthRank}\nAIエージェントで、あなたの時間をアップデート。\n#GUILDAI`;
  const shareUrl = "https://guild-ai.vercel.app/profile";

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-5 shadow-sm mb-6"
      aria-label="社会的インパクト"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-[var(--primary,#6366F1)] flex-shrink-0" />
        <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">社会インパクト</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl px-4 py-4 text-center">
          <p className="text-3xl font-extrabold tabular-nums text-[var(--primary,#6366F1)] leading-none mb-1">
            {savedProjects}
          </p>
          <p className="text-[11px] text-[var(--n-muted,#6B6456)] leading-tight">プロジェクトを救った</p>
        </div>
        <div className="bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl px-4 py-4 text-center">
          <p className="text-3xl font-extrabold tabular-nums text-[var(--n-gold,#D4AF37)] leading-none mb-1">
            {contributionScore.toLocaleString("ja-JP")}
          </p>
          <p className="text-[11px] text-[var(--n-muted,#6B6456)] leading-tight">累積貢献スコア</p>
        </div>
      </div>

      {/* Ranks */}
      <div
        role="status"
        aria-label={`ランキング: 今月 ${thisMonthRank}位 / 累計 ${allTimeRank}位`}
        className="flex items-center gap-3 mb-4 px-4 py-2 bg-[var(--n-surface-2,#F5F3EE)] rounded-xl"
      >
        <span className="text-xs text-[var(--n-muted,#6B6456)]">ランキング</span>
        <span className="text-xs font-bold text-[var(--n-text,#1A1714)]">
          今月 <span className="text-[var(--primary,#6366F1)]">#{thisMonthRank}</span>
        </span>
        <span className="text-[var(--n-divider,rgba(0,0,0,0.08))] text-xs">／</span>
        <span className="text-xs font-bold text-[var(--n-text,#1A1714)]">
          累計 <span className="text-[var(--n-muted,#6B6456)]">#{allTimeRank}</span>
        </span>
      </div>

      {/* Share row */}
      <div className="flex items-center gap-2">
        <a
          href={buildXShareUrl(shareText, shareUrl)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Xでシェアする"
          className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.08)] px-3 py-1.5 text-xs font-semibold text-[var(--n-text,#1A1714)] hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors active:scale-[0.97]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Xでシェア
        </a>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="シェアテキストをコピー"
          className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.08)] px-3 py-1.5 text-xs font-semibold text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors active:scale-[0.97]"
        >
          {copied ? "✓ コピー済" : "コピー"}
        </button>
      </div>
    </section>
  );
}
