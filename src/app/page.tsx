"use client";

import Link from "next/link";
import { MOCK_JOBS } from "@/lib/jobs";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_NOTES = [
  { id: "n1", title: "TypeScript設計パターン集", summary: "型安全なDDDを実現するための設計判断を体系化", priceMin: 8000, priceMax: 32000, rank: "S" },
  { id: "n2", title: "Rustメモリ安全設計ノート", summary: "所有権システムを使った高速APIの構築手法", priceMin: 6000, priceMax: 24000, rank: "S" },
  { id: "n3", title: "LLM Prompt Engineering集", summary: "ChatGPT/Claudeで再現性あるプロンプト設計", priceMin: 3000, priceMax: 12000, rank: "A" },
  { id: "n4", title: "Next.js App Router設計", summary: "パフォーマンスとDXを両立するフォルダ構成", priceMin: 4000, priceMax: 18000, rank: "A" },
] as const;

const VALUE_PROPS = [
  {
    icon: (
      <svg className="w-8 h-8 text-[var(--n-primary,#E64545)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    title: "すぐ売れる",
    desc: "登録したその日から、AIが自動で値段をつけて販売します。",
  },
  {
    icon: (
      <svg className="w-8 h-8 text-[var(--n-primary,#E64545)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/>
      </svg>
    ),
    title: "むずかしくない",
    desc: "3行書いて提出するだけ。難しい設定は一切不要です。",
  },
  {
    icon: (
      <svg className="w-8 h-8 text-[var(--n-primary,#E64545)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
      </svg>
    ),
    title: "24時間 AIが働く",
    desc: "寝ている間も、AIエージェントがあなたの代わりに稼ぎ続けます。",
  },
] as const;

const RANK_COLORS: Record<string, string> = {
  S: "bg-[#D4AF37]/15 text-[#7A5000] border-[#D4AF37]/40",
  A: "bg-[var(--n-text,#1A1714)]/5 text-[var(--n-text,#1A1714)] border-[var(--n-text,#1A1714)]/15",
};

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-6 rounded-full bg-[var(--n-primary,#E64545)] flex-shrink-0" />
      <div>
        <h2 className="text-lg font-bold text-[var(--n-text,#1A1714)]">{title}</h2>
        {sub && <p className="text-xs text-[var(--n-muted,#6B6456)]">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Note card (horizontal scroll) ───────────────────────────────────────────

function NoteCard({ note }: { note: typeof MOCK_NOTES[number] }) {
  return (
    <Link
      href="/bank"
      className="flex-shrink-0 w-56 bg-[var(--n-surface,#FFFFFF)] border border-black/5 rounded-2xl p-4 shadow-sm hover:border-[var(--n-primary,#E64545)]/40 hover:shadow-md active:scale-[0.99] transition-all duration-220"
    >
      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${RANK_COLORS[note.rank] ?? ""} mb-2`}>
        {note.rank}ランク
      </span>
      <h3 className="text-sm font-bold text-[var(--n-text,#1A1714)] leading-snug mb-1 line-clamp-2">{note.title}</h3>
      <p className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed line-clamp-2 mb-3">{note.summary}</p>
      <p className="text-xs font-bold tabular-nums text-[var(--n-gold,#D4AF37)]">
        ¥{note.priceMin.toLocaleString("ja-JP")} 〜 ¥{note.priceMax.toLocaleString("ja-JP")}
      </p>
    </Link>
  );
}

// ─── Job row (vertical list) ──────────────────────────────────────────────────

function JobRow({ job }: { job: typeof MOCK_JOBS[number] }) {
  const fit = 45 + (job.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 50);
  const fitLbl = fit >= 70 ? "ぴったり" : fit >= 50 ? "もう少し" : "これから";
  const fitCls = fit >= 70 ? "text-[var(--n-positive,#0E9F4F)]" : fit >= 50 ? "text-[var(--n-gold,#D4AF37)]" : "text-[var(--n-muted,#6B6456)]";
  return (
    <Link
      href="/jobs"
      className="flex items-center gap-4 bg-[var(--n-surface,#FFFFFF)] border border-black/5 rounded-2xl p-5 shadow-sm hover:border-[var(--n-primary,#E64545)]/40 active:scale-[0.99] transition-all duration-220"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs">{job.category}</span>
          <span className={`text-xs font-bold ${fitCls}`}>{fitLbl}</span>
        </div>
        <h3 className="text-sm font-bold text-[var(--n-text,#1A1714)] leading-snug truncate">{job.title}</h3>
        <p className="text-xs text-[var(--n-muted,#6B6456)] mt-0.5 leading-relaxed line-clamp-1">{job.description}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-base font-black tabular-nums text-[var(--n-positive,#0E9F4F)]">¥{job.reward.toLocaleString("ja-JP")}</p>
        <p className="text-[10px] text-[var(--n-muted,#6B6456)]">おだちん</p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="max-w-2xl mx-auto">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pt-8 pb-8">
        <h1 className="text-[28px] sm:text-[40px] font-black text-[var(--n-text,#1A1714)] leading-tight tracking-tight">
          AIエージェントで、<br />
          <span className="text-[var(--n-primary,#E64545)]">あなたの時間</span>を<br />
          アップデート。
        </h1>
        <p className="text-base sm:text-[18px] text-[var(--n-muted,#6B6456)] mt-3 leading-relaxed">
          寝てる間も、AIがあなたの知恵で稼ぐ場所です。
        </p>
        <div className="flex gap-3 mt-6 flex-wrap">
          <Link
            href="/bank"
            className="h-12 px-7 min-w-[200px] rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold text-base hover:bg-[#D03A3A] active:scale-[0.98] transition-all duration-220 shadow-sm flex items-center justify-center"
          >
            いま のこす
          </Link>
          <Link
            href="/jobs"
            className="h-12 px-7 rounded-full border border-gray-200 bg-white text-[#1F1B16] font-bold text-base hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all duration-220 flex items-center justify-center"
          >
            いま かせぐ
          </Link>
        </div>
      </section>

      {/* ── 3 Value props ─────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-3 gap-3">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="bg-[var(--n-surface,#FFFFFF)] border border-black/5 rounded-2xl p-4 shadow-sm text-center">
              <div className="flex justify-center mb-3">{v.icon}</div>
              <h3 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-1">{v.title}</h3>
              <p className="text-[11px] text-[var(--n-muted,#6B6456)] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 新着の知恵 (horizontal scroll) ───────────────────── */}
      <section className="pb-8">
        <div className="px-4 sm:px-6">
          <SectionHeading title="新着の知恵" sub="人気ノートをチェック" />
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-2 scrollbar-none snap-x snap-mandatory">
          {MOCK_NOTES.map((n) => (
            <div key={n.id} className="snap-start">
              <NoteCard note={n} />
            </div>
          ))}
        </div>
      </section>

      {/* ── おすすめ の しごと (vertical list) ───────────────── */}
      <section className="px-4 sm:px-6 pb-8 space-y-3">
        <SectionHeading title="おすすめの しごと" sub="あなたの知恵で応募できる案件" />
        {MOCK_JOBS.slice(0, 3).map((j) => (
          <JobRow key={j.id} job={j} />
        ))}
        <Link
          href="/jobs"
          className="block text-center text-sm text-[var(--n-primary,#E64545)] font-semibold py-2 hover:underline"
        >
          もっと見る →
        </Link>
      </section>

      {/* ── Bottom banner ─────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-10">
        <div className="bg-[var(--n-primary,#E64545)] rounded-2xl p-6 text-center">
          <p className="text-white font-bold text-lg mb-1">まだ かせいでない？</p>
          <p className="text-white/80 text-sm mb-4">いま のこしてみよう。3行で出品完了。</p>
          <Link
            href="/bank"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-[var(--n-primary,#E64545)] font-bold text-base hover:bg-gray-50 active:scale-[0.98] transition-all duration-220 shadow-sm"
          >
            のこす →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--n-divider,rgba(0,0,0,0.08))] px-4 sm:px-6 py-8 text-center">
        <p className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-1">GUILD AI</p>
        <p className="text-xs text-[var(--n-muted,#6B6456)] mb-4">
          AIエージェントで、あなたの時間をアップデート。
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-[var(--n-muted,#6B6456)]">
          <Link href="/bank" className="hover:text-[var(--n-primary,#E64545)] transition-colors">のこす</Link>
          <Link href="/jobs" className="hover:text-[var(--n-primary,#E64545)] transition-colors">かせぐ</Link>
          <Link href="/guild" className="hover:text-[var(--n-primary,#E64545)] transition-colors">マイ銀行</Link>
          <Link href="/wallet" className="hover:text-[var(--n-primary,#E64545)] transition-colors">おさいふ</Link>
        </div>
      </footer>

      <div className="h-24" />
    </main>
  );
}
