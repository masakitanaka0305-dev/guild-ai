"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CoinCounter — Mercari Lightness (#126) K7
 *
 * Subtle "+¥X" pulses every 5–8s to make the 知恵袋銀行 feel alive.
 * Reduced-motion guard: still updates the value, but skips the bump
 * animation. aria-live polite so screen readers announce updates
 * without interrupting the user.
 */
const COIN_DELTAS = [60, 75, 85, 120, 150, 180, 200, 300];

export interface CoinCounterProps {
  initialJpy: number;
  label?: string;
}

export function CoinCounter({
  initialJpy,
  label = "知恵袋の中身",
}: CoinCounterProps) {
  const [jpy, setJpy] = useState(initialJpy);
  const [delta, setDelta] = useState(0);
  const [bumpKey, setBumpKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef(0);

  useEffect(() => {
    function scheduleNext() {
      const ms = 5000 + Math.floor(Math.random() * 3000);
      timerRef.current = setTimeout(() => {
        const next = COIN_DELTAS[countRef.current % COIN_DELTAS.length];
        countRef.current += 1;
        setDelta(next);
        setJpy((v) => v + next);
        setBumpKey((k) => k + 1);
        scheduleNext();
      }, ms);
    }
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      data-testid="coin-counter"
      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-5 py-4 mb-4"
    >
      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">{label}</p>
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-3xl sm:text-4xl font-black tabular-nums text-[var(--color-text-primary)] leading-none"
      >
        ¥{jpy.toLocaleString("ja-JP")}
      </p>
      {delta > 0 && (
        <p
          key={bumpKey}
          data-testid="coin-counter-delta"
          aria-live="polite"
          className="mt-2 inline-block text-xs font-bold text-[var(--color-ai-action)] motion-safe:animate-fade-in"
        >
          +¥{delta.toLocaleString("ja-JP")}
        </p>
      )}
    </div>
  );
}
