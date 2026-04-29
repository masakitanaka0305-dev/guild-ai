"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TrustScore from "@/components/trust-score/TrustScore";
import { MOCK_JOBS } from "@/lib/jobs";
import { getTickerSnapshot } from "@/lib/terminal-data";

// ─── Mock tile data ───────────────────────────────────────────────────────────

const MOCK_NOTES = [
  { id: "n1", title: "TypeScript設計パターン集", summary: "型安全なDDDを実現するための設計判断を体系化", priceMin: 8000, priceMax: 32000, rank: "S", author: "@tk_dev" },
  { id: "n2", title: "Rustメモリ安全設計ノート", summary: "所有権システムを使った高速APIの構築手法", priceMin: 6000, priceMax: 24000, rank: "S", author: "@rust_pro" },
  { id: "n3", title: "LLM Prompt Engineering集", summary: "ChatGPT/Claudeで再現性あるプロンプト設計", priceMin: 3000, priceMax: 12000, rank: "A", author: "@ai_craft" },
  { id: "n4", title: "Next.js App Router設計", summary: "パフォーマンスとDXを両立するフォルダ構成", priceMin: 4000, priceMax: 18000, rank: "A", author: "@next_jp" },
  { id: "n5", title: "DBスキーマ最適化ガイド", summary: "大規模テーブルのインデックス戦略と正規化判断", priceMin: 2500, priceMax: 9000, rank: "A", author: "@db_arch" },
  { id: "n6", title: "MLパイプライン自動化", summary: "特徴量エンジニアリングからデプロイまで一気通貫", priceMin: 5000, priceMax: 20000, rank: "A", author: "@ml_ops" },
] as const;

const RANK_COLORS: Record<string, string> = {
  S: "bg-[#D4AF37]/15 text-[#7A5000] border-[#D4AF37]/40",
  A: "bg-[var(--n-text,#1A1714)]/5 text-[var(--n-text,#1A1714)] border-[var(--n-text,#1A1714)]/15",
  B: "bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)] border-[var(--n-divider,rgba(0,0,0,0.08))]",
};

// ─── Market heat bar ──────────────────────────────────────────────────────────

