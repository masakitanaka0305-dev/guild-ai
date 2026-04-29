"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RankBadge } from "@/components/RankBadge";
import { audit } from "@/lib/ai-auditor";
import { mintWeapon, extractTags, deriveTitle } from "@/lib/weapons";
import { useTactile } from "@/hooks/useTactile";
import { offerInstantBuyout, computeAssessmentRange, formatJpy } from "@/lib/instant-buyout";
import type { AuditResult } from "@/types";
import type { InstantBuyoutOffer } from "@/lib/instant-buyout";

type Step = "input" | "scoring" | "result" | "minting" | "done";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BankPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [noteContent, setNoteContent] = useState("");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [weaponTitle, setWeaponTitle] = useState("");
  const [buyoutOffer, setBuyoutOffer] = useState<InstantBuyoutOffer | null>(null);
  const [buyoutAccepted, setBuyoutAccepted] = useState(false);

  const triggerPoyon = useTactile("poyon");

  const assessRange = noteContent.length > 0
    ? computeAssessmentRange(Math.min(100, Math.max(20, noteContent.replace(/\s/g, "").length / 2)))
    : null;

  const handleScore = useCallback(() => {
    if (!noteContent.trim()) return;
    setStep("scoring");

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

      setStep("result");
    }, 400);
  }, [noteContent]);

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

      setStep("done");
    }, 1500);
  }, [auditResult, noteContent, weaponTitle, triggerPoyon]);

  const handleReset = useCallback(() => {
    setStep("input");
    setNoteContent("");
    setAuditResult(null);
    setWeaponTitle("");
  }, []);

  // ─── Nameraka layout (メルカリ style) ──────────────────────────────────────

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)]">何を のこしますか？</h1>
        <p className="text-sm text-[var(--n-muted,#6B6456)] mt-1">
          ノートを貼り付けると、AIが価値を査定します。
        </p>
      </div>

      {step === "input" && (
        <div className="space-y-4">
          {/* Drop area / text area */}
          <div className="bg-[var(--n-surface,#FFFFFF)] border-2 border-dashed border-[var(--n-divider,rgba(0,0,0,0.12))] rounded-3xl p-6 hover:border-[var(--n-primary,#E64545)]/40 transition-colors">
            <p className="text-xs text-[var(--n-muted,#6B6456)] mb-2 text-center">
              ノートをここに貼り付け、または入力してください
            </p>
            <textarea
              className="w-full h-52 bg-transparent resize-none text-sm text-[var(--n-text,#1A1714)] placeholder-[var(--n-muted,#6B6456)] focus:outline-none"
              placeholder={"# 設計ノート\n\nあなたのこだわり・設計判断・試行錯誤を書いてください..."}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              aria-label="ノート提出フォーム"
            />
            <div className="flex items-center justify-between mt-2 text-xs text-[var(--n-muted,#6B6456)]">
              <span>{noteContent.length} 文字</span>
              {noteContent.length > 50 && (
                <span className="text-[var(--n-primary,#E64545)] font-semibold">● 意志シグナル検出 → Sランク候補</span>
              )}
            </div>
          </div>

          {/* Assessment range preview */}
          {assessRange && (
            <div className="bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl px-4 py-3">
              <p className="text-sm font-bold text-[var(--n-text,#1A1714)] tabular-nums">
                {formatJpy(assessRange[0])} から {formatJpy(assessRange[1])} で売れそうです
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleScore}
            disabled={noteContent.trim().length < 10}
            className="w-full py-3.5 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all duration-220 shadow-md"
            aria-label="ノートを提出して鑑定する"
          >
            提出する →
          </button>
        </div>
      )}

      {step === "scoring" && (
        <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-3xl p-8 text-center relative overflow-hidden">
          {/* Scan line */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--n-primary,#E64545)] to-transparent animate-[scanLine_0.4s_ease-in-out_forwards]" aria-hidden />
          <p className="text-[var(--n-primary,#E64545)] font-bold text-lg">鑑定中…</p>
          <p className="text-xs text-[var(--n-muted,#6B6456)] mt-2">AIが思考密度を解析しています</p>
        </div>
      )}

      {step === "result" && auditResult && (
        <div className="space-y-4">
          {/* Result card */}
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-gold,#D4AF37)]/30 rounded-3xl p-6 text-center relative">
            <div className="flex justify-center mb-4">
              <RankBadge rank={auditResult.rank} />
            </div>
            <p className="text-[var(--n-text,#1A1714)] font-bold text-xl">
              {auditResult.rank === "S" ? "殿堂入り！" : auditResult.rank === "A" ? "優秀な知恵です" : "良質なノートです"}
            </p>
            <p className="text-xs text-[var(--n-muted,#6B6456)] mt-1 tabular-nums">
              スコア {auditResult.score.toFixed(1)} / 100
            </p>

            {/* Assessment range */}
            <div className="mt-4 bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl px-4 py-3">
              <p className="text-xs text-[var(--n-muted,#6B6456)] mb-1">査定額レンジ</p>
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
                <p className="font-black text-[var(--n-text,#1A1714)] text-xl tabular-nums mb-2">
                  {formatJpy(buyoutOffer.amountJpy)} で即時買い取り
                </p>
                <button
                  type="button"
                  onClick={() => { setBuyoutAccepted(true); handleMint(); }}
                  className="w-full py-2.5 rounded-xl bg-[var(--n-gold,#D4AF37)] text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all"
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
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl px-4 py-3">
            <p className="text-xs text-[var(--n-muted,#6B6456)] mb-1">タイトル（編集できます）</p>
            <input
              type="text"
              className="w-full bg-transparent text-sm font-bold text-[var(--n-text,#1A1714)] focus:outline-none border-b border-[var(--n-divider,rgba(0,0,0,0.08))] pb-1"
              value={weaponTitle}
              onChange={(e) => setWeaponTitle(e.target.value)}
              aria-label="ノートのタイトル"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={handleReset} className="flex-1 py-3 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] hover:border-[var(--n-gold,#D4AF37)] transition-colors">
              やり直す
            </button>
            <button type="button" onClick={handleMint} className="flex-1 py-3 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all">
              のこす →
            </button>
          </div>
        </div>
      )}

      {(step === "minting" || step === "done") && auditResult && (
        <div className="bg-[var(--n-surface,#FFFFFF)] border border-[#4DD08F]/40 rounded-3xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <RankBadge rank={auditResult.rank} />
          </div>
          <h2 className="text-xl font-bold text-[var(--n-text,#1A1714)] mb-2">
            {step === "minting" ? "登録中…" : "のこせました！"}
          </h2>
          <p className="text-sm text-[var(--n-muted,#6B6456)] mb-6">
            「{weaponTitle}」が資産として登録されました。
          </p>
          <div className="flex gap-3 justify-center">
            <button type="button" onClick={handleReset} className="px-5 py-2.5 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] hover:border-[var(--n-gold,#D4AF37)] transition-colors">
              もう一つのこす
            </button>
            <button type="button" onClick={() => router.push("/jobs")} className="px-5 py-2.5 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold hover:opacity-90">
              かせぐ →
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
