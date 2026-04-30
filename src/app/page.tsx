"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { MOCK_JOBS } from "@/lib/jobs";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AuthBar } from "@/components/AuthBar";
import { Hexagon } from "@/components/ui/Hexagon";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_NOTES = [
  { id: "n1", title: "TypeScript設計パターン集", priceMin: 8000, priceMax: 32000, rank: "S" },
  { id: "n2", title: "Rustメモリ安全設計ノート", priceMin: 6000, priceMax: 24000, rank: "S" },
  { id: "n3", title: "LLM Prompt Engineering集", priceMin: 3000, priceMax: 12000, rank: "A" },
] as const;

const HOW_TILES = [
  { emoji: "📝", label: "ノートを投稿",     sub: "30秒でOK",    href: "/sell" },
  { emoji: "🤖", label: "AIが自動で稼働",  sub: "24時間 稼働",  href: "/jobs" },
  { emoji: "💴", label: "報酬が入る",       sub: "チャリン",     href: "/guild" },
] as const;

const RANK_COLORS: Record<string, string> = {
  S: "bg-[#D4AF37]/15 text-[#7A5000] border-[#D4AF37]/40",
  A: "bg-[var(--n-text,#1A1714)]/5 text-[var(--n-text,#1A1714)] border-[var(--n-text,#1A1714)]/15",
};

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-6 rounded-full bg-[var(--n-primary,#E64545)] flex-shrink-0" />
      <h2 className="text-base font-bold text-[var(--n-text,#1A1714)]">{title}</h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("guild_onboarding_seen", "1");
    }
  }, []);
  const dismissBanner = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("guild_onboarding_dismissed", "1");
    }
  }, []);

  return (
    <main className="max-w-2xl mx-auto space-y-8">

      {/* ── Auth bar (session-aware login/signup or user/logout) ── */}
      <AuthBar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pt-2">
        <h1 className="text-[28px] sm:text-4xl lg:text-5xl font-extrabold leading-[1.2] tracking-tight text-[#1F1B16] mb-4 sm:mb-5">
          <span className="block">AIエージェントで、</span>
          <span className="block">あなたの時間を</span>
          <span className="block">アップデート。</span>
        </h1>
        <p className="text-base sm:text-lg font-semibold text-[#4A4458] mt-3 mb-5">
          日本最大のAIエージェント・プラットフォーム
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/bank"
            className="h-14 px-8 min-w-[200px] rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold text-base hover:bg-[#D03A3A] active:scale-[0.98] transition-all duration-220 shadow-sm inline-flex items-center justify-center"
          >
            投稿する
          </Link>
          <Link
            href="/onboarding?fast=1"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--n-primary,#E64545)] hover:underline"
          >
            <span>3 分で利益確定まで →</span>
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-500">ノートを投稿するだけ</p>
        {/* 稼げる目安バッジ */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--n-positive,#0E9F4F)]/10 border border-[var(--n-positive,#0E9F4F)]/25 px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--n-positive,#0E9F4F)] animate-pulse" />
          <span className="text-xs font-bold text-[var(--n-positive,#0E9F4F)]">いま稼げる目安</span>
          <span className="text-sm font-black text-[var(--n-positive,#0E9F4F)] tabular-nums">¥4,280,000</span>
          <span className="text-[10px] text-[var(--n-muted,#6B6456)]">/ 直近24h</span>
        </div>
      </section>

      {/* ── 初めてのギルドエーアイ講座 バナー ────────────────── */}
      {!bannerDismissed && (
        <section className="px-4 sm:px-6">
          <div
            role="button"
            tabIndex={0}
            aria-label="初めてのギルドエーアイ講座"
            onClick={openModal}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openModal(); }}
            className="relative flex items-center gap-4 sm:gap-5 rounded-3xl shadow-sm ring-1 ring-sky-100/60 hover:shadow-md active:scale-[0.99] transition-all duration-220 cursor-pointer overflow-hidden px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD]"
          >
            {/* Hex motif left (Water Guild — geometry only, no character) */}
            <span aria-hidden className="flex-shrink-0">
              <Hexagon
                size={72}
                fill="rgba(34,211,238,0.10)"
                stroke="#22D3EE"
                strokeWidth={2}
                label="G"
                labelColor="#22D3EE"
              />
            </span>

            {/* Text center */}
            <div className="flex-1 min-w-0">
              <p className="text-[17px] sm:text-[18px] font-extrabold text-[#1F1B16] leading-tight mb-1">
                📘 初めてのギルドエーアイ講座
              </p>
              <p className="text-[12px] sm:text-[13px] text-gray-600 leading-snug">
                いまから見ても、
                <span className="text-[var(--n-primary,#E64545)] font-bold">自分のペース</span>
                で学べます！
              </p>
            </div>

            {/* Hex motif right (PC only) */}
            <span aria-hidden className="hidden sm:block flex-shrink-0 opacity-40">
              <Hexagon size={52} stroke="#22D3EE" strokeWidth={1.5} />
            </span>

            {/* Dismiss × */}
            <button
              type="button"
              aria-label="バナーを閉じる"
              onClick={dismissBanner}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors text-[11px] focus:outline-none focus:ring-1 focus:ring-[var(--n-primary,#E64545)]"
            >
              ✕
            </button>
          </div>
        </section>
      )}

      {/* ── つかいかた はかんたん（統合ブロック）─────────────── */}
      <section className="px-4 sm:px-6" aria-label="使い方は3ステップ">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          使い方は3ステップ
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {HOW_TILES.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="bg-[var(--n-surface,#FFFFFF)] border border-black/5 rounded-2xl flex flex-col items-center justify-center gap-1.5 py-5 shadow-sm hover:border-[var(--n-primary,#E64545)]/40 active:scale-[0.98] transition-all duration-220 min-h-[80px]"
            >
              <span
                role="img"
                aria-label={t.label}
                className="text-[36px] leading-none"
              >
                {t.emoji}
              </span>
              <span className="text-[16px] sm:text-[18px] font-bold text-[var(--n-text,#1A1714)] text-center leading-tight px-1">
                {t.label}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500">{t.sub}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── いま のこされた しごと (horizontal scroll) ────────── */}
      <section>
        <div className="px-4 sm:px-6">
          <SectionHeading title="いま のこされた しごと" />
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-2 scrollbar-none snap-x snap-mandatory">
          {MOCK_NOTES.map((n) => (
            <Link
              key={n.id}
              href="/bank"
              className="snap-start flex-shrink-0 w-40 h-28 bg-[var(--n-surface,#FFFFFF)] border border-black/5 rounded-2xl p-3 shadow-sm hover:border-[var(--n-primary,#E64545)]/40 active:scale-[0.99] transition-all duration-220 flex flex-col justify-between"
            >
              <span
                className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${RANK_COLORS[n.rank] ?? ""}`}
              >
                {n.rank}
              </span>
              <p className="text-xs font-bold text-[var(--n-text,#1A1714)] leading-snug line-clamp-2">
                {n.title}
              </p>
              <p className="text-xs font-bold tabular-nums text-[var(--n-primary,#E64545)]">
                ¥{n.priceMin.toLocaleString("ja-JP")}〜
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── かせげる しごと (vertical list) ─────────────────────── */}
      <section className="px-4 sm:px-6 space-y-3">
        <SectionHeading title="かせげる しごと" />
        {MOCK_JOBS.slice(0, 2).map((j) => (
          <div
            key={j.id}
            className="flex items-center gap-3 bg-[var(--n-surface,#FFFFFF)] border border-black/5 rounded-2xl px-4 py-3 shadow-sm"
          >
            <p className="flex-1 text-sm font-bold text-[var(--n-text,#1A1714)] truncate">{j.title}</p>
            <p className="text-sm font-black tabular-nums text-[var(--n-positive,#0E9F4F)] shrink-0">
              ¥{j.reward.toLocaleString("ja-JP")}
            </p>
            <Link
              href="/jobs"
              className="shrink-0 h-9 px-4 rounded-full bg-[var(--n-primary,#E64545)] text-white text-xs font-bold hover:bg-[#D03A3A] active:scale-[0.98] transition-all duration-220 flex items-center"
            >
              応募する
            </Link>
          </div>
        ))}
        <Link
          href="/jobs"
          className="block text-center text-xs text-[var(--n-primary,#E64545)] font-semibold py-1 hover:underline"
        >
          もっと見る →
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--n-divider,rgba(0,0,0,0.08))] px-4 sm:px-6 py-6 text-center">
        <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-3">GUILD AI</p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-[var(--n-muted,#6B6456)]">
          <Link href="/bank" className="hover:text-[var(--n-primary,#E64545)] transition-colors">のこす</Link>
          <Link href="/jobs" className="hover:text-[var(--n-primary,#E64545)] transition-colors">かせぐ</Link>
          <Link href="/guild" className="hover:text-[var(--n-primary,#E64545)] transition-colors">運用</Link>
          <Link href="/wallet" className="hover:text-[var(--n-primary,#E64545)] transition-colors">おさいふ</Link>
          <button
            type="button"
            onClick={openModal}
            className="hover:text-[var(--n-primary,#E64545)] transition-colors"
          >
            初めての方へ
          </button>
        </div>
      </footer>

      <div className="pb-20" />

      {/* ── Onboarding Modal ──────────────────────────────────── */}
      {modalOpen && <OnboardingModal onClose={closeModal} />}
    </main>
  );
}
