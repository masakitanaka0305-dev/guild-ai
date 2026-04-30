"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  EXPRESS_STEPS,
  BUDGET_MS,
  getFirstRoyaltyJpy,
  analyzeContent,
  validateExpressInput,
  type ExpressInput,
  type ContentAnalysis,
} from "@/lib/express-path";
import {
  QUICK_AUTO_STEPS,
  QUICK_BUDGET_MS,
  buildQuickResult,
  type QuickResult,
} from "@/lib/quick-listing";
import { simulateOnboarding } from "@/lib/github-onboarding";
import { recordExpressRun } from "@/lib/metrics/express";
import type { Rank } from "@/types";

const ConnectGithubButton = dynamic(
  () => import("@/components/ConnectGithubButton").then(m => ({ default: m.ConnectGithubButton })),
  { ssr: false, loading: () => <div className="h-10 w-44 animate-pulse rounded-2xl bg-gray-100" /> }
);

// Steps for Express (detail) mode — all except source
const EXPRESS_RUNNING_STEPS = EXPRESS_STEPS.filter((s) => s.id !== "source");

// ─── Timer Bar ───────────────────────────────────────────────────────────────

function TimerBar({
  elapsedMs,
  achieved,
  pending = false,
  budgetMs,
}: {
  elapsedMs: number;
  achieved: boolean;
  pending?: boolean;
  budgetMs: number;
}) {
  const pct = Math.min(100, (elapsedMs / budgetMs) * 100);
  const overBudget = !pending && elapsedMs > budgetMs;
  const barColor = pending
    ? "bg-[var(--n-surface-2,#F5F3EE)]"
    : achieved
    ? "bg-green-500"
    : overBudget
    ? "bg-red-500"
    : "bg-blue-500";
  const budgetSec = Math.round(budgetMs / 1000);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-[var(--n-muted,#6B6456)]">
          {pending
            ? "入力待ち"
            : achieved
            ? "完了 ✓"
            : overBudget
            ? `${budgetSec}s超過`
            : `${Math.floor(elapsedMs / 1000)}s / ${budgetSec}s`}
        </span>
        <span className="text-[10px] text-[var(--n-muted,#6B6456)]">{budgetSec} 秒以内</span>
      </div>
      <div className="w-full h-2 bg-[var(--n-surface-2,#F5F3EE)] rounded-full overflow-hidden relative">
        <div className="absolute top-0 bottom-0 right-0 w-px bg-red-400 opacity-60" />
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: pending ? "0%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Confetti removed — animations disabled via [data-anim="off"]

// ─── Source Step (shared between quick and detail modes) ─────────────────────

type InputKind = "url" | "file" | "text";

const INPUT_CARDS: { id: InputKind; icon: string; label: string; hint: string }[] = [
  { id: "url",  icon: "🔗", label: "GitHub URL",   hint: "リポジトリ URL を貼り付け" },
  { id: "file", icon: "📄", label: "ファイル投入", hint: ".md / .txt ドロップ" },
  { id: "text", icon: "✏️", label: "直接書く",     hint: "本文をペースト or 入力" },
];

function SourceStep({
  onComplete,
  fastMode,
}: {
  onComplete: (input: ExpressInput) => void;
  fastMode: boolean;
}) {
  const [consented, setConsented] = useState(false);
  const [kind, setKind] = useState<InputKind>("url");
  const [urlValue, setUrlValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!fastMode) return;
    setConsented(true);
    setKind("url");
    const demoUrl = "https://github.com/demo/express-demo";
    setUrlValue(demoUrl);
    const t = setTimeout(() => onComplete({ kind: "url", content: demoUrl }), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fastMode]);

  function readFile(file: File) {
    if (file.size > 200 * 1024) { setError("200KB 以下にしてください"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent((e.target?.result as string) ?? "");
      setFileName(file.name);
      setFileSize(file.size);
      setError("");
    };
    reader.readAsText(file, "utf-8");
  }

  function handleSubmit() {
    let input: ExpressInput;
    if (kind === "url") input = { kind: "url", content: urlValue };
    else if (kind === "file") input = { kind: "file", content: fileContent, meta: { fileName, fileSize } };
    else input = { kind: "text", content: textValue };
    const v = validateExpressInput(input);
    if (!v.ok) { setError(v.error ?? "入力エラー"); return; }
    setError("");
    onComplete(input);
  }

  return (
    <section className="space-y-5">
      <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--n-divider,rgba(0,0,0,0.1))] bg-[var(--n-surface-2,#F5F3EE)] cursor-pointer">
        <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--primary,#06B6D4)]" />
        <span className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed">
          <Link href="/legal/terms" className="text-[var(--primary,#06B6D4)] underline">利用規約</Link>
          {" "}と{" "}
          <Link href="/legal/transfer" className="text-[var(--primary,#06B6D4)] underline">権利譲渡条件</Link>
          {" "}に同意します（MD コンテンツの IP は GUILD AI に帰属します）
        </span>
      </label>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="入力方法を選択">
        {INPUT_CARDS.map((c) => (
          <button key={c.id} type="button" disabled={!consented}
            onClick={() => { setKind(c.id); setError(""); }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center disabled:opacity-30 disabled:cursor-not-allowed ${
              kind === c.id
                ? "border-[var(--primary,#06B6D4)] bg-red-50"
                : "border-[var(--n-divider,rgba(0,0,0,0.1))] bg-white hover:border-[var(--primary,#06B6D4)] hover:bg-red-50"
            }`}
          >
            <span className="text-xl">{c.icon}</span>
            <span className="text-[11px] font-bold text-[var(--n-text,#1A1714)]">{c.label}</span>
            <span className="text-[9px] text-[var(--n-muted,#6B6456)] leading-tight">{c.hint}</span>
          </button>
        ))}
      </div>

      {kind === "url" && (
        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-1.5">GitHub から始める</legend>
          {/* GitHub OAuth integration — direct repo picker */}
          <div className="mb-3">
            <ConnectGithubButton />
            <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-1.5">
              GitHub 連携でリポジトリを選択 → AI が自動解析します
            </p>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-[var(--n-divider,rgba(0,0,0,0.1))]" />
            <span className="text-[10px] text-[var(--n-muted,#6B6456)]">または URL を直接入力</span>
            <div className="flex-1 h-px bg-[var(--n-divider,rgba(0,0,0,0.1))]" />
          </div>
          <input type="url" value={urlValue} disabled={!consented}
            onChange={(e) => { setUrlValue(e.target.value); setError(""); }}
            placeholder="https://github.com/username/repo"
            className="w-full px-3 py-2 text-sm border border-[var(--n-divider,rgba(0,0,0,0.1))] rounded-lg bg-white placeholder-[var(--n-muted,#6B6456)] focus:outline-none focus:ring-2 focus:ring-[var(--primary,#06B6D4)] disabled:opacity-40"
          />
        </fieldset>
      )}

      {kind === "file" && (
        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-1.5">MD / テキストファイル</legend>
          <div
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) readFile(f); }}
            onDragOver={(e) => { e.preventDefault(); if (consented) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            role="region" aria-label="MD ファイルをここにドロップ"
            className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors ${
              !consented ? "opacity-30 cursor-not-allowed border-[var(--n-divider,rgba(0,0,0,0.1))]"
              : dragOver ? "border-[var(--primary,#06B6D4)] bg-red-50"
              : fileContent ? "border-green-400 bg-green-50"
              : "border-[var(--n-divider,rgba(0,0,0,0.15))] bg-[var(--n-surface-2,#F5F3EE)]"
            }`}
          >
            {fileContent
              ? <><span className="text-2xl">✅</span><p className="text-xs font-bold text-green-700">{fileName}</p></>
              : <><span className="text-2xl">📄</span><p className="text-xs text-[var(--n-muted,#6B6456)]">.md / .txt をドロップ</p></>
            }
            <input type="file" accept=".md,.txt,.markdown" disabled={!consented}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" aria-label="ファイルを選択"
            />
          </div>
        </fieldset>
      )}

      {kind === "text" && (
        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-1.5">MD テキストを直接入力</legend>
          <textarea value={textValue} disabled={!consented} rows={6}
            onChange={(e) => { setTextValue(e.target.value); setError(""); }}
            placeholder={"# タイトル\n\nここに Markdown を貼り付けてください..."}
            className="w-full px-3 py-2 text-sm border border-[var(--n-divider,rgba(0,0,0,0.1))] rounded-lg bg-white placeholder-[var(--n-muted,#6B6456)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary,#06B6D4)] disabled:opacity-40 font-mono"
          />
          <p className="text-[10px] text-[var(--n-muted,#6B6456)] text-right mt-0.5">
            {textValue.trim().length} 文字（100 文字以上）
          </p>
        </fieldset>
      )}

      {error && <p role="alert" className="text-xs text-red-600 font-bold px-1">⚠ {error}</p>}

      <button type="button" onClick={handleSubmit} disabled={!consented}
        className="w-full py-3 text-sm font-bold rounded-lg bg-[var(--primary,#06B6D4)] text-white hover:bg-[#0891B2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        コンテンツを投入して開始 →
      </button>
    </section>
  );
}

// ─── Quick Listing (3-step) content ──────────────────────────────────────────

function QuickContent() {
  const searchParams = useSearchParams();
  const fastMode = searchParams.get("fast") === "1";
  const detailMode = searchParams.get("detail") === "1";

  // Redirect detail mode to full Express
  if (detailMode) return <ExpressContent />;

  const [phase, setPhase] = useState<"source" | "running" | "done">("source");
  const [expressInput, setExpressInput] = useState<ExpressInput | null>(null);
  const [quickResult, setQuickResult] = useState<QuickResult | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(0);

  const handleSourceComplete = useCallback((input: ExpressInput) => {
    setExpressInput(input);
    setPhase("running");
    setCurrentStepIdx(0);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase !== "running" || currentStepIdx < 0) return;
    if (currentStepIdx >= QUICK_AUTO_STEPS.length) {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);
      setPhase("done");
      if (expressInput) {
        const result = buildQuickResult(expressInput, elapsed);
        setQuickResult(result);
        recordExpressRun("demo-user", Math.round(elapsed / 1000));
      }
      return;
    }
    const step = QUICK_AUTO_STEPS[currentStepIdx];
    const t = setTimeout(() => setCurrentStepIdx((i) => i + 1), step.durationMs);
    return () => clearTimeout(t);
  }, [phase, currentStepIdx, expressInput]);

  useEffect(() => {
    if (phase !== "running") return;
    const interval = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 200);
    return () => clearInterval(interval);
  }, [phase]);

  const achieved = phase === "done" && elapsedMs < QUICK_BUDGET_MS;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[var(--primary,#06B6D4)] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            Quick Listing
          </span>
          <span className="text-xs text-[var(--n-muted,#6B6456)]">3 ステップ・10 秒以内</span>
          <Link href="/onboarding?detail=1" className="ml-auto text-[10px] text-[var(--n-muted,#6B6456)] underline">
            詳細モード →
          </Link>
        </div>
        <h1 className="text-2xl font-black text-[var(--n-text,#1A1714)] tracking-tight">
          MD を出品する
        </h1>
        <p className="mt-0.5 text-sm text-[var(--n-muted,#6B6456)]">
          コンテンツ投入 → AI 鑑定 → 出品完了
        </p>
      </div>

      {phase === "source" && (
        <>
          <TimerBar elapsedMs={0} achieved={false} pending budgetMs={QUICK_BUDGET_MS} />

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-5">
            {["コンテンツ投入", "AI 鑑定", "出品完了"].map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-[var(--primary,#06B6D4)] text-white" : "bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)]"
                }`}>{i + 1}</span>
                <span className={`text-[10px] font-medium ${i === 0 ? "text-[var(--n-text,#1A1714)]" : "text-[var(--n-muted,#6B6456)]"}`}>
                  {label}
                </span>
                {i < 2 && <span className="text-[var(--n-muted,#6B6456)] text-[10px]">›</span>}
              </div>
            ))}
          </div>

          <SourceStep onComplete={handleSourceComplete} fastMode={fastMode} />
        </>
      )}

      {phase === "running" && (
        <section aria-live="polite" role="status" className="space-y-4">
          <TimerBar elapsedMs={elapsedMs} achieved={false} budgetMs={QUICK_BUDGET_MS} />

          <ol className="space-y-2">
            {/* Source: done */}
            <li className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center text-green-600 text-xs font-bold">✓</span>
              <p className="text-xs font-bold text-[var(--n-text,#1A1714)]">コンテンツ投入</p>
              <span className="ml-auto text-[10px] text-green-600 font-bold">完了</span>
            </li>
            {QUICK_AUTO_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;
              return (
                <li key={step.id}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    isDone ? "border-green-200 bg-green-50"
                    : isActive ? "border-[var(--primary,#06B6D4)] bg-red-50"
                    : "border-[var(--n-divider,rgba(0,0,0,0.08))] bg-white opacity-40"
                  }`}
                >
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {isDone ? <span className="text-green-600">✓</span>
                    : isActive ? <span className="text-[var(--primary,#06B6D4)] animate-pulse">●</span>
                    : <span className="text-[var(--n-muted,#6B6456)]">{idx + 2}</span>}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[var(--n-text,#1A1714)]">{step.label}</p>
                    {isActive && <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-0.5">{step.description}</p>}
                  </div>
                  <span className="text-[10px] text-[var(--n-muted,#6B6456)] shrink-0">~{step.durationMs / 1000}s</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {phase === "done" && quickResult && (
        <section className="space-y-4">
          <div className="section-card p-5 border-2 border-green-400 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎉</span>
              <h2 className="text-base font-black text-[var(--n-text,#1A1714)]">
                出品完了！{Math.round(elapsedMs / 1000)} 秒
              </h2>
            </div>
            <TimerBar elapsedMs={elapsedMs} achieved={achieved} budgetMs={QUICK_BUDGET_MS} />
            <dl className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">コンテンツ</dt>
                <dd className="text-xs font-bold truncate max-w-[160px]">{quickResult.title}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">ランク</dt>
                <dd className="text-sm font-black text-[var(--primary,#06B6D4)]">{quickResult.rank} ランク</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">Validation Score</dt>
                <dd className="text-sm font-black">{quickResult.validationScore}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">エンドポイント</dt>
                <dd className="text-[10px] font-mono font-bold truncate max-w-[160px]">
                  guild-ai.vercel.app/{quickResult.endpointSlug}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex gap-3">
            <Link href="/projects" className="flex-1 py-2.5 text-sm font-bold rounded-lg bg-[var(--primary,#06B6D4)] text-white text-center hover:bg-[#0891B2] transition-colors">
              案件を探す
            </Link>
            <Link href="/guild" className="flex-1 py-2.5 text-sm font-bold rounded-lg border border-[var(--n-divider,rgba(0,0,0,0.1))] text-center hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors">
              Asset Ledger
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

// ─── Express Path (8-step detail mode) ───────────────────────────────────────

function ExpressContent() {
  const searchParams = useSearchParams();
  const fastMode = searchParams.get("fast") === "1";

  const [phase, setPhase] = useState<"source" | "running" | "done">("source");
  const [expressInput, setExpressInput] = useState<ExpressInput | null>(null);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [royaltyJpy, setRoyaltyJpy] = useState(0);
  const [endpointSlug, setEndpointSlug] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(0);

  const handleSourceComplete = useCallback((input: ExpressInput) => {
    const a = analyzeContent(input);
    setExpressInput(input);
    setAnalysis(a);
    setPhase("running");
    setCurrentStepIdx(0);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (phase !== "running" || currentStepIdx < 0) return;
    if (currentStepIdx >= EXPRESS_RUNNING_STEPS.length) {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);
      setPhase("done");
      const repoUrl = expressInput?.kind === "url" ? expressInput.content : "https://github.com/demo/express-demo";
      const onboardResult = simulateOnboarding("demo-user", repoUrl);
      setEndpointSlug(onboardResult.endpointSlug);
      const rank = (analysis?.rank ?? "B") as Rank;
      setRoyaltyJpy(getFirstRoyaltyJpy(rank));
      recordExpressRun("demo-user", Math.round(elapsed / 1000));
      return;
    }
    const step = EXPRESS_RUNNING_STEPS[currentStepIdx];
    const duration = fastMode && step.id === "first-royalty" ? 3000 : step.durationMs;
    const t = setTimeout(() => setCurrentStepIdx((i) => i + 1), duration);
    return () => clearTimeout(t);
  }, [phase, currentStepIdx, expressInput, fastMode, analysis]);

  useEffect(() => {
    if (phase !== "running") return;
    const interval = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 500);
    return () => clearInterval(interval);
  }, [phase]);

  const achieved = phase === "done" && elapsedMs < BUDGET_MS;
  const validationScore = analysis?.validationScore ?? 72;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[var(--primary,#06B6D4)] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            Express Path
          </span>
          <span className="text-xs text-[var(--n-muted,#6B6456)]">3 分以内に初回利益確定</span>
        </div>
        <h1 className="text-2xl font-black text-[var(--n-text,#1A1714)] tracking-tight">
          Onboarding Express
        </h1>
        <p className="mt-0.5 text-sm text-[var(--n-muted,#6B6456)]">
          MD コンテンツ投入 → Asset Ledger 登記 → First Royalty まで 8 ステップ
        </p>
      </div>

      {phase === "source" && (
        <>
          <TimerBar elapsedMs={0} achieved={false} pending budgetMs={BUDGET_MS} />
          <SourceStep onComplete={handleSourceComplete} fastMode={fastMode} />
        </>
      )}

      {phase === "running" && (
        <section aria-live="polite" role="status">
          <TimerBar elapsedMs={elapsedMs} achieved={false} budgetMs={BUDGET_MS} />
          <ol className="space-y-2">
            <li className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center text-green-600 text-xs font-bold">✓</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--n-text,#1A1714)]">コンテンツ投入</p>
                {analysis && <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-0.5 truncate">「{analysis.title}」— {analysis.rank} ランク</p>}
              </div>
              <span className="text-[10px] text-green-600 shrink-0 font-bold">完了</span>
            </li>
            {EXPRESS_RUNNING_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;
              return (
                <li key={step.id} aria-current={isActive ? "step" : undefined}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    isDone ? "border-green-200 bg-green-50"
                    : isActive ? "border-[var(--primary,#06B6D4)] bg-red-50"
                    : "border-[var(--n-divider,rgba(0,0,0,0.08))] bg-white opacity-40"
                  }`}
                >
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {isDone ? <span className="text-green-600">✓</span>
                    : isActive ? <span className="text-[var(--primary,#06B6D4)] animate-pulse">●</span>
                    : <span className="text-[var(--n-muted,#6B6456)]">{idx + 2}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-none">{step.label}</p>
                    {isActive && <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-0.5">{step.description}</p>}
                  </div>
                  <span className="text-[10px] text-[var(--n-muted,#6B6456)] shrink-0">~{Math.round(step.durationMs / 1000)}s</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {phase === "done" && (
        <section className="space-y-4">
          {/* confetti removed */}
          <div className={`section-card p-5 border-2 ${achieved ? "border-green-400 bg-green-50" : "border-[var(--n-divider,rgba(0,0,0,0.1))]"}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{achieved ? "🎉" : "✅"}</span>
              <h2 className="text-base font-black">{achieved ? "3 分以内に利益が確定しました" : "Express Path 完了"}</h2>
            </div>
            <TimerBar elapsedMs={elapsedMs} achieved={achieved} budgetMs={BUDGET_MS} />
            <dl className="space-y-2 mt-3">
              {analysis && (
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-[var(--n-muted,#6B6456)]">コンテンツ</dt>
                  <dd className="text-xs font-bold truncate max-w-[160px]">{analysis.title}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">所要時間</dt>
                <dd className="text-sm font-black">{Math.round(elapsedMs / 1000)} 秒</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">First Royalty</dt>
                <dd className="text-base font-black text-[var(--primary,#06B6D4)]">+¥{royaltyJpy.toLocaleString("ja-JP")}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">Validation Score</dt>
                <dd className="text-sm font-black">{validationScore}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">エンドポイント</dt>
                <dd className="text-[10px] font-mono font-bold truncate max-w-[160px]">guild-ai.vercel.app/{endpointSlug}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-white border border-green-200">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-sm">💴</div>
              <div className="flex-1">
                <p className="text-xs font-bold">AtoA 取引 — First Royalty</p>
                <p className="text-[10px] text-[var(--n-muted,#6B6456)]">初回エージェント購入が発火しました</p>
              </div>
              <span className="text-sm font-black text-green-600 shrink-0">+¥{royaltyJpy.toLocaleString("ja-JP")}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/projects" className="flex-1 py-2.5 text-sm font-bold rounded-lg bg-[var(--primary,#06B6D4)] text-white text-center hover:bg-[#0891B2] transition-colors">
              案件を探す
            </Link>
            <Link href="/guild" className="flex-1 py-2.5 text-sm font-bold rounded-lg border border-[var(--n-divider,rgba(0,0,0,0.1))] text-center hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors">
              Asset Ledger
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

// ─── Root page — defaults to Quick Listing ───────────────────────────────────

function OnboardingContent() {
  const searchParams = useSearchParams();
  const detailMode = searchParams.get("detail") === "1";

  if (detailMode) return <ExpressContent />;
  return <QuickContent />;
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
