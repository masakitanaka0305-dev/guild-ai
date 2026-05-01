"use client";

import { useMemo, useState } from "react";
import * as Lucide from "lucide-react";
import {
  BADGES,
  BADGE_AXIS_LABEL,
  BADGE_RANK_TONE,
  TOTAL_BADGES,
  buildShareText,
  evaluateUnlocks,
  type Badge,
  type BadgeAxis,
  type UserHistory,
} from "@/lib/achievements";
import { TAP_CLASS } from "@/lib/motion";

/**
 * AchievementGrid (#130) — the 30-badge wall surfaced at
 * /profile/achievements. Locked tiles are monochrome with a
 "あと N 件で解放" hint; unlocked tiles glow in the badge's tier
 * color and surface a share button.
 *
 * The grid groups by axis (達成 / 期待 / 所属 / 発見 / 上達) so the
 * user can see their balance across motivations at a glance.
 */
export interface AchievementGridProps {
  history: UserHistory;
  /** The user's display handle, used for share copy. */
  handle: string;
}

const AXIS_ORDER: BadgeAxis[] = [
  "achievement",
  "anticipation",
  "belonging",
  "discovery",
  "mastery",
];

function lucideIcon(name: string): React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> | null {
  const C = (Lucide as unknown as Record<string, unknown>)[name];
  return typeof C === "function" || typeof C === "object" ? (C as never) : null;
}

export function AchievementGrid({ history, handle }: AchievementGridProps) {
  const unlocked = useMemo(() => new Set(evaluateUnlocks(history).map((b) => b.id)), [history]);
  const [revealed, setRevealed] = useState<Badge | null>(null);

  return (
    <section
      data-testid="achievement-grid"
      data-total-badges={TOTAL_BADGES}
      data-unlocked-count={unlocked.size}
      aria-labelledby="ach-h"
      className="space-y-6"
    >
      <header className="flex items-baseline justify-between gap-3">
        <h2 id="ach-h" className="text-white font-semibold text-lg">
          アチーブメント
        </h2>
        <p
          data-testid="achievement-progress"
          className="text-xs tabular-nums text-[var(--color-text-muted)]"
        >
          {unlocked.size} / {TOTAL_BADGES} 解放済み
        </p>
      </header>

      {AXIS_ORDER.map((axis) => {
        const inAxis = BADGES.filter((b) => b.axis === axis);
        const inAxisUnlocked = inAxis.filter((b) => unlocked.has(b.id)).length;
        return (
          <div key={axis} data-testid={`achievement-axis-${axis}`} className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-soft)]">
                {BADGE_AXIS_LABEL[axis]}
              </h3>
              <p className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
                {inAxisUnlocked} / {inAxis.length}
              </p>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {inAxis.map((badge) => {
                const isUnlocked = unlocked.has(badge.id);
                const Icon = lucideIcon(badge.icon) ?? Lucide.Award;
                const tone = BADGE_RANK_TONE[badge.rank];
                return (
                  <li
                    key={badge.id}
                    data-testid="achievement-tile"
                    data-badge-id={badge.id}
                    data-locked={isUnlocked ? "false" : "true"}
                    role="img"
                    aria-label={
                      isUnlocked
                        ? `バッジ ${badge.name}：解放済み — ${badge.description}`
                        : `バッジ ${badge.name}：未解放 — 解放条件 ${badge.criteria}`
                    }
                    className={[
                      "rounded-2xl border p-3 flex flex-col items-center gap-2 text-center min-h-[140px]",
                      "border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]",
                      isUnlocked
                        ? `ring-2 ${tone.ring} ${tone.glow}`
                        : "grayscale opacity-70",
                    ].join(" ")}
                  >
                    <Icon
                      aria-hidden
                      className={`w-7 h-7 ${
                        isUnlocked ? tone.text : "text-[var(--color-text-muted)]"
                      }`}
                    />
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isUnlocked ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      {badge.name}
                    </p>
                    {isUnlocked ? (
                      <button
                        type="button"
                        data-testid="achievement-share"
                        data-badge-id={badge.id}
                        onClick={() => setRevealed(badge)}
                        className={`text-[10px] font-semibold underline-offset-4 hover:underline ${tone.text} focus:outline focus:outline-2 focus:outline-[var(--color-action-primary)] ${TAP_CLASS}`}
                      >
                        シェアする
                      </button>
                    ) : (
                      <p className="text-[10px] text-[var(--color-text-muted)] leading-snug">
                        あと N 件で解放: {badge.criteria}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {revealed && (
        <ShareModal badge={revealed} handle={handle} onClose={() => setRevealed(null)} />
      )}
    </section>
  );
}

function ShareModal({
  badge,
  handle,
  onClose,
}: {
  badge: Badge;
  handle: string;
  onClose: () => void;
}) {
  const text = buildShareText(handle, badge);
  const tone = BADGE_RANK_TONE[badge.rank];
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ach-share-h"
      data-testid="achievement-share-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className={`relative max-w-md w-full rounded-3xl border bg-[var(--color-bg-surface)] p-6 ring-2 ${tone.ring} ${tone.glow}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="ach-share-h" className="text-white font-semibold text-lg">
          バッジを獲得しました
        </h3>
        <p className={`mt-1 text-sm font-bold ${tone.text}`}>{badge.name}</p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">{badge.description}</p>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[var(--color-bg-base)] p-3 text-[11px] text-[var(--color-text-primary)]">
          {text}
        </pre>
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(text)}
            data-testid="achievement-share-copy"
            className={`rounded-full border border-[var(--color-border-subtle)] px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] ${TAP_CLASS}`}
          >
            コピー
          </button>
          <a
            href={threadsUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="achievement-share-threads"
            className={`rounded-full border border-[var(--color-border-subtle)] px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] ${TAP_CLASS}`}
          >
            Threads
          </a>
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="achievement-share-x"
            className={`rounded-full bg-brand-primary text-white px-4 py-2 text-xs font-bold hover:bg-brand-primary-hover ${TAP_CLASS}`}
          >
            X で共有
          </a>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute top-3 right-3 inline-flex w-8 h-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline focus:outline-2 focus:outline-[var(--color-action-primary)]"
        >
          ×
        </button>
      </div>
    </div>
  );
}
