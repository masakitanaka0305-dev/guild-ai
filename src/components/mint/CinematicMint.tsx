"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HexRankBadge } from "@/components/ui/HexRankBadge";
import { TAP_CLASS } from "@/lib/motion";
import type { Rank } from "@/types";

/**
 * Cinematic Mint (#128) — four-phase reveal for the
 * /onboarding/grading/[handle]/[repo] surface.
 *
 *   Phase 1 — 加速 (1400ms): matrix-style 知恵キーワード drift
 *   Phase 2 — 飽和 (1400ms): crystal at center, purple particles orbit
 *   Phase 3 — 静謐の間 (800ms): screen settles to abyss, single gold line
 *   Phase 4 — 啓示 (1000ms): radial gold glow, rank card + 資産価値 rises
 *
 * Total ≈ 4.6s (or 0.5s with prefers-reduced-motion: reduce — Phase 4 only).
 *
 * The "curtain" Phase 3 is intentionally calm. There is no error icon,
 * no red flash, no "crash" cosplay — only a quiet abyss + a single
 * thin gold line, and `aria-live="polite"` announcing 「準備中…」 once.
 */
export interface CinematicMintProps {
  rank: Rank;
  valuationJpy: number;
  /** Optional handler so the host page can keep a state hook (e.g. mark
   *  the journey complete). Fired right before Phase 4 mounts. */
  onReveal?: () => void;
}

const PHASE_TIMINGS = {
  phase1: 1400,
  phase2: 1400,
  phase3: 800,
  phase4: 1000,
} as const;

const REDUCED_TIMING = 500;

/**
 * Decorative tokens that drift across Phase 1. They are pure visual
 * filler — never error / negative copy.
 */
