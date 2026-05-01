"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { BADGES, BADGE_RANK_TONE, type UserHistory } from "@/lib/achievements";
import { getNextMilestone } from "@/lib/milestones";

/**
 * NextMilestoneCard (#130) — surfaces the *single* most rewarding
 * milestone the user is closest to. Lives near the top of /guild.
 */
export interface NextMilestoneCardProps {
  history: UserHistory;
}

export function NextMilestoneCard({ history }: NextMilestoneCardProps) {
  const m = getNextMilestone(history);
  if (!m) return null;
  const badge = BADGES.find((b) => b.id === m.rewardBadgeId);
  const tone = badge ? BADGE_RANK_TONE[badge.rank] : BADGE_RANK_TONE.silver;
  const pct = Math.round(m.progressPercent * 100);
  return (
    <section
      data-testid="next-milestone-card"
      data-kind={m.kind}
      data-progress={pct}
      aria-labelledby="nmc-h"
      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 mb-4"
    >
      <header className="flex items-baseline justify-between gap-3 mb-2">
        <h2
          id="nmc-h"
          className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-action-secondary)] inline-flex items-center gap-1.5"
        >
          <Target aria-hidden className="w-3 h-3 stroke-[var(--color-action-secondary)]" />
          次のマイルストーン
        </h2>
        <p className="text-[10px] tabular-nums text-[var(--color-text-muted)]">{pct}%</p>
      </header>

      <p className="text-sm font-bold text-[var(--color-text-primary)] leading-snug">
        {m.remainingCopy}
      </p>

      {/* Progress bar — gold gradient, accessible name via aria. */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={m.remainingCopy}
        data-testid="next-milestone-bar"
        className="mt-3 h-2 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, var(--color-action-primary) 0%, var(--color-action-secondary) 100%)",
          }}
        />
      </div>

      {badge && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">
            達成すると{" "}
            <span
              data-testid="next-milestone-badge-preview"
              className={`font-bold ${tone.text}`}
            >
              {badge.name}
            </span>{" "}
            バッジ
          </p>
          <Link
            href="/profile/achievements"
            className="text-[11px] font-semibold text-[var(--color-link)] underline-offset-4 hover:underline"
          >
            ウォールを見る →
          </Link>
        </div>
      )}
    </section>
  );
}
