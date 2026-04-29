"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shimaenaga } from "@/components/Shimaenaga";
import { Confetti } from "@/components/Confetti";
import { RankBadge } from "@/components/RankBadge";
import { RatingPlate } from "@/components/RatingPlate";
import { GoldenSeal } from "@/components/GoldenSeal";
import { TickerStrip } from "@/components/charts/TickerStrip";
import { StreamFeed } from "@/components/charts/StreamFeed";
import { audit } from "@/lib/ai-auditor";
import { mintWeapon, extractTags, deriveTitle } from "@/lib/weapons";
import { playPassbookChime, playSuccessChime, playStampChime } from "@/lib/sound";
import { useTactile } from "@/hooks/useTactile";
import { getTickerSnapshot, getStreamFeed } from "@/lib/terminal-data";
import { offerInstantBuyout, computeAssessmentRange, formatJpy } from "@/lib/instant-buyout";
import type { AuditResult } from "@/types";
import type { InstantBuyoutOffer } from "@/lib/instant-buyout";

type Step = "input" | "scoring" | "result" | "minting" | "done";

// ─── Kawaii helpers ──────────────────────────────────────────────────────────

const FRIENDLY_RANK_LABELS = {
  S: { title: "すごい！ 金バッジ！", desc: "あなたのちえは「でんせつのぶき」になります。", color: "text-[#7A5000]" },
  A: { title: "いいかんじ！ 銀バッジ！", desc: "「せいえいのぶき」としてぶきこに入ります。", color: "text-[#3A3A3A]" },
  B: { title: "できたよ！ 銅バッジ！", desc: "つづけることでランクがあがります！", color: "text-[#5A2D00]" },
};

function GoldStamp({ rank, stamped }: { rank: "S" | "A" | "B"; stamped: boolean }) {
  const colors = {
    S: { bg: "#D4A437", text: "#7A5000", ring: "#F2DFA0" },
    A: { bg: "#ABABAB", text: "#3A3A3A", ring: "#E8E8E8" },
    B: { bg: "#B87333", text: "#5A2D00", ring: "#F0C890" },
  }[rank];

  return (
    <div className={`mx-auto ${stamped ? "stamp-pon" : "opacity-0"}`} style={{ width: 80, height: 80 }} aria-hidden>
      <svg width="80" height="80" viewBox="0 0 80 80">
        {Array.from({ length: 18 }, (_, i) => {
          const angle = (i / 18) * Math.PI * 2 - Math.PI / 2;
          const [x1, y1] = [40 + Math.cos(angle) * 36, 40 + Math.sin(angle) * 36];
          const [x2, y2] = [40 + Math.cos(angle) * 38, 40 + Math.sin(angle) * 38];
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.ring} strokeWidth="3" strokeLinecap="round" />;
        })}
        <circle cx="40" cy="40" r="32" fill={colors.bg} stroke={colors.ring} strokeWidth="2" />
        <text x="40" y="44" textAnchor="middle" fontSize="22" fontWeight="900" fill={colors.text}>{rank}</text>
        <text x="40" y="56" textAnchor="middle" fontSize="6" fontWeight="700" fill={colors.text} opacity="0.7">CERTIFIED</text>
      </svg>
    </div>
  );
}

// ─── Terminal: audit queue item ──────────────────────────────────────────────

interface QueueItem {
  id: string;
  label: string;
  rank: "S" | "A" | "B";
  score: number;
  ts: string;
}

const MOCK_QUEUE: QueueItem[] = [
  { id: "Q-001", label: "TypeScript設計パターン集", rank: "S", score: 91.2, ts: "06:18" },
  { id: "Q-002", label: "Rustメモリ安全設計",        rank: "S", score: 88.7, ts: "06:15" },
  { id: "Q-003", label: "Next.js App Router設計",    rank: "A", score: 84.1, ts: "06:12" },
  { id: "Q-004", label: "DBスキーマ最適化",           rank: "A", score: 79.8, ts: "06:09" },
  { id: "Q-005", label: "MLパイプライン自動化",       rank: "A", score: 76.3, ts: "06:05" },
];

