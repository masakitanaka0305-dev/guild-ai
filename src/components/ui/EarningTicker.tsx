"use client";

import { useEffect, useState } from "react";
import { useLiveEarnings } from "@/lib/live-earnings";
import { useUserId } from "@/components/AuthProvider";

/**
 * EarningTicker — Mercari Lightness (#126) K8
 *
 * Subtle "+¥X" chip in the global header. Cycles every ~7s using
 * the live-earnings stream. aria-live polite. Reduced-motion users
 * see only the value swap (no fade).
 */
export function EarningTicker({ className }: { className?: string }) {
  const userId = useUserId();
  const earnings = useLiveEarnings(userId);
  const [shown, setShown] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (!earnings.lastDelta) return;
    setShown(earnings.lastDelta);
    setPulseKey((k) => k + 1);
  }, [earnings.bumpCount, earnings.lastDelta]);

  if (shown <= 0) return null;

  return (
    <span
      key={pulseKey}
      data-testid="earning-ticker"
      aria-live="polite"
      aria-atomic="true"
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
        "bg-[var(--color-ai-action)]/10 text-[var(--color-ai-action)]",
        "motion-safe:animate-fade-in",
        className ?? "",
      ].join(" ")}
    >
      <span aria-hidden className="inline-block w-1 h-1 rounded-full bg-[var(--color-ai-action)] animate-pulse motion-reduce:animate-none" />
      +¥{shown.toLocaleString("ja-JP")}
    </span>
  );
}
