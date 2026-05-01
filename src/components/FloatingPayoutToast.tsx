"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: number;
  amountJpy: number;
  label: string;
}

interface Props {
  deltaJpy: number;
  bumpCount: number;
  label?: string;
}

let _toastId = 0;

/**
 * FloatingPayoutToast — slides in from bottom-right when deltaJpy changes,
 * stays 1.5s, then fades out.
 * aria-live="polite" so screen readers announce the payout.
 */
export function FloatingPayoutToast({ deltaJpy, bumpCount, label = "お礼が届きました" }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (bumpCount === 0) return;
    const id = ++_toastId;
    const toast: Toast = { id, amountJpy: deltaJpy, label };
    setToasts((prev) => [...prev, toast]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
    return () => clearTimeout(timer);
  }, [bumpCount]); // eslint-disable-line react-hooks/exhaustive-deps

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-28 right-4 lg:bottom-20 lg:right-6 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 bg-[var(--n-surface,#0E2240)] border border-[var(--n-gold,#D4AF37)]/40 rounded-2xl px-4 py-2.5 shadow-2xl animate-[slideInToast_220ms_ease-out_forwards]"
        >
          <span className="text-[var(--n-gold,#D4AF37)] font-bold text-lg leading-none">🎉</span>
          <div>
            <p className="text-[10px] text-brand-primary font-bold leading-none">おめでとうございます！</p>
            <p className="text-emerald-300 font-bold text-sm tabular-nums mt-0.5">
              +¥{t.amountJpy.toLocaleString("ja-JP")}
            </p>
            <p className="text-[var(--n-muted,#9FB1C8)] text-[10px]">{t.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
