"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const STEPS = [
  { emoji: "📝", label: "ノートを残す",    sub: "30秒でOK" },
  { emoji: "🤖", label: "AIが働く",       sub: "24時間 自動で" },
  { emoji: "💴", label: "¥が入る",        sub: "チャリン、と" },
  { emoji: "🏦", label: "マイ銀行で確認", sub: "推定時給も見える" },
] as const;

interface Props {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = "onboarding-modal-title";

  // Focus close button on mount
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 animate-[fadeIn_200ms_ease-out]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-6 animate-[slideInToast_200ms_ease-out]"
      >
        {/* Close button */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--n-primary,#E64545)]"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Image
            src="/onboarding/guild-ai-mascot.png"
            alt="Guild AI マスコット"
            width={48}
            height={48}
            className="object-contain flex-shrink-0"
          />
          <h2
            id={titleId}
            className="text-lg font-extrabold text-[#1F1B16] leading-tight"
          >
            初めてのギルドエーアイ講座
          </h2>
        </div>

        {/* 4 steps */}
        <ol className="space-y-3 mb-6">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3">
              <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-[var(--n-surface-2,#F5F3EE)] text-sm font-bold text-[var(--n-muted,#6B6456)]">
                {i + 1}
              </span>
              <span className="text-[28px] leading-none flex-shrink-0" role="img" aria-label={s.label}>
                {s.emoji}
              </span>
              <div>
                <p className="text-sm font-bold text-[#1F1B16]">{s.label}</p>
                <p className="text-xs text-gray-500">{s.sub}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* CTA */}
        <Link
          href="/sell"
          onClick={onClose}
          className="block w-full h-12 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold text-base text-center leading-[3rem] hover:bg-[#D03A3A] active:scale-[0.98] transition-all duration-220 shadow-sm"
        >
          今すぐ ノートを残す
        </Link>
      </div>
    </div>
  );
}