// ─── Terminal: gold flash effect ─────────────────────────────────────────────

function GoldFlash({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--t-gold,#D4AF37)] gold-flash-bar pointer-events-none"
      aria-hidden
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BankPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [noteContent, setNoteContent] = useState("");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [weaponTitle, setWeaponTitle] = useState("");
  const [stamped, setStamped] = useState(false);
  const [theme, setTheme] = useState<string>("nameraka");
  const [flash, setFlash] = useState(false);
  const [buyoutOffer, setBuyoutOffer] = useState<InstantBuyoutOffer | null>(null);
  const [buyoutAccepted, setBuyoutAccepted] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") ?? "nameraka";
    setTheme(t);
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") ?? "terminal");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const isPro = theme === "pro";
  const isNameraka = theme === "nameraka";
  const isTerminal = isPro; // legacy compat for handlers below

  const triggerStamp = useTactile("stamp");
  const triggerPoyon = useTactile("poyon");

  const handleScore = useCallback(() => {
    if (!noteContent.trim()) return;
    setStep("scoring");
    if (isNameraka) setScanning(true);

    setTimeout(() => {
      const wordCount = noteContent.replace(/\s/g, "").length;
      const lines = noteContent.split("\n").length;
      const thoughtDensity = Math.min(100, Math.round((wordCount / 5) + (lines * 2)));
      const iterations = Math.max(1, Math.floor(wordCount / 30));
      const hasIntent = noteContent.length > 50;

      const result = audit({
        ccaf: {
          intentSignals: hasIntent ? ["author-statement"] : [],
          thoughtDensity,
          iterations,
          authorId: "demo-user",
          createdAt: new Date().toISOString(),
        },
        vercelUptimeDays: 30,
      });

      setAuditResult(result);
      setWeaponTitle(deriveTitle(noteContent));
      setBuyoutOffer(offerInstantBuyout(result));

      if (isNameraka) {
        // Nameraka: gold scan line then reveal
        setScanning(false);
        setFlash(true);
        setTimeout(() => { setFlash(false); setStep("result"); }, 300);
      } else if (isTerminal) {
        // Pro: snap transition with gold flash
        setFlash(true);
        setTimeout(() => { setFlash(false); setStep("result"); }, 120);
      } else {
        // Kawaii: stamp drop
        setTimeout(() => {
          setStamped(true);
          triggerStamp();
          setTimeout(() => setStep("result"), 800);
        }, 600);
      }
    }, isNameraka ? 600 : isTerminal ? 800 : 1400);
  }, [noteContent, triggerStamp, isTerminal, isNameraka]);

  const handleMint = useCallback(() => {
    if (!auditResult) return;
    setStep("minting");
    triggerPoyon();

    setTimeout(() => {
      mintWeapon({
        title: weaponTitle,
        noteContent,
        rank: auditResult.rank,
        score: auditResult.score,
        tags: extractTags(noteContent),
      });

      if (!isTerminal) {
        playPassbookChime();
        setConfetti(true);
        setTimeout(() => setConfetti(false), 2000);
      }
      setFlash(true);
      setTimeout(() => { setFlash(false); setStep("done"); }, 120);
    }, isTerminal ? 300 : 1500);
  }, [auditResult, noteContent, weaponTitle, triggerPoyon, isTerminal]);

  const handleReset = useCallback(() => {
    setStep("input");
    setNoteContent("");
    setAuditResult(null);
    setWeaponTitle("");
    setStamped(false);
  }, []);

  const ticker = getTickerSnapshot();
  const stream = getStreamFeed(8);

  // ─── Nameraka layout (メルカリ style) ──────────────────────────────────────

  if (isNameraka) {
    const assessRange = noteContent.length > 0
      ? computeAssessmentRange(Math.min(100, Math.max(20, noteContent.replace(/\s/g, "").length / 2)))
      : null;

    return (
      <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--n-text,#F1F4F9)]">のこす</h1>
          <p className="text-sm text-[var(--n-muted,#9FB1C8)] mt-1">
            あなたのノートを提出すると、AIが査定して価値にします。
          </p>
        </div>

        {step === "input" && (
          <div className="space-y-4">
            {/* Drop area / text area */}
            <div className="bg-[var(--n-surface,#0E2240)] border-2 border-dashed border-[var(--n-divider,#1F3A66)] rounded-3xl p-6 hover:border-[var(--n-gold,#D4AF37)]/50 transition-colors">
              <p className="text-xs text-[var(--n-muted,#9FB1C8)] mb-2 text-center">
                ノートをここに貼り付け、または入力してください
              </p>
              <textarea
                className="w-full h-52 bg-transparent resize-none text-sm text-[var(--n-text,#F1F4F9)] placeholder-[var(--n-muted,#9FB1C8)] focus:outline-none"
                placeholder={"# 設計ノート\n\nあなたのこだわり・設計判断・試行錯誤を書いてください..."}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                aria-label="ノート提出フォーム"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-[var(--n-muted,#9FB1C8)]">
                <span>{noteContent.length} 文字</span>
                {noteContent.length > 50 && (
                  <span className="text-[var(--n-gold,#D4AF37)] font-semibold">● 意志シグナル検出 → Sランク候補</span>
                )}
              </div>
            </div>

            {/* Assessment range preview */}
            {assessRange && (
              <div className="bg-[var(--n-surface-2,#122A4D)] rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[var(--n-muted,#9FB1C8)]">査定額レンジ（目安）</span>
                <span className="font-bold tabular-nums text-[var(--n-gold,#D4AF37)] text-sm">
                  {formatJpy(assessRange[0])} 〜 {formatJpy(assessRange[1])}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleScore}
              disabled={noteContent.trim().length < 10}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#1F3A66] via-[#2A5298] to-[var(--n-gold,#D4AF37)] text-white font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all duration-220 shadow-lg"
              aria-label="ノートを提出して鑑定する"
            >
              提出する →
            </button>
          </div>
        )}

        {step === "scoring" && (
          <div className="bg-[var(--n-surface,#0E2240)] rounded-3xl p-8 text-center relative overflow-hidden">
            {/* Gold scan line */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--n-gold,#D4AF37)] to-transparent animate-[scanLine_0.6s_ease-in-out_forwards]" aria-hidden />
            <p className="text-[var(--n-gold,#D4AF37)] font-bold text-lg">鑑定中…</p>
            <p className="text-xs text-[var(--n-muted,#9FB1C8)] mt-2">AIが思考密度を解析しています</p>
          </div>
        )}

        {step === "result" && auditResult && (
          <div className="space-y-4">
            {/* Result card */}
            <div className="bg-[var(--n-surface,#0E2240)] border border-[var(--n-gold,#D4AF37)]/40 rounded-3xl p-6 text-center relative">
              <div className="absolute top-4 right-4">
                <GoldenSeal size={32} />
              </div>
              <div className="flex justify-center mb-4"><RatingPlate rank={auditResult.rank} size="lg" /></div>
              <p className="text-[var(--n-text,#F1F4F9)] font-bold text-xl">
                {auditResult.rank === "S" ? "殿堂入り！" : auditResult.rank === "A" ? "優秀な知恵です" : "良質なノートです"}
              </p>
              <p className="text-xs text-[var(--n-muted,#9FB1C8)] mt-1 tabular-nums">
                スコア {auditResult.score.toFixed(1)} / 100
              </p>

              {/* Assessment range */}
              <div className="mt-4 bg-[var(--n-surface-2,#122A4D)] rounded-2xl px-4 py-3">
                <p className="text-xs text-[var(--n-muted,#9FB1C8)] mb-1">査定額レンジ</p>
                <p className="font-bold tabular-nums text-[var(--n-gold,#D4AF37)] text-lg">
                  {formatJpy(computeAssessmentRange(auditResult.score)[0])} 〜 {formatJpy(computeAssessmentRange(auditResult.score)[1])}
                </p>
              </div>

              {/* 0秒換金オファー (S/A only) */}
              {buyoutOffer && !buyoutAccepted && (
                <div className="mt-4 border border-[var(--n-gold,#D4AF37)] rounded-2xl px-4 py-3 bg-[var(--n-gold,#D4AF37)]/10">
                  <p className="text-xs text-[var(--n-gold,#D4AF37)] font-bold mb-1">
                    ⚡ いまだけ 0秒換金オファー（{buyoutOffer.expiresInSec}秒以内）
                  </p>
                  <p className="font-black text-[var(--n-text,#F1F4F9)] text-xl tabular-nums mb-2">
                    {formatJpy(buyoutOffer.amountJpy)} で即時買い取り
                  </p>
                  <button
                    type="button"
                    onClick={() => { setBuyoutAccepted(true); handleMint(); }}
                    className="w-full py-2.5 rounded-xl bg-[var(--n-gold,#D4AF37)] text-[#0A192F] font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    受諾して即時換金 →
                  </button>
                </div>
              )}
              {buyoutAccepted && (
                <p className="mt-3 text-[#4DD08F] font-bold text-sm">✓ 換金オファー受諾 — 通帳に着金しました</p>
              )}
            </div>

            {/* Title edit */}
            <div className="bg-[var(--n-surface,#0E2240)] border border-[var(--n-divider,#1F3A66)] rounded-2xl px-4 py-3">
              <p className="text-xs text-[var(--n-muted,#9FB1C8)] mb-1">タイトル（編集できます）</p>
              <input
                type="text"
                className="w-full bg-transparent text-sm font-bold text-[var(--n-text,#F1F4F9)] focus:outline-none border-b border-[var(--n-divider,#1F3A66)] pb-1"
                value={weaponTitle}
                onChange={(e) => setWeaponTitle(e.target.value)}
                aria-label="ノートのタイトル"
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleReset} className="flex-1 py-3 rounded-full border border-[var(--n-divider,#1F3A66)] text-[var(--n-muted,#9FB1C8)] hover:border-[var(--n-gold,#D4AF37)] transition-colors">
                やり直す
              </button>
              <button type="button" onClick={handleMint} className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#1F3A66] to-[var(--n-gold,#D4AF37)] text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all">
                のこす →
              </button>
            </div>
          </div>
        )}

        {(step === "minting" || step === "done") && auditResult && (
          <div className="bg-[var(--n-surface,#0E2240)] border border-[#4DD08F]/40 rounded-3xl p-8 text-center">
            <div className="flex justify-center mb-4"><RatingPlate rank={auditResult.rank} size="lg" /></div>
            <h2 className="text-xl font-bold text-[var(--n-text,#F1F4F9)] mb-2">
              {step === "minting" ? "登録中…" : "のこせました！"}
            </h2>
            <p className="text-sm text-[var(--n-muted,#9FB1C8)] mb-6">
              「{weaponTitle}」が資産として登録されました。
            </p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={handleReset} className="px-5 py-2.5 rounded-full border border-[var(--n-divider,#1F3A66)] text-[var(--n-muted,#9FB1C8)] hover:border-[var(--n-gold,#D4AF37)] transition-colors">
                もう一つのこす
              </button>
              <button type="button" onClick={() => router.push("/jobs")} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#1F3A66] to-[var(--n-gold,#D4AF37)] text-white font-bold hover:opacity-90">
                かせぐ →
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ─── Pro layout ────────────────────────────────────────────────────────────

  if (isPro) {
    return (
      <main className="flex flex-col h-full min-h-0 bg-[var(--obsidian,#0B0D10)] text-[var(--text-primary,#E8EBF0)]">
        {/* Ticker strip */}
        <TickerStrip items={ticker} />

        <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-0 min-h-0 overflow-hidden">
          {/* Main: MD submission */}
          <div className="flex flex-col min-h-0 overflow-y-auto p-5 border-r border-[var(--divider,#2A2F38)]">
            <div className="mb-4">
              <h1 className="text-sm font-mono font-bold text-[var(--t-gold,#D4AF37)] uppercase tracking-widest">
                資産運用ターミナル
              </h1>
              <p className="text-xs font-mono text-[var(--text-muted,#98A1B0)] mt-0.5">
                ノート提出 → AI評価 → 資産格付け
              </p>
            </div>

            {step === "input" && (
              <div className="relative flex flex-col gap-3 flex-1">
                <div className="border border-[var(--divider,#2A2F38)] rounded-[var(--radius-md,4px)] p-3 bg-[var(--obsidian-2,#11141A)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] uppercase tracking-widest">
                      ノート入力 — MD / Plain Text
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] tabular-nums">
                      {noteContent.length} chars
                    </span>
                  </div>
                  <textarea
                    className="w-full h-44 bg-transparent resize-none font-mono text-xs text-[var(--text-primary,#E8EBF0)] placeholder-[var(--text-muted,#98A1B0)] focus:outline-none border-none"
                    placeholder={"# 設計ノート\n\n思考プロセス・設計判断・試行回数を記述...\n\n#AI #設計 #CCAF"}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    aria-label="ノート提出フォーム"
                  />
                </div>

                {noteContent.length > 50 && (
                  <div className="text-[10px] font-mono text-[var(--t-gold,#D4AF37)] flex items-center gap-1.5">
                    <span>●</span> Will Signal 検出 — Sランク昇格候補
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleScore}
                  disabled={noteContent.trim().length < 10}
                  className="w-full py-2 text-xs font-mono font-bold bg-[var(--t-gold,#D4AF37)] text-[#0B0D10] rounded-[var(--radius-md,4px)] disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-100 hover:opacity-90 active:scale-[0.98] uppercase tracking-widest"
                  aria-label="AI評価を実行"
                >
                  SUBMIT FOR EVALUATION →
                </button>

                {/* How it works */}
                <div className="mt-2 border border-[var(--divider,#2A2F38)] rounded-[var(--radius-md,4px)] p-3">
                  <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] uppercase tracking-widest mb-2">評価プロセス</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { step: "01", label: "CCAF解析", desc: "思考密度・試行回数・意思シグナル計測" },
                      { step: "02", label: "格付け判定", desc: "S ≥80 / A ≥60 / B それ以下" },
                      { step: "03", label: "資産登録", desc: "Yield推定・APR算出・市場公開" },
                    ].map((item) => (
                      <div key={item.step} className="text-[10px] font-mono">
                        <span className="text-[var(--t-gold,#D4AF37)] font-bold">{item.step} {item.label}</span>
                        <p className="text-[var(--text-muted,#98A1B0)] mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <GoldFlash active={flash} />
              </div>
            )}

            {step === "scoring" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <div className="border border-[var(--t-gold,#D4AF37)] rounded-[var(--radius-md,4px)] px-6 py-4 bg-[var(--obsidian-2,#11141A)]">
                  <p className="text-xs font-mono text-[var(--t-gold,#D4AF37)] uppercase tracking-widest animate-pulse">
                    EVALUATING...
                  </p>
                  <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] mt-1">
                    CCAF思考密度解析中 — Will Signal検出
                  </p>
                </div>
              </div>
            )}

            {step === "result" && auditResult && (
              <div className="relative flex flex-col gap-3 flex-1">
                <GoldFlash active={flash} />
                <div className="border border-[var(--t-gold,#D4AF37)] rounded-[var(--radius-md,4px)] p-4 bg-[var(--obsidian-2,#11141A)]">
                  <div className="flex items-center gap-4">
                    <RatingPlate rank={auditResult.rank} size="md" />
                    <div className="flex-1">
                      <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] uppercase tracking-widest">
                        評価完了 — {new Date().toISOString().slice(11, 19)} UTC
                      </p>
                      <p className="font-mono font-bold text-[var(--t-gold,#D4AF37)] text-lg">
                        {auditResult.rank}-RANK CONFIRMED
                      </p>
                      <p className="text-xs font-mono text-[var(--text-muted,#98A1B0)] tabular-nums mt-1">
                        CCAF Score: <span className="text-[var(--text-primary,#E8EBF0)]">{auditResult.score.toFixed(1)}</span>
                        &nbsp;|&nbsp;
                        Yield Est: <span className="text-positive">{auditResult.rank === "S" ? "18.4" : auditResult.rank === "A" ? "12.3" : "7.2"}%</span>
                      </p>
                    </div>
                    <GoldenSeal size={32} />
                  </div>

                  <div className="mt-3">
                    <div className="h-1 w-full bg-[var(--slate-3,#2E3540)] rounded-[var(--radius-sm,2px)] overflow-hidden">
                      <div
                        className="h-1 bg-[var(--t-gold,#D4AF37)] transition-all duration-100"
                        style={{ width: `${auditResult.score}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-[var(--divider,#2A2F38)] rounded-[var(--radius-md,4px)] p-3 bg-[var(--obsidian-2,#11141A)]">
                  <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] mb-1 uppercase tracking-widest">
                    Recipe タイトル（編集可）
                  </p>
                  <input
                    type="text"
                    className="w-full bg-transparent font-mono text-sm text-[var(--text-primary,#E8EBF0)] focus:outline-none border-b border-[var(--divider,#2A2F38)] pb-1"
                    value={weaponTitle}
                    onChange={(e) => setWeaponTitle(e.target.value)}
                    aria-label="Recipe タイトル"
                  />
                  <p className="mt-1 text-[10px] font-mono text-[var(--text-muted,#98A1B0)]">
                    Tags: {extractTags(noteContent).join(", ") || "—"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-2 text-[10px] font-mono border border-[var(--divider,#2A2F38)] text-[var(--text-muted,#98A1B0)] rounded-[var(--radius-md,4px)] hover:border-[var(--t-gold,#D4AF37)] transition-colors duration-100 uppercase tracking-widest"
                  >
                    RE-SUBMIT
                  </button>
                  <button
                    type="button"
                    onClick={handleMint}
                    className="flex-1 py-2 text-[10px] font-mono font-bold bg-[var(--t-gold,#D4AF37)] text-[#0B0D10] rounded-[var(--radius-md,4px)] hover:opacity-90 transition-opacity duration-100 uppercase tracking-widest"
                    aria-label="資産として登録"
                  >
                    REGISTER ASSET →
                  </button>
                </div>
              </div>
            )}

            {step === "minting" && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs font-mono text-[var(--t-gold,#D4AF37)] animate-pulse uppercase tracking-widest">
                  MINTING ASSET...
                </p>
              </div>
            )}

            {step === "done" && auditResult && (
              <div className="relative flex flex-col gap-3 flex-1">
                <GoldFlash active={flash} />
                <div className="border border-positive rounded-[var(--radius-md,4px)] p-4 bg-[var(--obsidian-2,#11141A)]">
                  <p className="text-[10px] font-mono text-positive uppercase tracking-widest">
                    ● ASSET REGISTERED
                  </p>
                  <p className="font-mono font-bold text-[var(--text-primary,#E8EBF0)] text-sm mt-1">
                    {weaponTitle}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] tabular-nums mt-1">
                    Rank: <span className="text-[var(--t-gold,#D4AF37)]">{auditResult.rank}</span>
                    &nbsp;|&nbsp;Score: {auditResult.score.toFixed(1)}
                    &nbsp;|&nbsp;Registered: {new Date().toISOString().slice(0, 16).replace("T", " ")} UTC
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleReset} className="flex-1 py-2 text-[10px] font-mono border border-[var(--divider,#2A2F38)] text-[var(--text-muted,#98A1B0)] rounded-[var(--radius-md,4px)] hover:border-[var(--t-gold,#D4AF37)] transition-colors duration-100 uppercase tracking-widest">
                    SUBMIT NEXT
                  </button>
                  <button type="button" onClick={() => router.push("/jobs")} className="flex-1 py-2 text-[10px] font-mono font-bold bg-[var(--t-gold,#D4AF37)] text-[#0B0D10] rounded-[var(--radius-md,4px)] hover:opacity-90 transition-opacity duration-100 uppercase tracking-widest">
                    VIEW ENGAGEMENTS →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right pane: eval queue + stream */}
          <div className="hidden lg:flex flex-col gap-0 min-h-0 overflow-hidden">
            {/* Eval queue */}
            <div className="border-b border-[var(--divider,#2A2F38)] p-3">
              <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] uppercase tracking-widest mb-2">
                評価キュー (Rolling Top 10)
              </p>
              <div className="space-y-0">
                {MOCK_QUEUE.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-[var(--divider,#2A2F38)] last:border-0">
                    <span className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] tabular-nums w-8">{item.ts}</span>
                    <RatingPlate rank={item.rank} size="sm" />
                    <span className="flex-1 text-[10px] font-mono text-[var(--text-primary,#E8EBF0)] truncate">{item.label}</span>
                    <span className="text-[10px] font-mono text-[var(--t-gold,#D4AF37)] tabular-nums shrink-0">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stream feed */}
            <div className="flex-1 overflow-hidden">
              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] uppercase tracking-widest">
                  取引ストリーム
                </p>
              </div>
              <StreamFeed entries={stream} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── Kawaii layout (preserved) ─────────────────────────────────────────────

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
      <Confetti active={confetti} duration={2000} />

      <div className="flex items-center gap-3 mb-6 shimaenaga-mascot">
        <Shimaenaga variant="trust" size="md" mode="seal" />
        <div>
          <h1 className="text-2xl font-bold text-ink">シマエナガ銀行</h1>
          <p className="text-sm text-ink-muted">キミの知恵（ちえ）をのこす</p>
        </div>
      </div>

      {step === "input" && (
        <div className="section-card p-6 border border-gold-soft">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-1">ステップ 1／3 — ちえをかく</p>
          <h2 className="text-lg font-bold text-ink mb-3">キミのこだわりをはりつけてみよう</h2>
          <p className="text-sm text-ink-muted mb-4 leading-relaxed">
            じぶんのやりかた・せっけいのくふう・やってみたきろく。<br />
            50もじいじょうかくと「いしシグナル」がついてSランクを目指せます。
          </p>
          <textarea
            className="input-base w-full h-48 resize-none font-mono text-sm rounded-2xl"
            placeholder={"# わたしのこだわり\n\n例: AIエージェントをつくるとき、まず...\n\n#AI #設計"}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            aria-label="ちえのノート"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-ink-muted">{noteContent.length} もじ</span>
            {noteContent.length > 50 && <span className="text-xs text-gold font-semibold">✓ いしシグナルついた！</span>}
          </div>
          <button
            type="button"
            onClick={handleScore}
            disabled={noteContent.trim().length < 10}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-gold to-timee-yellow text-[#7A5000] font-bold py-3 text-base shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            ✨ しらべてもらう →
          </button>
        </div>
      )}

      {step === "scoring" && (
        <div className="section-card p-6 text-center border border-gold-soft">
          <Shimaenaga variant="trust" size="lg" mode="watch" className="mx-auto shimaenaga-mascot" />
          <p className="mt-4 text-lg font-bold text-ink">スキャンちゅう...</p>
          <p className="text-sm text-ink-muted mt-1">シマエナガがじーっと ちえをよんでいます</p>
          <div className="mt-6"><GoldStamp rank="S" stamped={stamped} /></div>
        </div>
      )}

      {step === "result" && auditResult && (
        <div className="space-y-4">
          <div className="section-card p-6 border-2 border-gold-soft">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">ステップ 2／3 — けっか！</p>
            <div className="flex items-center gap-4 mt-2">
              <GoldStamp rank={auditResult.rank} stamped />
              <div className="flex-1">
                <p className={`text-xl font-black ${FRIENDLY_RANK_LABELS[auditResult.rank].color}`}>
                  {FRIENDLY_RANK_LABELS[auditResult.rank].title}
                </p>
                <RankBadge rank={auditResult.rank} large friendly />
                <p className="mt-2 text-sm text-ink-muted">{FRIENDLY_RANK_LABELS[auditResult.rank].desc}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-ink-muted">スコア</span>
                <span className="font-bold text-ink tabular-nums">{auditResult.score.toFixed(1)} / 100</span>
              </div>
              <div className="mt-1 h-3 w-full rounded-full bg-ink/10 overflow-hidden">
                <div className="h-3 rounded-full bg-gradient-to-r from-gold to-timee-yellow transition-all duration-1000" style={{ width: `${auditResult.score}%` }} />
              </div>
            </div>
          </div>
          <div className="section-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-2">ぶきのなまえ（へんこうOK）</p>
            <input type="text" className="input-base w-full text-base font-semibold rounded-2xl" value={weaponTitle} onChange={(e) => setWeaponTitle(e.target.value)} aria-label="ぶきのなまえ" />
            <p className="mt-1 text-xs text-ink-muted">タグ: {extractTags(noteContent).join(", ") || "（なし）"}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleReset} className="btn-secondary flex-1 rounded-2xl">かきなおす</button>
            <button type="button" onClick={handleMint} className="flex-1 rounded-2xl bg-gradient-to-r from-gold to-timee-yellow text-[#7A5000] font-bold py-2.5 text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all">
              ⚔️ ぶきにしてのこす →
            </button>
          </div>
        </div>
      )}

      {step === "minting" && (
        <div className="section-card p-6 text-center border border-gold-soft">
          <Shimaenaga variant="coin" size="lg" mode="guardian" className="mx-auto shimaenaga-mascot" />
          <p className="mt-4 text-lg font-bold text-gold animate-pulse">ぶきにしています…</p>
          <div className="flex justify-center gap-1 mt-3">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {step === "done" && auditResult && (
        <div className="section-card p-6 text-center border-2 border-gold-soft">
          <Shimaenaga variant="wave" size="lg" mode="guardian" className="mx-auto shimaenaga-mascot" />
          <h2 className="mt-4 text-2xl font-black text-ink">🎉 できた！</h2>
          <p className="mt-2 text-sm text-ink-muted">
            「{weaponTitle}」が <span className="font-bold text-gold">{auditResult.rank}ランクのぶき</span> になりました！
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button type="button" onClick={handleReset} className="btn-secondary rounded-2xl">もうひとつのこす</button>
            <button type="button" onClick={() => { playSuccessChime(); router.push("/jobs"); }} className="rounded-2xl bg-gradient-to-r from-gold to-timee-yellow text-[#7A5000] font-bold px-5 py-2.5 text-sm shadow-md hover:opacity-90 active:scale-[0.98]">
              クエストへいく →
            </button>
          </div>
        </div>
      )}

      {step === "input" && (
        <div className="mt-6 section-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">しくみ</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: "📝", label: "ノートをおく", desc: "こだわり・くふう・きろくをかく" },
              { icon: "🔬", label: "AIがしらべる", desc: "おもさ・いしシグナルから金/銀/銅バッジ" },
              { icon: "⚔️", label: "ぶきになる", desc: "クエストボードでつかってかせぐ" },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="text-center">
                <span className="text-2xl">{icon}</span>
                <p className="mt-1 text-sm font-bold text-ink">{label}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
