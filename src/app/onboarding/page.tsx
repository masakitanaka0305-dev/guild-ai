"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { useAuthState } from "@/components/AuthProvider";
import { DeckHome } from "@/components/intelligence-deck/DeckHome";

// Inline GitHub mark — lucide-react v1 does not export Github.
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.52-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.49 3.14-1.18 3.14-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.08 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  );
}
import {
  EXPRESS_STEPS,
  BUDGET_MS,
  TOTAL_DURATION_MS,
  getFirstRoyaltyJpy,
  type ExpressStepId,
} from "@/lib/express-path";
import { simulateOnboarding, type OnboardingResult } from "@/lib/github-onboarding";
import { recordExpressRun } from "@/lib/metrics/express";
import { splitJapaneseName } from "@/lib/name-split";
import { HexagonSteps } from "@/components/ui/HexagonSteps";
import type { Rank } from "@/types";

// ─── Role tile selector (Step B) ─────────────────────────────────────────────

type RoleId = "engineer" | "designer" | "pdm";

interface RoleTile {
  id: RoleId;
  emoji: string;
  label: string;
  caption: string;
  accent: string;   // text-* class
  ring: string;     // ring-* class
}

const ROLE_TILES: RoleTile[] = [
  { id: "engineer", emoji: "💻", label: "エンジニア",  caption: "コードベースを資産化する", accent: "text-cyan-400",    ring: "ring-cyan-400/40"    },
  { id: "designer", emoji: "🎨", label: "デザイナー",  caption: "発想と表現を資産化する",   accent: "text-rose-400",    ring: "ring-rose-400/40"    },
  { id: "pdm",      emoji: "📋", label: "PdM",         caption: "意思決定と戦略を資産化する", accent: "text-emerald-400", ring: "ring-emerald-400/40" },
];

// ─── OAuth pre-fill (mock) ────────────────────────────────────────
// Auth is stubbed in v1, but the confirmation UI is wired to the
// shape OAuth would return. Swap MOCK_OAUTH_PROFILE for the real
// session payload when GitHub/Google auth lands.
const MOCK_OAUTH_PROFILE = {
  fullName: "田中 雅基",
  email: "masaki.tanaka.0305@gmail.com",
  githubHandle: "masaki-tanaka",
  githubUrl: "https://github.com/masaki-tanaka/water-guild-demo",
  avatarHexFill: "#22D3EE",
} as const;

// ─── Timer Bar ───────────────────────────────────────────────────────────────