function MarketHeatBar() {
  const [pulses, setPulses] = useState([3, 7, 2, 5, 4, 6, 1, 8, 3]);

  useEffect(() => {
    const id = setInterval(() => {
      setPulses((prev) => [...prev.slice(1), Math.floor(Math.random() * 9) + 1]);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-end gap-0.5 h-6"
      aria-label="市場の熱量（直近の取引・登記件数）"
      role="img"
    >
      {pulses.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm bg-[var(--n-gold,#D4AF37)] transition-all duration-700"
          style={{ height: `${(h / 9) * 100}%`, opacity: 0.4 + (h / 9) * 0.6 }}
        />
      ))}
    </div>
  );
}

// ─── Note tile ────────────────────────────────────────────────────────────────

function NoteTile({ note }: { note: typeof MOCK_NOTES[number] }) {
  return (
    <Link
      href="/bank"
      className="block bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-4 hover:border-[var(--n-primary,#E64545)]/40 hover:shadow-md transition-all duration-220 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${RANK_COLORS[note.rank]}`}>
          {note.rank}ランク
        </span>
        <span className="text-[10px] text-[var(--n-muted,#6B6456)]">{note.author}</span>
      </div>
      <h3 className="text-sm font-bold text-[var(--n-text,#1A1714)] leading-snug mb-1 group-hover:text-[var(--n-primary,#E64545)] transition-colors">
        {note.title}
      </h3>
      <p className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed line-clamp-2 mb-3">
        {note.summary}
      </p>
      <p className="text-xs font-bold tabular-nums text-[var(--n-gold,#D4AF37)]">
        ¥{note.priceMin.toLocaleString("ja-JP")} 〜 ¥{note.priceMax.toLocaleString("ja-JP")}
      </p>
    </Link>
  );
}

// ─── Job tile ─────────────────────────────────────────────────────────────────

function JobTile({ job }: { job: typeof MOCK_JOBS[number] }) {
  const fit = 45 + (job.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 50);
  return (
    <Link
      href="/jobs"
      className="block bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-4 hover:border-[var(--n-primary,#E64545)]/40 hover:shadow-md transition-all duration-220 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-semibold text-[var(--n-muted,#6B6456)] bg-[var(--n-surface-2,#F5F3EE)] px-2 py-0.5 rounded-full">
          {job.category}
        </span>
        <span className={`text-[10px] font-bold ${fit >= 70 ? "text-[var(--n-positive,#0E9F4F)]" : fit >= 50 ? "text-[var(--n-gold,#D4AF37)]" : "text-[var(--n-muted,#6B6456)]"}`}>
          {fit >= 70 ? "ぴったり" : fit >= 50 ? "もう少し" : "これから"}
        </span>
      </div>
      <h3 className="text-sm font-bold text-[var(--n-text,#1A1714)] leading-snug mb-1 group-hover:text-[var(--n-primary,#E64545)] transition-colors">
        {job.title}
      </h3>
      <p className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed line-clamp-2 mb-3">
        {job.description}
      </p>
      <p className="text-xs font-bold tabular-nums text-[var(--n-positive,#0E9F4F)]">
        報酬 ¥{job.reward.toLocaleString("ja-JP")}
      </p>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [tab, setTab] = useState<"notes" | "jobs">("notes");
  const [isNameraka, setIsNameraka] = useState(true);
  const ticker = getTickerSnapshot();

  useEffect(() => {
    const update = () => {
      const t = document.documentElement.getAttribute("data-theme") ?? "nameraka";
      setIsNameraka(t === "nameraka");
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  if (!isNameraka) {
    // ─── Fallback layout (pro/kawaii keeps original) ──────────
    return (
      <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-10">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-[var(--t-text,#1A1628)] mb-4">
          思想を登記すれば、<br />
          <span className="text-[var(--t-gold,#1A6BB5)]">AIが買いに来る。</span>
        </h1>
        <p className="text-sm text-[#9FB1C8] mb-6">
          あなたのスキルやコードを資産として登録すると、世界中のAIが利用料を払って使ってくれます。
        </p>
        <div className="flex gap-3">
          <Link href="/sell" className="btn-primary">登録する →</Link>
          <Link href="/jobs" className="btn-secondary">案件を見る</Link>
        </div>
      </main>
    );
  }

  // ─── Nameraka layout ──────────────────────────────────────────────────────

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-8 pb-5">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--n-text,#1A1714)] leading-tight">
          知恵を、<span className="text-[var(--n-primary,#E64545)]">寝てる間も</span>働かせる場所。
        </h1>
        <div className="flex gap-3 mt-5 flex-wrap">
          <Link
            href="/bank"
            className="px-7 py-3.5 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            いま のこす
          </Link>
          <Link
            href="/jobs"
            className="px-7 py-3.5 rounded-full border-2 border-[var(--n-primary,#E64545)] text-[var(--n-primary,#E64545)] font-bold text-sm hover:bg-[var(--n-primary,#E64545)]/5 active:scale-[0.98] transition-all"
          >
            いま かせぐ
          </Link>
        </div>
      </section>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl p-1 w-fit">
        {(["notes", "jobs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === t
                ? "bg-[var(--n-primary,#E64545)] text-white"
                : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
            }`}
          >
            {t === "notes" ? "新着の知恵" : "おすすめ案件"}
          </button>
        ))}
      </div>

      {/* ── Tile grid ────────────────────────────────────────── */}
      <section aria-label={tab === "notes" ? "新着の知恵タイル" : "おすすめ案件タイル"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {tab === "notes"
            ? MOCK_NOTES.map((n) => <NoteTile key={n.id} note={n} />)
            : MOCK_JOBS.slice(0, 6).map((j) => <JobTile key={j.id} job={j} />)
          }
        </div>
      </section>

      {/* ── Trust demo (collapsed) ───────────────────────────── */}
      <section className="pb-10">
        <details className="bg-[var(--n-surface,#0E2240)] border border-[var(--n-divider,#1F3A66)] rounded-2xl p-4">
          <summary className="text-sm text-[var(--n-muted,#9FB1C8)] cursor-pointer select-none">
            信用スコアのしくみ →
          </summary>
          <div className="mt-4">
            <TrustScore
              ownerName="Demo"
              input={{ qualityHistory: 78, discordContribution: 64, xAmplification: 52 }}
            />
          </div>
        </details>
      </section>

    </main>
  );
}
