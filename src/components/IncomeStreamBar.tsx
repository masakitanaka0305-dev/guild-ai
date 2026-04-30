"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { incomeStream } from "@/lib/income-stream";
import type { IncomeEvent } from "@/lib/income-stream";

// ─── Mini confetti (6 gold particles, 0.6 s) ─────────────────────────────────

function MiniConfetti({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = Array.from({ length: 6 }, (_, i) => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 5,
      vy: -(Math.random() * 3 + 1.5),
      alpha: 1,
      r: 2.5 + Math.random() * 1.5,
      hue: 35 + i * 8,
    }));

    const DURATION = 600;
    let start = 0;
    let raf: number;

    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.alpha = Math.max(0, 1 - elapsed / DURATION);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 88%, 52%, ${p.alpha})`;
        ctx!.fill();
      });
      if (elapsed < DURATION) raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={40}
      className="absolute -top-3 right-0 pointer-events-none"
      aria-hidden
    />
  );
}

// ─── Toast item ───────────────────────────────────────────────────────────────

interface ToastEntry {
  id: number;
  event: IncomeEvent;
  exiting: boolean;
}

function ToastItem({ toast }: { toast: ToastEntry }) {
  const isSubYen = toast.event.amountJpy < 1;
  const confettiTrigger = isSubYen ? toast.id : 0;

  return (
    <div
      className={`
        relative flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg text-sm font-bold
        transition-all duration-300
        ${toast.exiting ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}
        ${isSubYen
          ? "bg-[#FFFBEB] border border-[var(--n-gold,#D4AF37)]/40 text-[#92700E]"
          : "bg-[var(--n-primary,#0000CC)] text-white"
        }
      `}
    >
      {isSubYen ? (
        <>
          <span className="text-[var(--n-gold,#D4AF37)]">✨</span>
          <span className="tabular-nums">+¥{toast.event.amountJpy.toFixed(2)}</span>
          <MiniConfetti trigger={confettiTrigger} />
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