function TimerBar({ elapsedMs, achieved }: { elapsedMs: number; achieved: boolean }) {
  const pct = Math.min(100, (elapsedMs / BUDGET_MS) * 100);
  const overBudget = elapsedMs > BUDGET_MS;
  const barColor = achieved
    ? "bg-emerald-500"
    : overBudget
    ? "bg-red-500"
    : "bg-blue-500";

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate-400">
          {achieved ? "完了 ✓" : overBudget ? "3分超過" : `${Math.floor(elapsedMs / 1000)}s / 180s`}
        </span>
        <span className="text-[10px] text-slate-400">3 分以内</span>
      </div>
      <div className="w-full h-2 bg-midnight-surface rounded-full overflow-hidden relative">
        {/* 3-min red deadline marker */}
        <div className="absolute top-0 bottom-0 right-0 w-px bg-red-400 opacity-60" />
        <div
          className={`h-full rounded-full ${barColor}`}
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
  const auth = useAuthState();
  // Anonymous visitors land on the Intelligence Deck (3-step roadmap)
  // before reaching the wizard. ?fast=1 bypasses the gate for demos.
  if (!fastMode && auth.status === "anonymous") {
    return <DeckHome />;
  }
  const queryRole = searchParams.get("role") as RoleId | null;
  const validQueryRole: RoleId | null =
    queryRole === "engineer" || queryRole === "designer" || queryRole === "pdm"
      ? queryRole
      : null;

  const [phase, setPhase] = useState<"form" | "running" | "done">("form");
  // Wizard step inside the form phase: github → role → confirm.
  const initialWizard: "github" | "role" | "confirm" =
    fastMode ? "confirm" : validQueryRole ? "confirm" : "github";
  const [wizardStep, setWizardStep] = useState<"github" | "role" | "confirm">(initialWizard);
  const [role, setRole] = useState<RoleId | null>(validQueryRole);
  const [githubConnected, setGithubConnected] = useState<boolean>(fastMode);
  const [editMode, setEditMode] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [birthday, setBirthday] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const prefillName = splitJapaneseName(MOCK_OAUTH_PROFILE.fullName);
  const [familyName, setFamilyName] = useState<string>(prefillName.familyName);
  const [givenName, setGivenName] = useState<string>(prefillName.givenName);
  const [email, setEmail] = useState<string>(MOCK_OAUTH_PROFILE.email);
  const [githubUrl, setGithubUrl] = useState<string>(MOCK_OAUTH_PROFILE.githubUrl);
  const [handle, setHandle] = useState<string>(MOCK_OAUTH_PROFILE.githubHandle);
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
        <p className="mt-0.5 text-sm text-slate-400">
          GitHub コードベース → Asset Ledger 登記 → First Royalty まで 7 ステップ
        </p>
        <p className="mt-1 text-[11px] text-slate-400 italic">
          あなたの知能を資産化する場所です。
        </p>
      </div>

      {phase === "form" && wizardStep === "github" && (
        <section
          data-testid="onboarding-step-a"
          className="section-card p-8 space-y-6 text-center"
          aria-labelledby="step-a-heading"
        >
          <div className="flex flex-col items-center gap-3">
            <span aria-hidden className="w-16 h-16 rounded-full bg-midnight-surface border border-cyan-400/30 flex items-center justify-center">
              <GitHubMark className="w-8 h-8 text-cyan-400" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              Step A — GitHub 連携
            </p>
            <h2 id="step-a-heading" className="text-2xl font-black text-white leading-tight">
              GitHub から始める
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              あなたのコードベースを Asset Ledger に登記します。
              読み取り専用で安全に解析されます。
            </p>
          </div>
          <button
            type="button"
            data-testid="onboarding-github-connect"
            aria-label="GitHub と連携する"
            onClick={() => {
              setGithubConnected(true);
              setWizardStep(validQueryRole ? "confirm" : "role");
            }}
            className="w-full inline-flex items-center justify-center gap-2 min-h-12 py-3 text-sm font-bold rounded-xl bg-cyan-400 text-text-on-primary hover:bg-cyan-300 active:scale-[0.99] focus:outline focus:outline-2 focus:outline-cyan-400"
          >
            <GitHubMark className="w-4 h-4 text-text-on-primary" />
            GitHub と連携する
          </button>
          <p className="text-[10px] text-slate-400">
            連携後、職種を選んで確認画面に進みます。
          </p>
        </section>
      )}

      {phase === "form" && wizardStep === "role" && (
        <section
          data-testid="onboarding-step-b"
          className="section-card p-6 space-y-5"
          aria-labelledby="step-b-heading"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              Step B — 職種選択
            </p>
            <h2 id="step-b-heading" className="text-xl font-black text-white leading-tight">
              あなたの職種を教えてください
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              タップで次の画面へ進みます。
            </p>
          </div>
          <div role="radiogroup" aria-label="職種選択" className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ROLE_TILES.map((t) => {
              const selected = role === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-testid={`role-tile-${t.id}`}
                  onClick={() => {
                    setRole(t.id);
                    setWizardStep("confirm");
                  }}
                  className={`group rounded-2xl border border-white/10 bg-midnight-surface p-5 text-left ring-1 ${
                    selected ? t.ring : "ring-transparent"
                  } hover:${t.ring} hover:ring-2 focus:outline focus:outline-2 focus:outline-cyan-400 transition-shadow`}
                >
                  <span aria-hidden className="text-3xl block">{t.emoji}</span>
                  <span className={`mt-2 block text-base font-bold ${t.accent}`}>{t.label}</span>
                  <span className="mt-1 block text-xs text-slate-400">{t.caption}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setWizardStep("github")}
            className="text-xs text-slate-400 underline-offset-4 hover:underline"
          >
            ← 戻る
          </button>
        </section>
      )}

      {phase === "form" && wizardStep === "confirm" && (
        <section
          className="section-card p-6 space-y-5"
          aria-labelledby="confirm-heading"
        >
          {/* Smart pre-fill summary — confirmation, not entry */}
          <header className="flex items-start gap-4">
            <span aria-hidden className="shrink-0">
              <svg width="64" height="64" viewBox="0 0 100 100" aria-hidden>
                <polygon
                  points="50,4 92,27 92,73 50,96 8,73 8,27"
                  fill="#162035"
                  stroke="#22D3EE"
                  strokeWidth={2}
                />
                <text
                  x="50"
                  y="55"
                  textAnchor="middle"
                  fontFamily="inherit"
                  fontWeight={900}
                  fontSize={32}
                  fill="#22D3EE"
                >
                  {familyName.slice(0, 1) || "G"}
                </text>
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--water-accent,#22D3EE)]">
                Smart Pre-fill — OAuth から取得した情報です
              </p>
              <h2 id="confirm-heading" className="text-base font-black text-[var(--water-text,#E2E8F0)]">
                内容を確認してください
              </h2>
            </div>
            {!editMode ? (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="shrink-0 text-xs text-cyan-400 underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-cyan-400 rounded"
                aria-label="プリフィル内容を編集する"
              >
                編集する
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="shrink-0 text-xs text-slate-400 underline-offset-4 hover:underline hover:text-white focus:outline focus:outline-2 focus:outline-cyan-400 rounded"
              >
                キャンセル
              </button>
            )}
          </header>

          {!editMode ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-slate-400 text-xs uppercase tracking-wide">姓</dt>
                <dd className="mt-1 flex items-center gap-1.5">
                  <span className="text-white font-semibold text-base">{familyName || "—"}</span>
                  <Check aria-hidden className="w-3.5 h-3.5 stroke-cyan-400" />
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 text-xs uppercase tracking-wide">名</dt>
                <dd className="mt-1 flex items-center gap-1.5">
                  <span className="text-white font-semibold text-base">{givenName || "—"}</span>
                  <Check aria-hidden className="w-3.5 h-3.5 stroke-cyan-400" />
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400 text-xs uppercase tracking-wide">メールアドレス</dt>
                <dd className="mt-1 flex items-center gap-1.5 min-w-0">
                  <span className="text-white font-semibold text-base truncate">{email || "—"}</span>
                  <Check aria-hidden className="w-3.5 h-3.5 stroke-cyan-400 shrink-0" />
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400 text-xs uppercase tracking-wide">GitHub ハンドル</dt>
                <dd className="mt-1 flex items-center gap-1.5">
                  <span className="text-white font-semibold text-base font-mono">@{handle || "—"}</span>
                  <Check aria-hidden className="w-3.5 h-3.5 stroke-cyan-400" />
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400 text-xs uppercase tracking-wide">GitHub コードベース URL</dt>
                <dd className="mt-1 flex items-center gap-1.5 min-w-0">
                  <span className="text-white font-semibold text-sm font-mono truncate">{githubUrl || "—"}</span>
                  <Check aria-hidden className="w-3.5 h-3.5 stroke-cyan-400 shrink-0" />
                </dd>
              </div>
            </dl>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="family-name" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--water-muted,#94A3B8)] mb-1">
                    姓
                  </label>
                  <input
                    id="family-name"
                    type="text"
                    defaultValue={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--water-surface-2,#1E293B)] border border-[var(--water-divider,rgba(226,232,240,0.10))] text-[var(--water-text,#E2E8F0)] focus:outline-none focus:ring-1 focus:ring-[var(--water-accent,#22D3EE)]"
                  />
                </div>
                <div>
                  <label htmlFor="given-name" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--water-muted,#94A3B8)] mb-1">
                    名
                  </label>
                  <input
                    id="given-name"
                    type="text"
                    defaultValue={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--water-surface-2,#1E293B)] border border-[var(--water-divider,rgba(226,232,240,0.10))] text-[var(--water-text,#E2E8F0)] focus:outline-none focus:ring-1 focus:ring-[var(--water-accent,#22D3EE)]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--water-muted,#94A3B8)] mb-1">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  defaultValue={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--water-surface-2,#1E293B)] border border-[var(--water-divider,rgba(226,232,240,0.10))] text-[var(--water-text,#E2E8F0)] focus:outline-none focus:ring-1 focus:ring-[var(--water-accent,#22D3EE)]"
                />
              </div>

              <div>
                <label htmlFor="handle" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--water-muted,#94A3B8)] mb-1">
                  GitHub ハンドル
                </label>
                <input
                  id="handle"
                  type="text"
                  defaultValue={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--water-surface-2,#1E293B)] border border-[var(--water-divider,rgba(226,232,240,0.10))] text-[var(--water-text,#E2E8F0)] focus:outline-none focus:ring-1 focus:ring-[var(--water-accent,#22D3EE)]"
                />
              </div>

              <div>
                <label htmlFor="github-url" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--water-muted,#94A3B8)] mb-1">
                  GitHub コードベース URL
                </label>
                <input
                  id="github-url"
                  type="url"
                  defaultValue={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--water-surface-2,#1E293B)] border border-[var(--water-divider,rgba(226,232,240,0.10))] text-[var(--water-text,#E2E8F0)] placeholder-[var(--water-muted,#94A3B8)] focus:outline-none focus:ring-1 focus:ring-[var(--water-accent,#22D3EE)]"
                />
              </div>
            </div>
          )}

          {/* Optional profile fields — birthday + address. Default skipped. */}
          <div
            data-testid="onboarding-optional-fields"
            className="rounded-xl border border-white/5 bg-midnight-base p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  任意項目（生年・住所）
                </p>
                <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                  登記には不要です。<span className="text-cyan-400">後で /profile でも編集できます</span>。
                </p>
              </div>
              {!showOptional && (
                <button
                  type="button"
                  data-testid="onboarding-later-skip"
                  onClick={() => setShowOptional(false)}
                  className="shrink-0 inline-flex items-center justify-center min-h-11 px-4 rounded-full text-cyan-400 ring-1 ring-cyan-400/30 hover:bg-cyan-400/10 text-xs font-bold"
                >
                  後で設定する →
                </button>
              )}
            </div>
            {!showOptional ? (
              <button
                type="button"
                onClick={() => setShowOptional(true)}
                className="text-[11px] text-slate-400 underline-offset-4 hover:underline hover:text-white"
              >
                + いま入力する
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="birthday" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    生年
                  </label>
                  <input
                    id="birthday"
                    type="text"
                    inputMode="numeric"
                    placeholder="1990"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-midnight-surface border border-white/10 text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    住所（任意）
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="東京都"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-midnight-surface border border-white/10 text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowOptional(false)}
                  className="text-[11px] text-slate-400 underline-offset-4 hover:underline hover:text-white"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>

          <p className="text-[10px] text-[var(--water-muted,#94A3B8)] leading-relaxed">
            修正があれば「編集する」を押してください。登記の前に
            <Link href="/legal/terms" className="text-[var(--water-accent,#22D3EE)] underline mx-0.5">利用規約</Link>
            と
            <Link href="/legal/transfer" className="text-[var(--water-accent,#22D3EE)] underline mx-0.5">権利譲渡条件</Link>
            に同意してください。あとで /profile でも編集できます。
          </p>

          <label className="flex items-start gap-2 text-[11px] text-[var(--water-text,#E2E8F0)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-midnight-surface accent-cyan-400 focus:outline focus:outline-2 focus:outline-cyan-400"
            />
            <span>
              利用規約と権利譲渡条件に同意します
            </span>
          </label>

          <button
            onClick={runOnboarding}
            disabled={!agreed || !githubUrl.startsWith("https://github.com/")}
            className="w-full min-h-11 py-3 text-sm font-bold rounded-xl bg-[var(--water-accent,#22D3EE)] text-[var(--water-bg,#0B1121)] disabled:opacity-40 disabled:cursor-not-allowed shadow-water-glow"
          >
            確認して進む — 登記（Sync）開始
          </button>
        </section>
      )}

      {phase === "running" && (
        <section aria-live="polite" role="status">
          <TimerBar elapsedMs={elapsedMs} achieved={false} />

          {/* Static hexagon strip — shows progress at a glance */}
          <HexagonSteps
            total={EXPRESS_STEPS.length}
            currentIdx={Math.min(currentStepIdx, EXPRESS_STEPS.length - 1)}
            labels={EXPRESS_STEPS.map(s => s.label)}
            size={48}
          />

          <ol className="mt-4 space-y-2">
            {EXPRESS_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;
              return (
                <li
                  key={step.id}
                  aria-current={isActive ? "step" : undefined}
                  className={
                    isDone
                      ? "flex items-center gap-3 p-3 rounded-lg bg-emerald-600/10 border-l-4 border-ai-action"
                      : isActive
                      ? "flex items-center gap-3 p-3 rounded-lg bg-midnight-surface border-l-4 border-ai-action"
                      : "flex items-center gap-3 p-3 rounded-lg bg-midnight-base border-l-4 border-transparent opacity-60"
                  }
                >
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                    {isDone ? (
                      <span className="text-ai-action">✓</span>
                    ) : isActive ? (
                      <span className="text-ai-action">●</span>
                    ) : (
                      <span className="text-slate-400">{idx + 1}</span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary leading-none">
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
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
                <dt className="text-xs text-[var(--n-muted,#6B6456)]">おしごと窓口</dt>
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