const MATRIX_TOKENS = [
  "観測",  "context",  "0xC4F1",  "λ",
  "型推論", "OpenAPI",  "RAG",     "命題",
  "review", "trace",    "意図",    "意思",
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const fn = () => setReduced(m.matches);
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function CinematicMint({ rank, valuationJpy, onReveal }: CinematicMintProps) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(reduced ? 4 : 1);

  useEffect(() => {
    if (reduced) {
      // Reduced-motion path: skip straight to the reveal after a short
      // settle so screen-readers announce the heading once. Total ≤ 0.5s.
      const t = window.setTimeout(() => {
        onReveal?.();
        setPhase(4);
      }, REDUCED_TIMING);
      return () => window.clearTimeout(t);
    }
    const t1 = window.setTimeout(() => setPhase(2), PHASE_TIMINGS.phase1);
    const t2 = window.setTimeout(() => setPhase(3), PHASE_TIMINGS.phase1 + PHASE_TIMINGS.phase2);
    const t3 = window.setTimeout(() => {
      onReveal?.();
      setPhase(4);
    }, PHASE_TIMINGS.phase1 + PHASE_TIMINGS.phase2 + PHASE_TIMINGS.phase3);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [reduced, onReveal]);

  return (
    <section
      data-testid="cinematic-mint"
      data-phase={phase}
      role="status"
      aria-live="polite"
      aria-label="知恵を結晶化しています"
      className="relative isolate flex items-center justify-center min-h-[480px] sm:min-h-[560px] rounded-3xl overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
    >
      {/* ── Phase 1 — 加速 (matrix drift) ─────────────────────────── */}
      {phase === 1 && (
        <div
          data-testid="cinematic-phase-1"
          aria-hidden
          className="absolute inset-0"
        >
          {MATRIX_TOKENS.map((token, i) => {
            const top = (i * 7 + 13) % 90;
            const left = (i * 11 + 5) % 92;
            const delay = (i * 90) % 1200;
            const dur = 600 + ((i * 73) % 300);
            return (
              <span
                key={`${token}-${i}`}
                className="absolute font-mono text-[10px] sm:text-xs text-[var(--color-action-primary)]/40 select-none motion-safe:animate-matrix-drift motion-reduce:hidden"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  animationDelay: `${delay}ms`,
                  animationDuration: `${dur}ms`,
                }}
              >
                {token}
              </span>
            );
          })}
          <p className="relative text-center font-semibold tracking-widest text-[var(--color-action-secondary)]/80">
            読みとり中
          </p>
        </div>
      )}

      {/* ── Phase 2 — 飽和 (crystal saturation) ───────────────────── */}
      {phase === 2 && (
        <div
          data-testid="cinematic-phase-2"
          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
        >
          <div className="relative w-32 h-32">
            <svg
              data-testid="cinematic-crystal"
              viewBox="0 0 100 100"
              className="absolute inset-0 motion-safe:animate-crystal-spin"
              aria-hidden
            >
              {[0, 18, 36].map((rot) => (
                <polygon
                  key={rot}
                  points="50,8 88,30 88,70 50,92 12,70 12,30"
                  fill="none"
                  stroke="#F59E0B"
                  strokeOpacity={0.5 + (60 - rot) / 200}
                  strokeWidth="1.5"
                  transform={`rotate(${rot} 50 50)`}
                />
              ))}
              <circle cx="50" cy="50" r="6" fill="#F59E0B" opacity="0.7" />
            </svg>
            {/* Particle orbit */}
            {Array.from({ length: 8 }).map((_, i) => {
              const start = (i * 360) / 8;
              return (
                <span
                  key={`particle-${i}`}
                  aria-hidden
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-action-primary)]/70 motion-safe:animate-particle-orbit motion-reduce:hidden"
                  style={{
                    transform: `rotate(${start}deg) translateX(64px)`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              );
            })}
          </div>
          <p className="text-sm font-semibold tracking-wider text-[var(--color-action-secondary)]">
            価値を結晶化中
          </p>
        </div>
      )}

      {/* ── Phase 3 — 静謐の間 (calm curtain) ─────────────────────── */}
      {phase === 3 && (
        <div
          data-testid="cinematic-phase-3"
          aria-hidden="false"
          className="absolute inset-0 bg-[var(--color-bg-base)] motion-safe:animate-curtain-fade flex items-center justify-center"
        >
          {/* A single, calm gold line — the "curtain" metaphor.
              Reduced-motion path skips this element so screen-readers
              don't get a phantom delay. */}
          <span
            data-testid="cinematic-curtain-line"
            aria-hidden
            className="block w-32 h-px bg-[var(--color-action-secondary)]/70 motion-reduce:hidden"
          />
          <span className="sr-only">準備中…</span>
        </div>
      )}

      {/* ── Phase 4 — 啓示 (reveal) ───────────────────────────────── */}
      {phase === 4 && (
        <div
          data-testid="cinematic-phase-4"
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
        >
          {/* Radial gold glow rising from the abyss */}
          <span
            aria-hidden
            data-testid="cinematic-gold-glow"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full motion-safe:animate-gold-glow"
            style={{
              background:
                "radial-gradient(closest-side, rgba(245,158,11,0.42), rgba(245,158,11,0.0))",
            }}
          />

          <div
            data-testid="cinematic-reveal-card"
            data-rank={rank}
            className={`relative z-10 motion-safe:animate-hero-rise inline-flex flex-col items-center gap-4 rounded-3xl px-7 py-8 ring-1 ring-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/85 backdrop-blur-sm shadow-brand-glow ${rankGlowShadow(rank)}`}
          >
            <HexRankBadge rank={rank} size={80} showSubLabel glow />

            <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--color-text-muted)]">
              資産価値
            </p>
            <p
              data-testid="cinematic-valuation"
              className="font-extrabold tabular-nums text-[var(--color-action-secondary)] text-5xl sm:text-6xl leading-none"
            >
              <span className="text-[1.4em] mr-0.5">¥</span>
              {valuationJpy.toLocaleString("ja-JP")}
            </p>
            <p className="text-sm text-slate-300">
              あなたの知恵が、銀行に届きました
            </p>

            <div className="mt-3 flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
              <Link
                href="/mint"
                className={`inline-flex items-center justify-center min-h-[44px] px-5 rounded-full text-sm font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] ${TAP_CLASS}`}
              >
                もう一度出品する
              </Link>
              <Link
                href="/guild"
                className={`inline-flex items-center justify-center min-h-[44px] px-5 rounded-full text-sm font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover ${TAP_CLASS}`}
              >
                マイ銀行で確認 →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/** Rank-coordinated glow ring — pure utility classes so the rank
 *  determines whether the reveal radiates gold / silver / bronze /
 *  slate, in addition to the universal shadow-brand-glow purple halo. */
function rankGlowShadow(rank: Rank): string {
  switch (rank) {
    case "S":
      return "shadow-brand-glow-gold ring-[var(--color-action-secondary)]/40";
    case "A":
      return "ring-[#94A3B8]/40";
    case "B":
      return "ring-[#B45309]/40";
    case "D":
    default:
      return "ring-[var(--color-border-subtle)]";
  }
}
