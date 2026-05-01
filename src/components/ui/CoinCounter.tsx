"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveMode } from "@/hooks/useLiveMode";
import { playPoyon, isMuted } from "@/lib/sound";

/**
 * CoinCounter — Cinematic Mint (#128 → #129 Live Mode).
 *
 * Default cadence: 3–5s, no sound, ≤ 12 ticks per rolling 60s window.
 * When the user opts into Live mode (header `<LiveModeSwitch>`), the
 * counter switches to:
 *   - 2 second fixed cadence
 *   - soft chime (`playPoyon`) per tick, unless globally muted
 *   - small "LIVE" pill next to the label
 *   - aria-live announcements throttle to one summary every 30s so
 *     SR users don't hear every tick
 *
 * Both modes share the same fractional yen ledger; the displayed value
 * is identical, only the rhythm changes.
 */
const COIN_DELTAS_FRACT = [
  0.05, 0.08, 0.13, 0.21, 0.27, 0.34, 0.42, 0.55, 0.67, 0.84,
];

const TICK_MIN_MS = 3000;
const TICK_MAX_MS = 5000;
const LIVE_TICK_MS = 2000;
const MAX_PER_MINUTE = 12;
const ARIA_THROTTLE_MS = 30_000;

export interface CoinCounterProps {
  initialJpy: number;
  label?: string;
  /** Force-disable Live mode for this instance (e.g. embedded contexts).
   *  When unset, the counter follows the global `useLiveMode` toggle. */
  forceLiveMode?: "on" | "off";
}

export function CoinCounter({
  initialJpy,
  label = "知恵袋の中身",
  forceLiveMode,
}: CoinCounterProps) {
  const { mode } = useLiveMode();
  const effectiveMode: "on" | "off" = forceLiveMode ?? mode;
  const isLive = effectiveMode === "on";

  const [jpy, setJpy] = useState(initialJpy);
  const [delta, setDelta] = useState(0);
  const [bumpKey, setBumpKey] = useState(0);
  const [ariaSummary, setAriaSummary] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef(0);
  const minuteWindowRef = useRef<{ ts: number; n: number }>({ ts: Date.now(), n: 0 });
  const lastAriaAtRef = useRef(0);
  const tickAccumRef = useRef(0);

  useEffect(() => {
    function scheduleNext() {
      const ms = isLive
        ? LIVE_TICK_MS
        : TICK_MIN_MS + Math.floor(Math.random() * (TICK_MAX_MS - TICK_MIN_MS + 1));
      timerRef.current = setTimeout(() => {
        // Frequency guard for the relaxed mode — Live mode bypasses it
        // because the user explicitly opted in to the higher cadence.
        if (!isLive) {
          const now = Date.now();
          if (now - minuteWindowRef.current.ts > 60_000) {
            minuteWindowRef.current = { ts: now, n: 0 };
          }
          if (minuteWindowRef.current.n >= MAX_PER_MINUTE) {
            scheduleNext();
            return;
          }
          minuteWindowRef.current.n += 1;
        }

        const next = COIN_DELTAS_FRACT[countRef.current % COIN_DELTAS_FRACT.length];
        countRef.current += 1;
        setDelta(next);
        setJpy((v) => Math.round((v + next) * 100) / 100);
        setBumpKey((k) => k + 1);
        tickAccumRef.current = Math.round((tickAccumRef.current + next) * 100) / 100;

        // Live-mode chime — respects global mute toggle.
        if (isLive && !isMuted()) {
          playPoyon();
        }

        // Throttled aria-live summary so SR users don't hear every
        // single tick. Fires at most once per 30s.
        const now2 = Date.now();
        if (now2 - lastAriaAtRef.current >= ARIA_THROTTLE_MS) {
          lastAriaAtRef.current = now2;
          const since = tickAccumRef.current.toLocaleString("ja-JP", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          setAriaSummary(`直近 30 秒で +¥${since} 入りました`);
          tickAccumRef.current = 0;
        }

        scheduleNext();
      }, ms);
    }
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLive]);

  const showFractional = jpy < 100;
  const formatted = showFractional
    ? `¥${jpy.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `¥${Math.round(jpy).toLocaleString("ja-JP")}`;
  const formattedDelta = `+¥${delta.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      data-testid="coin-counter"
      data-cadence={isLive ? "2s" : "3-5s"}
      data-sound={isLive ? "on" : "off"}
      data-live={isLive ? "on" : "off"}
      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-5 py-4 mb-4"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
        {isLive && (
          <span
            data-testid="coin-counter-live-pill"
            aria-hidden
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest text-[var(--color-action-secondary)] bg-[var(--color-action-secondary)]/10 border border-[var(--color-action-secondary)]/30"
          >
            <span className="block w-1 h-1 rounded-full bg-[var(--color-action-secondary)] motion-safe:animate-pulse motion-reduce:animate-none" />
            LIVE
          </span>
        )}
      </div>
      <p
        className="text-3xl sm:text-4xl font-black tabular-nums text-[var(--color-text-primary)] leading-none"
      >
        {formatted}
      </p>
      {/* Throttled summary (every 30s) for screen readers — separate
          from the visual chip so we don't announce every tick in Live
          mode. */}
      <span
        data-testid="coin-counter-aria-summary"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {ariaSummary}
      </span>
      {delta > 0 && (
        <p
          key={bumpKey}
          data-testid="coin-counter-delta"
          className="mt-2 inline-block text-xs font-bold text-[var(--color-action-secondary)] motion-safe:animate-fade-in"
        >
          {formattedDelta}
        </p>
      )}
    </div>
  );
}
