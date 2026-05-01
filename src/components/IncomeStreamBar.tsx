"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { incomeStream } from "@/lib/income-stream";
import type { IncomeEvent } from "@/lib/income-stream";

// MiniConfetti removed — animations disabled via [data-anim="off"]

// ─── Toast item ───────────────────────────────────────────────────────────────

interface ToastEntry {
  id: number;
  event: IncomeEvent;
  exiting: boolean;
}

function ToastItem({ toast }: { toast: ToastEntry }) {
  const isSubYen = toast.event.amountJpy < 1;

  return (
    <div
      className={`
        relative flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg text-sm font-bold
        ${toast.exiting ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}
        ${isSubYen
          ? "bg-[#FFFBEB] border border-amber-400/40 text-[#92700E]"
          : "bg-[var(--primary,#6366F1)] text-white"
        }
      `}
    >
      {isSubYen ? (
        <>
          <span className="text-amber-400">✨</span>
          <span className="tabular-nums">+¥{toast.event.amountJpy.toFixed(2)}</span>
        </>
      ) : (
        <>
          <span>💴</span>
          <span className="tabular-nums">+¥{toast.event.amountJpy % 1 === 0
            ? toast.event.amountJpy.toLocaleString("ja-JP")
            : toast.event.amountJpy.toFixed(1)
          }</span>
        </>
      )}
    </div>
  );
}

// ─── Bar ─────────────────────────────────────────────────────────────────────

export function IncomeStreamBar() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counterRef = useRef(0);
  const lastFiredAt = useRef(0);
  const THROTTLE_MS = 6_000;

  const handler = useCallback((event: IncomeEvent) => {
    const now = Date.now();
    if (now - lastFiredAt.current < THROTTLE_MS) return;
    lastFiredAt.current = now;

    const id = ++counterRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, event, exiting: false }]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    }, 1_300);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1_600);
  }, []);

  useEffect(() => {
    incomeStream.subscribe(handler);
    return () => incomeStream.unsubscribe(handler);
  }, [handler]);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-24 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
