"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  subscribeZeroDay,
  unsubscribeZeroDay,
  ZERO_DAY_OPTOUT_KEY,
  type ZeroDayEvent,
} from "@/lib/zero-day";

export function ZeroDayToast() {
  const [event, setEvent] = useState<ZeroDayEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ZERO_DAY_OPTOUT_KEY) === "1") {
      return;
    }

    const handler = (e: ZeroDayEvent) => {
      setEvent(e);
      setVisible(true);
      setDismissed(false);
    };

    subscribeZeroDay(handler);
    return () => unsubscribeZeroDay(handler);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  };

  const handleOptOut = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ZERO_DAY_OPTOUT_KEY, "1");
    }
    handleDismiss();
  };

  if (!event || dismissed) return null;

  const statusLabel = event.status === "covered" ? "対応MD公開中" : "募集中";
  const statusColor = event.status === "covered"
    ? "bg-green-100 text-green-700 border-green-200"
    : "bg-red-100 text-red-700 border-red-200";

  const priorityColor =
    event.priority === "critical" ? "bg-[var(--n-primary,#0000CC)] text-white" :
    event.priority === "high"     ? "bg-amber-500 text-white" :
                                    "bg-blue-500 text-white";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-[88px] left-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 lg:bottom-8 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{
        background: "linear-gradient(135deg, #1A3A6B 0%, #2D6BB5 40%, #B5860A 100%)",
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityColor}`}>
              {event.priority}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>
              {statusLabel}
            </span>
            <span className="text-[10px] text-white/50 font-semibold uppercase tracking-widest">
              ZERO-DAY
            </span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="閉じる"
            className="shrink-0 text-white/60 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <p className="text-sm font-bold text-white leading-snug mb-1">{event.title}</p>
        <p className="text-xs text-white/70 leading-relaxed line-clamp-2 mb-3">{event.description}</p>

        {/* CTA row */}
        <div className="flex items-center gap-2 flex-wrap">
          {event.status === "recruiting" ? (
            <Link
              href={`/sell?topic=${encodeURIComponent(event.topic)}`}
              className="rounded-lg bg-[var(--n-gold,#D4AF37)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              対応MDを出品する →
            </Link>
          ) : (
            <Link
              href={`/feed/zero-day`}
              className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
            >
              フィードを見る →
            </Link>
          )}
          <button
            type="button"
            onClick={handleOptOut}
            className="text-[10px] text-white/40 hover:text-white/60 underline transition-colors"
          >
            非表示にする
          </button>
        </div>
      </div>
    </div>
  );
}
