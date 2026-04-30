"use client";

import { useEffect, useState } from "react";
import { subscribeChain, unsubscribeChain, type ChainEvent } from "@/lib/chain-notify";

interface ChainToast {
  id: string;
  event: ChainEvent;
}

/**
 * Aurora-style chain notification toast (gold→purple gradient).
 * Shows when an MD is cited 2+ levels deep.
 * Suppressed when prefers-reduced-motion is set (fade-only).
 */
export function ChainNotifyToast() {
  const [toasts, setToasts] = useState<ChainToast[]>([]);

  useEffect(() => {
    const handler = (evt: ChainEvent) => {
      const toast: ChainToast = { id: evt.id, event: evt };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3_500);
    };
    subscribeChain(handler);
    return () => unsubscribeChain(handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-40 right-4 lg:bottom-32 lg:right-6 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-label={`連鎖配当通知: ${t.event.depth}段階先で引用 累積配当 +¥${t.event.cumulativeIncrease}`}
          className="flex items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl animate-[slideInToast_220ms_ease-out_forwards] motion-reduce:animate-[fadeIn_300ms_ease-out_forwards]"
          style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #9B59B6 100%)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-xs leading-snug">
              {t.event.depth} 段階先で引用されました
            </p>
            <p className="text-white/80 text-[10px] mt-0.5 tabular-nums">
              累積配当 +¥{t.event.prevCumulative.toLocaleString("ja-JP")} →{" "}
              +¥{t.event.newCumulative.toLocaleString("ja-JP")}
            </p>
            <p className="text-white/70 text-[10px] truncate mt-0.5">
              {t.event.parentTitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
