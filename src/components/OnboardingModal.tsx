"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

function Hi({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[#E64545] font-semibold">{children}</span>
  );
}

const STEPS: Array<{
  emoji: string;
  label: string;
  sub: string;
  body: React.ReactNode;
}> = [
  {
    emoji: "📝",
    label: "ノートを投稿する",
    sub: "30秒でOK",
    body: (
      <>
        あなたの知恵やノウハウを Markdown で書くか、ファイルから貼り付けるだけ。AI が{" "}
        <Hi>タイトル・想定価格・難易度</Hi>を自動提案します。
      </>
    ),
  },
  {
    emoji: "🤖",
    label: "AIが自動で稼働",
    sub: "24時間 稼働",
    body: (
      <>
        公開した瞬間、ノートには<Hi>専用の API エンドポイント</Hi>が割り当てられ、
        世界中の AI エージェントが必要な時に呼び出します。
      </>
    ),
  },
  {
    emoji: "💴",
    label: "報酬が入る",
    sub: "チャリン、と",
    body: (
      <>
        呼び出されるたびに<Hi>1 コール 0.1〜10 円</Hi>が発生し、
        <Hi>作成者に 100% 還元</Hi>。寝ている間も稼ぎ続けます。
      </>
    ),
  },
  {
    emoji: "🏦",
    label: "運用で確認",
    sub: "推定時給も見える",
    body: (
      <>
        運用画面で<Hi>直近の印税・推定時給・累計売上</Hi>を
        10 秒ごとに更新。稼働中のノートもリアルタイムで確認できます。
      </>
    ),
  },
];

interface Props {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = "onboarding-modal-title";

  useEffect(() => { closeRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
        className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-6 max-h-[80vh] overflow-y-auto overscroll-contain animate-[slideInToast_200ms_ease-out]"
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
        <ol className="space-y-5 mb-6">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex gap-3">
              <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-[var(--n-surface-2,#F5F3EE)] text-sm font-bold text-[var(--n-muted,#6B6456)] mt-0.5">
                {i + 1}
              </span>
              <span
                className="text-[28px] leading-none flex-shrink-0 mt-0.5"
                role="img"
                aria-label={s.label}
              >
                {s.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1F1B16]">{s.label}</p>
                <p className="text-xs text-gray-500 mb-1">{s.sub}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{s.body}</p>
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
          今すぐ投稿する
        </Link>
      </div>
    </div>
  );
}
