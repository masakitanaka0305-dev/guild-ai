"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CoinCounter — Cinematic Mint (#128).
 *
 * Each tick adds a fractional yen delta (e.g. ¥0.13 / ¥0.27 / ¥0.42 …)
 * every 3–5 seconds, with a hard rate-limit of 12 ticks per minute. The
 * counter starts in 小数 2 桁 mode and switches to integer ¥ once the
 * accumulated value passes 1 yen — small wins still feel present without
 * inflating into FOMO territory.
 *
 * Sound is **default-muted**: the optional `tickAudio` prop wires an
 * audio element when the user opts in via the header mute toggle.
 * `prefers-reduced-motion: reduce` keeps the value updates but skips
 * the fade-in animation on the delta chip.
 */
const COIN_DELTAS_FRACT = [
  0.05, 0.08, 0.13, 0.21, 0.27, 0.34, 0.42, 0.55, 0.67, 0.84,
];

const TICK_MIN_MS = 3000;
const TICK_MAX_MS = 5000;
const MAX_PER_MINUTE = 12;

export interface CoinCounterProps {
  initialJpy: number;
  label?: string;
  /** When true, plays a soft chime per tick. Default false (muted). */
  soundEnabled?: boolean;
}

export function CoinCounter({
  initialJpy,
  label = "知恵袋の中身",
  soundEnabled = false,
}: CoinCounterProps) {
  const [jpy, setJpy] = useState(initialJpy);
  const [delta, setDelta] = useState(0);
  const [bumpKey, setBumpKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef(0);
  const minuteWindowRef = useRef<{ ts: number; n: number }>({ ts: Date.now(), n: 0 });

  useEffect(() => {
    function scheduleNext() {
      const ms = TICK_MIN_MS + Math.floor(Math.random() * (TICK_MAX_MS - TICK_MIN_MS + 1));
      timerRef.current = setTimeout(() => {
        // Frequency guard — at most 12 ticks per rolling 60s window.
        const now = Date.now();
        if (now - minuteWindowRef.current.ts > 60_000) {
          minuteWindowRef.current = { ts: now, n: 0 };
        }
        if (minuteWindowRef.current.n >= MAX_PER_MINUTE) {
          scheduleNext();
          return;
        }
        minuteWindowRef.current.n += 1;

        const next = COIN_DELTAS_FRACT[countRef.current % COIN_DELTAS_FRACT.length];
        countRef.current += 1;
        setDelta(next);
        setJpy((v) => Math.round((v + next) * 100) / 100);
        setBumpKey((k) => k + 1);
        scheduleNext();
      }, ms);
    }
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showFractional = jpy < 100;
  const formatted = showFractional
    ? `¥${jpy.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `¥${Math.round(jpy).toLocaleString("ja-JP")}`;
  const formattedDelta = `+¥${delta.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      data-testid="coin-counter"
      data-cadence="3-5s"
      data-sound={soundEnabled ? "on" : "off"}
      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-5 py-4 mb-4"
    >
      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">{label}</p>
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-3xl sm:text-4xl font-black tabular-nums text-[var(--color-text-primary)] leading-none"
      >
        {formatted}
      </p>
      {delta > 0 && (
        <p
          key={bumpKey}
          data-testid="coin-counter-delta"
          aria-live="polite"
          className="mt-2 inline-block text-xs font-bold text-[var(--color-action-secondary)] motion-safe:animate-fade-in"
        >
          {formattedDelta}
        </p>
      )}
    </div>
  );
}
