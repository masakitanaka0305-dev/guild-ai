"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getActivePriorityEvent, ZERO_DAY_BANNER_DISMISSED_KEY } from "@/lib/zero-day";

export function ZeroDayBanner() {
  const [visible, setVisible] = useState(false);
  const event = getActivePriorityEvent();

  useEffect(() => {
    if (!event) return;
    const dismissedUntil = localStorage.getItem(ZERO_DAY_BANNER_DISMISSED_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;
    setVisible(true);
  }, [event]);

  const handleDismiss = () => {
    setVisible(false);
    const twentyFourHours = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(ZERO_DAY_BANNER_DISMISSED_KEY, String(twentyFourHours));
  };

  if (!visible || !event) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative z-40 w-full px-4 py-2.5 flex items-center justify-between gap-3"
      style={{
        background: "linear-gradient(to right, #FEF3C7, #FECACA)",
        boxShadow: "0 0 8px rgba(255,200,80,0.4)",
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs font-black text-rose-700 shrink-0">🔴 緊急</span>
        <p className="text-xs font-semibold text-amber-900 truncate">
          {event.title} — {event.description}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/feed/zero-day"
          className="text-[10px] font-bold px-3 py-1 rounded-full bg-[var(--primary,#6366F1)] text-white hover:opacity-90 transition-opacity"
        >
          詳細
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="バナーを閉じる（24時間非表示）"
          className="text-amber-700 hover:text-amber-900 text-base leading-none transition-colors"
        >
          ×
        </button>
      </div>

    </div>
  );
}
