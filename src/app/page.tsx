"use client";

import Link from "next/link";
import { MOCK_JOBS } from "@/lib/jobs";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_NOTES = [
  { id: "n1", title: "TypeScript設計パターン集", priceMin: 8000, priceMax: 32000, rank: "S" },
  { id: "n2", title: "Rustメモリ安全設計ノート", priceMin: 6000, priceMax: 24000, rank: "S" },
  { id: "n3", title: "LLM Prompt Engineering集", priceMin: 3000, priceMax: 12000, rank: "A" },
] as const;

const HOW_TILES = [
  { emoji: "📝", label: "のこす",    sub: "30秒",       href: "/sell" },
  { emoji: "🤖", label: "AIが働く", sub: "24時間 自動", href: "/jobs" },
  { emoji: "💴", label: "¥が入る",  sub: "チャリン",    href: "/guild" },
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
  return (
    <main className="max-w-2xl mx-auto space-y-8">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pt-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1F1B16] leading-[1.1] tracking-tight mb-4 sm:mb-5">
          AIエージェントで、<br className="sm:hidden" />
          <span className="text-[var(--n-primary,#E64545)]">あなたの時間</span>を<br />
          アップデート。
        </h1>
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <p className="text-base sm:text-lg text-gray-600 font-medium">
            日本最大のAIエージェント・プラットフォーム
          </p>
          <span className="inline-flex items-center border border-gray-300 rounded-full px-3 py-1 text-xs text-gray-600 font-medium whitespace-nowrap">
            いますぐ ¥30,000 から
          </span>
        </div>
        <Link
          href="/bank"
          className="h-14 px-8 min-w-[200px] rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold text-base hover:bg-[#D03A3A] active:scale-[0.98] transition-all duration-220 shadow-sm inline-flex items-center justify-center"
        >
          いま のこす
        </Link>
        <p className="mt-3 text-sm text-gray-500">ノートを残すだけ</p>
      </section>

      {/* ── つかいかた はかんたん（統合ブロック）─────────────── */}
      <section className="px-4 sm:px-6" aria-label="つかいかた はかんたん">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          つかいかた はかんたん
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
          <Link href="/guild" className="hover:text-[var(--n-primary,#E64545)] transition-colors">マイ銀行</Link>
          <Link href="/wallet" className="hover:text-[var(--n-primary,#E64545)] transition-colors">おさいふ</Link>
        </div>
      </footer>

      <div className="pb-20" />
    </main>
  );
}
