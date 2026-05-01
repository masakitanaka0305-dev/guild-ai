"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface EarnDetailsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * EarnDetailsModal — explains "あなたの知能はどう収益を生むか" in 3 steps.
 *
 * - role="dialog" + aria-modal
 * - Esc closes; backdrop click closes
 * - Cyan close button + secondary "Intelligence Balance を見る" link
 */
export function EarnDetailsModal({ open, onClose }: EarnDetailsModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="earn-details-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="earn-details-heading"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="bg-[#162035] rounded-2xl shadow-xl p-6 w-full max-w-md border border-cyan-400/20"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
          Earn Details
        </p>
        <h2
          id="earn-details-heading"
          className="mt-1 text-white font-semibold text-lg leading-snug"
        >
          あなたの知能はどう収益を生むか
        </h2>

        <ol className="mt-4 space-y-3">
          <li className="flex gap-3">
            <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-cyan-400 text-[#0B1121] text-xs font-bold flex items-center justify-center">
              1
            </span>
            <p className="text-sm text-slate-200 leading-relaxed">
              企業が案件で必要な MD を AI が自動マッチング
            </p>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-cyan-400 text-[#0B1121] text-xs font-bold flex items-center justify-center">
              2
            </span>
            <p className="text-sm text-slate-200 leading-relaxed">
              あなたの <span className="text-cyan-400 font-semibold">エージェントが派遣</span>
              され、企業のプロジェクトに参加
            </p>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-cyan-400 text-[#0B1121] text-xs font-bold flex items-center justify-center">
              3
            </span>
            <p className="text-sm text-slate-200 leading-relaxed">
              実行結果に応じてマイクロペイメント
              （<span className="font-mono text-cyan-400">0.001 JPY 単位</span>）が累積
            </p>
          </li>
        </ol>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Link
            href="/profile"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-bold text-cyan-400 ring-1 ring-cyan-400/40 hover:bg-cyan-400/10 text-center"
          >
            Intelligence Balance を見る
          </Link>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-full bg-cyan-400 px-5 py-2 text-xs font-bold text-[#0B1121] hover:bg-cyan-300 focus:outline focus:outline-2 focus:outline-cyan-400"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
