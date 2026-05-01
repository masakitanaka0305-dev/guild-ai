"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, X } from "lucide-react";
import {
  buildHoFTickerStack,
  TICKER_DISMISS_HOURS,
  TICKER_DISMISS_KEY,
  TICKER_INTERVAL_MS,
} from "@/lib/hall-of-fame-ticker";

/**
 * HallOfFameTicker (#130) — anonymized + self facts strip under the
 * MainHeader. Cycles one entry every TICKER_INTERVAL_MS (30s). One
 * dismiss button hides the strip for 24h via localStorage.
 *
 * Visual only — no chime, no flash. aria-live polite so SR users hear
 * each rotation once.
 */
export function HallOfFameTicker({
  userId = "you",
  uniqueUsers24h = 41,
}: {
  userId?: string;
  uniqueUsers24h?: number;
}) {
  const stack = useMemo(
    () => buildHoFTickerStack(userId, uniqueUsers24h),
    [userId, uniqueUsers24h],
  );
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Honor a previous dismiss.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const until = window.localStorage.getItem(TICKER_DISMISS_KEY);
      if (until && Date.now() < Number(until)) {
        setDismissed(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Rotate every 30s.
  useEffect(() => {
    if (dismissed) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % stack.length);
    }, TICKER_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [dismissed, stack.length]);

  function dismiss() {
    setDismissed(true);
    try {
      const until = Date.now() + TICKER_DISMISS_HOURS * 60 * 60 * 1000;
      window.localStorage.setItem(TICKER_DISMISS_KEY, String(until));
    } catch { /* ignore */ }
  }

  if (dismissed || stack.length === 0) return null;
  const current = stack[idx];

  return (
    <div
      data-testid="halloffame-ticker"
      data-event-kind={current.kind}
      data-interval-ms={TICKER_INTERVAL_MS}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="h-7 flex items-center justify-between gap-3 px-3 sm:px-4 bg-[#0E1422] border-b border-[var(--color-border-subtle)]"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Crown
          aria-hidden
          className="w-3.5 h-3.5 stroke-[var(--color-action-secondary)] flex-shrink-0"
        />
        <p
          data-testid="halloffame-ticker-message"
          className="text-[11px] truncate text-[var(--color-cyan-helper)]"
        >
          {current.message}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="このティッカーを 24 時間閉じる"
        data-testid="halloffame-ticker-dismiss"
        className="inline-flex w-6 h-6 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline focus:outline-2 focus:outline-[var(--color-action-primary)]"
      >
        <X aria-hidden className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
