"use client";

import { useState, useCallback, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { formatEndpointUrl } from "@/lib/note-endpoint";
import { useRouter } from "next/navigation";
import { RankBadge } from "@/components/RankBadge";
import { audit } from "@/lib/ai-auditor";
import { mintWeapon, extractTags, deriveTitle } from "@/lib/weapons";
import { useTactile } from "@/hooks/useTactile";
import { offerInstantBuyout, computeAssessmentRange, formatJpy } from "@/lib/instant-buyout";
import type { AuditResult } from "@/types";
import type { InstantBuyoutOffer } from "@/lib/instant-buyout";
import { useUserId } from "@/components/AuthProvider";

type Step = "input" | "scoring" | "result" | "minting" | "done";
type InputMode = "file" | "text";

const MAX_BYTES = 1_048_576; // 1 MB
const PREVIEW_CHARS = 5_120;  // 5 KB preview
const ALLOWED_EXTS = [".md", ".markdown", ".txt"];

function isAllowedFile(name: string): boolean {
  return ALLOWED_EXTS.some((ext) => name.toLowerCase().endsWith(ext));
}

// ─── Error toast ──────────────────────────────────────────────────────────────

function ErrorToast({ msg }: { msg: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-24 right-4 z-50 bg-[var(--primary,#06B6D4)] text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-lg animate-[slideInToast_220ms_ease-out]"
    >
      {msg}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BankPage() {
  const router = useRouter();
  const userId = useUserId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [noteContent, setNoteContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [weaponTitle, setWeaponTitle] = useState("");
  const [buyoutOffer, setBuyoutOffer] = useState<InstantBuyoutOffer | null>(null);
  const [buyoutAccepted, setBuyoutAccepted] = useState(false);
  const [guildId, setGuildId] = useState("GUILD:0001");
  const [copied, setCopied] = useState(false);
  const [showCurl, setShowCurl] = useState(false);

  const triggerPoyon = useTactile("poyon");

  const assessRange = noteContent.length > 0
    ? computeAssessmentRange(Math.min(100, Math.max(20, noteContent.replace(/\s/g, "").length / 2)))
    : null;

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 2000);
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!isAllowedFile(file.name)) {
      showError("MD ファイルだけ受け付けています");
      return;
    }
    if (file.size > MAX_BYTES) {
      showError("もう少しコンパクトにできますか？（1MB 以下）");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      setNoteContent(text);
      setFileName(file.name);
      setInputMode("text");
    };
    reader.readAsText(file, "UTF-8");
  }, [showError]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }, [loadFile]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

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
        ccaf: { intentSignals: hasIntent ? ["author-statement"] : [], thoughtDensity, iterations, authorId: userId, createdAt: new Date().toISOString() },
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
      mintWeapon({ title: weaponTitle, noteContent, rank: auditResult.rank, score: auditResult.score, tags: extractTags(noteContent) });
      const slug = weaponTitle.replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 12) || "0001";
      setGuildId(`GUILD:${slug}`);
      setStep("done");
    }, 1500);
  }, [auditResult, noteContent, weaponTitle, triggerPoyon]);

  const handleReset = useCallback(() => {
    setStep("input");
    setNoteContent("");
    setFileName(null);
    setAuditResult(null);
    setWeaponTitle("");
    setCopied(false);
    setShowCurl(false);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const endpointUrl = formatEndpointUrl(guildId);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(endpointUrl).then(() => setCopied(true));
  }, [endpointUrl]);

  const previewText = noteContent.length > PREVIEW_CHARS ? noteContent.slice(0, PREVIEW_CHARS) : noteContent;
  const remaining = noteContent.length > PREVIEW_CHARS ? noteContent.length - PREVIEW_CHARS : 0;

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8">
      {errorMsg && <ErrorToast msg={errorMsg} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)]">何を のこしますか？</h1>
        <p className="text-sm text-[var(--n-muted,#6B6456)] mt-1">
          MD ファイルを選ぶか、直接書いてください。AIが価値を査定します。
        </p>
      </div>

      {step === "input" && (
        <div className="space-y-4">
          {/* ── Mode tabs ──────────────────────────────────────── */}
          <div className="flex gap-1 bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl p-1 w-fit">
            {([["file", "📁 ファイル"], ["text", "✍️ 直接書く"]] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInputMode(mode)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-220 ${
                  inputMode === mode
                    ? "bg-[var(--primary,#06B6D4)] text-white"
                    : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── File mode ──────────────────────────────────────── */}
          {inputMode === "file" && (
            <div
              role="region"
              aria-label="MD ファイルをドラッグ＆ドロップ"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-dragging={isDragging}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 flex flex-col items-center gap-4 transition-all duration-220 cursor-pointer ${
                isDragging
                  ? "border-[#06B6D4] bg-red-50"
                  : "border-gray-300 bg-[var(--n-surface,#FFFFFF)] hover:border-[#06B6D4] hover:bg-red-50/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,text/markdown,text/plain"
                onChange={handleFileChange}
                className="hidden"
                aria-label="MD ファイルを選ぶ"
              />
              <span className="text-4xl select-none">📂</span>
              <div className="text-center">
                <p className="text-base font-bold text-[var(--n-text,#1A1714)]">
                  {isDragging ? "ここに放す" : "ファイルをドラッグ＆ドロップ"}
                </p>
                <p className="text-xs text-[var(--n-muted,#6B6456)] mt-1">または クリックして選ぶ</p>
                <p className="text-xs text-slate-400 mt-1">.md / .markdown / .txt • 最大 1MB</p>
              </div>
            </div>
          )}

          {/* ── Text mode (also shown after file load) ─────────── */}
          {inputMode === "text" && (
            <div className="bg-[var(--n-surface,#FFFFFF)] border-2 border-dashed border-[var(--n-divider,rgba(0,0,0,0.12))] rounded-2xl p-4 hover:border-[var(--primary,#06B6D4)]/40 transition-colors">
              {fileName && (
                <p className="text-xs text-[var(--primary,#06B6D4)] font-semibold mb-2">📎 {fileName}</p>
              )}
              <textarea
                className="w-full h-52 bg-transparent resize-none text-sm text-[var(--n-text,#1A1714)] placeholder-[var(--n-muted,#6B6456)] focus:outline-none"
                placeholder={"ここに MD を貼り付け\n\n# タイトル\n\nあなたのこだわり・設計判断・試行錯誤を書いてください..."}
                value={previewText}
                onChange={(e) => { setNoteContent(e.target.value); setFileName(null); }}
                aria-label="MD を直接書く"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-[var(--n-muted,#6B6456)]">
                <span>
                  {noteContent.length.toLocaleString("ja-JP")} 文字
                  {remaining > 0 && <span className="ml-2 text-[var(--primary,#06B6D4)]">（あと {remaining.toLocaleString("ja-JP")} 文字）</span>}
                </span>
                {noteContent.length > 50 && (
                  <span className="text-[var(--primary,#06B6D4)] font-semibold">● Sランク候補</span>
                )}
              </div>
            </div>
          )}

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
            className="w-full py-3.5 rounded-full bg-[var(--primary,#06B6D4)] text-white font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#0891B2] active:scale-[0.98] transition-all duration-220 shadow-md"
            aria-label="ノートを提出して鑑定する"
          >
            のこす →
          </button>
        </div>
      )}

      {step === "scoring" && (
        <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary,#06B6D4)] to-transparent animate-[scanLine_0.4s_ease-in-out_forwards]" aria-hidden />
          <p className="text-[var(--primary,#06B6D4)] font-bold text-lg">鑑定中…</p>
          <p className="text-xs text-[var(--n-muted,#6B6456)] mt-2">AIが思考密度を解析しています</p>
        </div>
      )}

      {step === "result" && auditResult && (
        <div className="space-y-4">
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
            <div className="mt-4 bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl px-4 py-3">
              <p className="text-xs text-[var(--n-muted,#6B6456)] mb-1">査定額レンジ</p>
              <p className="font-bold tabular-nums text-[var(--n-gold,#D4AF37)] text-lg">
                {formatJpy(computeAssessmentRange(auditResult.score)[0])} 〜 {formatJpy(computeAssessmentRange(auditResult.score)[1])}
              </p>
            </div>
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
            <button type="button" onClick={handleMint} className="flex-1 py-3 rounded-full bg-[var(--primary,#06B6D4)] text-white font-bold hover:bg-[#0891B2] active:scale-[0.98] transition-all">
              のこす →
            </button>
          </div>
        </div>
      )}

      {(step === "minting" || step === "done") && auditResult && (
        <div className="space-y-4">
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
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] hover:border-[var(--n-gold,#D4AF37)] transition-colors"
              >
                もう一つのこす
              </button>
              <button
                type="button"
                onClick={() => router.push("/jobs")}
                className="px-5 py-2.5 rounded-full bg-[var(--primary,#06B6D4)] text-white font-bold hover:bg-[#0891B2]"
              >
                かせぐ →
              </button>
            </div>
          </div>

          {/* ── この知恵のAPI ───────────────────────────────────── */}
          {step === "done" && (
            <div
              className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-4 space-y-3"
              data-testid="endpoint-card"
            >
              <p className="text-xs font-bold text-[var(--n-text,#1A1714)]">この知恵の API</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] bg-[var(--n-surface-2,#F5F3EE)] rounded-xl px-3 py-2 font-mono text-[var(--n-muted,#6B6456)] truncate">
                  {endpointUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="URLをコピー"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-[var(--primary,#06B6D4)] text-white text-xs font-bold hover:bg-[#0891B2] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary,#06B6D4)] focus:ring-offset-1"
                >
                  {copied ? "コピー済み ✓" : "コピー"}
                </button>
              </div>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">
                1コール ¥1.2 · 24時間稼働
              </p>
              <details open={showCurl}>
                <summary
                  className="text-[10px] text-[var(--primary,#06B6D4)] font-semibold cursor-pointer select-none"
                  onClick={(e) => { e.preventDefault(); setShowCurl((v) => !v); }}
                >
                  使い方を見る
                </summary>
                {showCurl && (
                  <pre className="mt-2 bg-[var(--n-surface-2,#F5F3EE)] rounded-xl p-3 text-[10px] font-mono text-[var(--n-muted,#6B6456)] overflow-x-auto whitespace-pre-wrap break-all">
{`# GET メタ情報
curl ${endpointUrl}

# POST 実行（印税カウント）
curl -X POST ${endpointUrl}`}
                  </pre>
                )}
              </details>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
