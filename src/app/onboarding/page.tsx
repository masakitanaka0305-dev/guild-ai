"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  EXPRESS_STEPS,
  BUDGET_MS,
  TOTAL_DURATION_MS,
  getFirstRoyaltyJpy,
  type ExpressStepId,
} from "@/lib/express-path";
import { simulateOnboarding, type OnboardingResult } from "@/lib/github-onboarding";
import { recordExpressRun } from "@/lib/metrics/express";
import type { Rank } from "@/types";

// ─── Timer Bar ───────────────────────────────────────────────────────────────

function TimerBar({ elapsedMs, achieved }: { elapsedMs: number; achieved: boolean }) {
  const pct = Math.min(100, (elapsedMs / BUDGET_MS) * 100);
  const overBudget = elapsedMs > BUDGET_MS;
  const barColor = achieved
    ? "bg-green-500"
    : overBudget
    ? "bg-red-500"
    : "bg-blue-500";

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-[var(--n-muted,#6B6456)]">
          {achieved ? "完了 ✓" : overBudget ? "3分超過" : `${Math.floor(elapsedMs / 1000)}s / 180s`}
        </span>
        <span className="text-[10px] text-[var(--n-muted,#6B6456)]">3 分以内</span>
      </div>
      <div className="w-full h-2 bg-[var(--n-surface-2,#F5F3EE)] rounded-full overflow-hidden relative">
        {/* 3-min red deadline marker */}
        <div className="absolute top-0 bottom-0 right-0 w-px bg-red-400 opacity-60" />
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Confetti (8 particles, reduced-motion: fade only) ───────────────────────

function Confetti() {
  const particles = [
    { x: 12, delay: 0,   color: "#E64545" },
    { x: 25, delay: 0.1, color: "#F59E0B" },
    { x: 40, delay: 0.2, color: "#0E9F4F" },
    { x: 55, delay: 0.1, color: "#3B82F6" },
    { x: 68, delay: 0.3, color: "#E64545" },
    { x: 80, delay: 0.2, color: "#F59E0B" },
    { x: 90, delay: 0,   color: "#0E9F4F" },
    { x: 5,  delay: 0.4, color: "#3B82F6" },
  ];

  return (
    <div className="relative h-8 overflow-hidden mb-3" aria-hidden>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm animate-bounce motion-reduce:animate-none motion-reduce:opacity-0"
          style={{
            left: `${p.x}%`,
            top: `${(i % 3) * 8}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: "0.8s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────

function OnboardingContent() {
  const searchParams = useSearchParams();
  const fastMode = searchParams.get("fast") === "1";

  const [phase, setPhase] = useState<"form" | "running" | "done">("form");
  const [githubUrl, setGithubUrl] = useState("");
  const [handle, setHandle] = useState("demo-user");
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [royaltyJpy, setRoyaltyJpy] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(0);

  const runOnboarding = useCallback(() => {
    if (!githubUrl.startsWith("https://github.com/")) return;
    setPhase("running");
    setCurrentStepIdx(0);
    startTimeRef.current = Date.now();
  }, [githubUrl]);

  // Auto-start in fast mode with demo URL
  useEffect(() => {
    if (fastMode && phase === "form") {
      setGithubUrl("https://github.com/demo/express-demo");
      setTimeout(() => {
        setPhase("running");
        setCurrentStepIdx(0);
        startTimeRef.current = Date.now();
      }, 300);
    }
  }, [fastMode, phase]);

  // Advance steps sequentially
  useEffect(() => {
    if (phase !== "running" || currentStepIdx < 0) return;
    if (currentStepIdx >= EXPRESS_STEPS.length) {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);
      setPhase("done");
      const onboardResult = simulateOnboarding(handle, githubUrl || "https://github.com/demo/express-demo");
      setResult(onboardResult);
      const rank = (onboardResult.scanResult.suggestedAssets[0]?.rank ?? "B") as Rank;
      setRoyaltyJpy(getFirstRoyaltyJpy(rank));
      recordExpressRun(handle, Math.round(elapsed / 1000));
      return;
    }
    const step = EXPRESS_STEPS[currentStepIdx];
    // Accelerate first-royalty in fast mode (demo: 3s instead of 40s)
    const duration = fastMode && step.id === "first-royalty" ? 3000 : step.durationMs;
    const t = setTimeout(() => setCurrentStepIdx((i) => i + 1), duration);
    return () => clearTimeout(t);
  }, [phase, currentStepIdx, githubUrl, handle, fastMode]);

  // Elapsed timer
  useEffect(() => {
    if (phase !== "running") return;
    const interval = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 500);
    return () => clearInterval(interval);
  }, [phase]);

  const budgetPct = Math.min(100, Math.round((elapsedMs / TOTAL_DURATION_MS) * 100));
  const achieved = phase === "done" && elapsedMs < BUDGET_MS;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[var(--n-primary,#E64545)] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            Express Path
          </span>
          <span className="text-xs text-[var(--n-muted,#6B6456)]">3 分以内に初回利益確定</span>
        </div>
        <h1 className="text-2xl font-black text-[var(--n-text,#1A1714)] tracking-tight">
          Onboarding Express
        </h1>
        <p className="mt-0.5 text-sm text-[var(--n-muted,#6B6456)]">
          GitHub リポジトリ → Asset Ledger 登記 → First Royalty まで 7 ステップ
        </p>
      </div>

      {phase === "form" && (
        <section className="section-card p-6 space-y-4">
          <div>
            <label htmlFor="github-url" className="block text-xs font-bold text-[var(--n-text,#1A1714)] mb-1.5">
              GitHub リポジトリ URL
            </label>
            <input
              id="github-url"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="w-full px-3 py-2 text-sm border border-[var(--n-divider,rgba(0,0,0,0.1))] rounded-lg bg-white text-[var(--n-text,#1A1714)] placeholder-[var(--n-muted,#6B6456)] focus:outline-none focus:ring-2 focus:ring-[var(--n-primary,#E64545)]"
            />
          </div>
          <div>
            <label htmlFor="handle" className="block text-xs font-bold text-[var(--n-text,#1A1714)] mb-1.5">
              ハンドル
            </label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--n-divider,rgba(0,0,0,0.1))] rounded-lg bg-white text-[var(--n-text,#1A1714)] focus:outline-none focus:ring-2 focus:ring-[var(--n-primary,#E64545)]"
            />
          </div>
          <p className="text-[10px] text-[var(--n-muted,#6B6456)] leading-relaxed">
            出品前に
            <Link href="/legal/terms" className="text-[var(--n-primary,#E64545)] underline mx-0.5">利用規約</Link>
            と
            <Link href="/legal/transfer" className="text-[var(--n-primary,#E64545)] underline mx-0.5">権利譲渡条件</Link>
            に同意してください。
          </p>
          <button
            onClick={runOnboarding}
            disabled={!githubUrl.startsWith("https://github.com/")}
            className="w-full py-3 text-sm font-bold rounded-lg bg-[var(--n-primary,#E64545)] text-white hover:bg-[#D03A3A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            3 分で利益確定まで → Express 開始
          </button>
        </section>
      )}

      {phase === "running" && (
        <section aria-live="polite" role="status">
          <TimerBar elapsedMs={elapsedMs} achieved={false} />

          <ol className="space-y-2">
            {EXPRESS_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;
              return (
                <li
                  key={step.id}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    isDone
                      ? "border-green-200 bg-green-50"
                      : isActive
                      ? "border-[var(--n-primary,#E64545)] bg-red-50"
                      : "border-[var(--n-divider,rgba(0,0,0,0.08))] bg-white opacity-40"
                  }`}
                >
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                    {isDone ? (
                      <span className="text-green-600">✓</span>
                    ) : isActive ? (
                      <span className="text-[var(--n-primary,#E64545)] animate-pulse">●</span>
                    ) : (
                      <span className="text-[var(--n-muted,#6B6456)]">{idx + 1}</span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--n-text,#1A1714)] leading-none">
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--n-muted,#6B6456)] shrink-0">
                    ~{Math.round(step.durationMs / 1000)}s
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {phase === "done" && result && (
        <section className="space-y-4">
          {achieved && <Confetti />}

          <div className={`section-card p-5 border-2 ${achieved ? "border-green-400 bg-green-50" : "border-[var(--n-divider,rgba(0,0,0,0.1))]"}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{achieved ? "🎉" : "✅"}</span>
              <h2 className="text-base font-black text-[var(--n-text,#1A1714)]">
                {achieved ? "3 分以内に利益が確定しました" : "Express Path 完了"}
              </h2>
            </div>

            <TimerBar elapsedMs={elapsedMs} achieved={achieved} />

            <dl className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">所要時間</dt>
                <dd className="text-sm font-black text-[var(--n-text,#1A1714)]">
                  {Math.round(elapsedMs / 1000)} 秒
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">First Royalty</dt>
                <dd className="text-base font-black text-[var(--n-primary,#E64545)]">
                  +¥{royaltyJpy.toLocaleString("ja-JP")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">Validation Score</dt>
                <dd className="text-sm font-black text-[var(--n-text,#1A1714)]">
                  {result.validationScore}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">エンドポイント</dt>
                <dd className="text-[10px] font-mono font-bold text-[var(--n-text,#1A1714)] truncate max-w-[160px]">
                  guild-ai.vercel.app/{result.endpointSlug}
                </dd>
              </div>
            </dl>

            {/* First Royalty payout toast style */}
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-white border border-green-200">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-sm">
                💴
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--n-text,#1A1714)]">AtoA 取引 — First Royalty</p>
                <p className="text-[10px] text-[var(--n-muted,#6B6456)]">初回エージェント購入が発火しました</p>
              </div>
              <span className="text-sm font-black text-green-600 shrink-0">
                +¥{royaltyJpy.toLocaleString("ja-JP")}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/marketplace"
              className="flex-1 py-2.5 text-sm font-bold rounded-lg bg-[var(--n-primary,#E64545)] text-white text-center hover:bg-[#D03A3A] transition-colors"
            >
              Marketplace を見る
            </Link>
            <Link
              href="/guild"
              className="flex-1 py-2.5 text-sm font-bold rounded-lg border border-[var(--n-divider,rgba(0,0,0,0.1))] text-[var(--n-text,#1A1714)] text-center hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
            >
              Asset Ledger
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
