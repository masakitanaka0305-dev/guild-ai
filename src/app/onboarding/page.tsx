"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ONBOARDING_STEPS,
  TOTAL_DURATION_MS,
  simulateOnboarding,
  type OnboardingStepId,
  type OnboardingResult,
} from "@/lib/github-onboarding";

export default function OnboardingPage() {
  const [phase, setPhase] = useState<"form" | "running" | "done">("form");
  const [githubUrl, setGithubUrl] = useState("");
  const [handle, setHandle] = useState("demo-user");
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const runOnboarding = useCallback(() => {
    if (!githubUrl.startsWith("https://github.com/")) return;
    setPhase("running");
    setCurrentStepIdx(0);
    setStartTime(Date.now());
  }, [githubUrl]);

  // Advance steps sequentially
  useEffect(() => {
    if (phase !== "running" || currentStepIdx < 0) return;
    if (currentStepIdx >= ONBOARDING_STEPS.length) {
      setPhase("done");
      setResult(simulateOnboarding(handle, githubUrl));
      return;
    }
    const step = ONBOARDING_STEPS[currentStepIdx];
    const t = setTimeout(() => setCurrentStepIdx((i) => i + 1), step.durationMs);
    return () => clearTimeout(t);
  }, [phase, currentStepIdx, githubUrl, handle]);

  // Elapsed timer for progress bar
  useEffect(() => {
    if (phase !== "running") return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 200);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  const progressPct = Math.min(100, Math.round((elapsed / TOTAL_DURATION_MS) * 100));

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[var(--n-text,#1A1714)] tracking-tight">
          Onboarding Express
        </h1>
        <p className="mt-1 text-sm text-[var(--n-muted,#6B6456)]">
          GitHub リポジトリを接続して 2 分で Marketplace に出品
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
          <button
            onClick={runOnboarding}
            disabled={!githubUrl.startsWith("https://github.com/")}
            className="w-full py-2.5 text-sm font-bold rounded-lg bg-[var(--n-primary,#E64545)] text-white hover:bg-[#D03A3A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            GitHub で接続して解析開始
          </button>
        </section>
      )}

      {phase === "running" && (
        <section aria-live="polite" role="status">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[var(--n-text,#1A1714)]">解析中…</span>
              <span className="text-xs text-[var(--n-muted,#6B6456)]">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--n-surface-2,#F5F3EE)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--n-primary,#E64545)] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Step list */}
          <ol className="space-y-3">
            {ONBOARDING_STEPS.map((step, idx) => {
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
                    <p className="text-sm font-bold text-[var(--n-text,#1A1714)] leading-none">
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-[var(--n-muted,#6B6456)] mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {phase === "done" && result && (
        <section className="space-y-4">
          <div className="section-card p-5 border-2 border-green-400 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎉</span>
              <h2 className="text-base font-black text-[var(--n-text,#1A1714)]">
                出品完了！
              </h2>
            </div>
            <p className="text-xs text-[var(--n-muted,#6B6456)] mb-3">
              Marketplace でライブになりました
            </p>

            <dl className="space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">エンドポイント</dt>
                <dd className="text-xs font-mono font-bold text-[var(--n-text,#1A1714)]">
                  guild-ai.vercel.app/{result.endpointSlug}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">Validation Score</dt>
                <dd className="text-sm font-black text-[var(--n-primary,#E64545)]">
                  {result.validationScore}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">検出資産数</dt>
                <dd className="text-sm font-black text-[var(--n-text,#1A1714)]">
                  {result.scanResult.suggestedAssets.length} 件
                </dd>
              </div>
              {result.topAsset && (
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-[var(--n-muted,#6B6456)]">最高ランク資産</dt>
                  <dd className="text-xs font-bold text-[var(--n-text,#1A1714)]">
                    {result.topAsset.title}{" "}
                    <span className="text-[var(--n-primary,#E64545)]">
                      [{result.topAsset.rank}]
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex gap-3">
            <Link
              href="/marketplace"
              className="flex-1 py-2.5 text-sm font-bold rounded-lg bg-[var(--n-primary,#E64545)] text-white text-center hover:bg-[#D03A3A] transition-colors"
            >
              Marketplace を見る
            </Link>
            <Link
              href="/bank"
              className="flex-1 py-2.5 text-sm font-bold rounded-lg border border-[var(--n-divider,rgba(0,0,0,0.1))] text-[var(--n-text,#1A1714)] text-center hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
            >
              追加投稿
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
