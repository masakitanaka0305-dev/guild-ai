"use client";

import { useState } from "react";
import Link from "next/link";
import { ScanSearch, Target, Gem, Lock } from "lucide-react";
import { HexagonSteps } from "@/components/ui/HexagonSteps";
import { HexRankBadge } from "@/components/ui/HexRankBadge";
import { CrystalSvg } from "@/components/ui/CrystalSvg";
import { ShieldedBadge } from "@/components/ui/ShieldedBadge";
import { MINT_STEPS, MINT_IMPORTS } from "@/lib/mint-pipeline";
import { rankCardCta } from "@/lib/proof-of-make";
import { TAP_CLASS, useRipple } from "@/lib/motion";
import { useTactile } from "@/hooks/useTactile";
import type { Rank } from "@/types";

const ICON_MAP = {
  ScanSearch,
  Target,
  Gem,
  Lock,
} as const;

// Demo: completion screen always shows S rank in this surface. In
// production the rank would come from grading.
const DEMO_RANK: Rank = "S";

export default function MintPage() {
  // 3 importers select → step 0..3 → completion (4)
  const [imported, setImported] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const tap = useTactile("coin");
  const ripple = useRipple();

  function advance() {
    tap();
    if (stepIdx < MINT_STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      setDone(true);
    }
  }

  function chooseImport() {
    setImported(true);
    setStepIdx(0);
  }

  function reset() {
    setImported(false);
    setStepIdx(0);
    setDone(false);
  }

  return (
    <main className="bg-midnight-base text-white min-h-screen min-h-dvh px-5 sm:px-8 py-8 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-white font-semibold text-2xl tracking-tight">
          取っておきのメモを教えてください
        </h1>
        <p className="mt-2 text-slate-300 text-sm leading-relaxed">
          あなたのコツや工夫が、世界の AI に貸し出される <span className="text-brand-primary font-semibold">知恵のカード</span> に変わります。
        </p>
      </header>

      {!imported && !done && (
        <section
          data-testid="mint-importers"
          aria-labelledby="mint-importers-h"
          className="mb-8"
        >
          <h2 id="mint-importers-h" className="text-slate-300 text-sm mb-3">
            知恵の元を選ぶ
          </h2>
          <ul className="space-y-3">
            {MINT_IMPORTS.map((imp) => (
              <li key={imp.id}>
                <button
                  type="button"
                  data-testid={`mint-import-${imp.id}`}
                  onClick={chooseImport}
                  className="w-full text-left rounded-2xl border border-white/10 bg-midnight-surface hover:border-brand-primary/40 p-4 transition-colors"
                >
                  <p className="text-white font-semibold">{imp.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{imp.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {imported && !done && (
        <section
          data-testid="mint-pipeline"
          aria-labelledby="mint-pipeline-h"
          className="rounded-2xl border border-white/10 bg-midnight-surface border-l-4 border-l-brand-primary p-5 sm:p-6 mb-6"
        >
          <h2 id="mint-pipeline-h" className="text-white font-semibold text-base mb-3">
            知恵をかたちにします
          </h2>

          <HexagonSteps
            total={MINT_STEPS.length}
            currentIdx={stepIdx}
            labels={MINT_STEPS.map((s) => s.label)}
            size={48}
          />

          <ol className="mt-5 space-y-3">
            {MINT_STEPS.map((step, idx) => {
              const Icon = ICON_MAP[step.icon];
              const isDone = idx < stepIdx;
              const isActive = idx === stepIdx;
              return (
                <li
                  key={step.id}
                  aria-current={isActive ? "step" : undefined}
                  data-testid={`mint-step-${step.id}`}
                  className={`flex items-start gap-3 rounded-xl p-3 ${
                    isDone
                      ? "bg-emerald-500/10 border-l-4 border-emerald-400"
                      : isActive
                      ? "bg-brand-primary/10 border-l-4 border-brand-primary"
                      : "bg-midnight-base border-l-4 border-transparent opacity-70"
                  }`}
                >
                  <Icon
                    aria-hidden
                    className={`w-5 h-5 mt-0.5 shrink-0 ${
                      isDone ? "stroke-emerald-300" : isActive ? "stroke-brand-primary" : "stroke-slate-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {step.label}（{step.subtitle}）
                    </p>
                    <p className="mt-0.5 text-xs text-slate-300">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 flex gap-3 justify-end">
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5"
            >
              戻る
            </button>
            <button
              type="button"
              data-testid="mint-advance"
              onClick={advance}
              onPointerDown={ripple.onPointerDown}
              className={`relative overflow-hidden rounded-full bg-brand-primary text-white px-5 py-2 text-xs font-semibold hover:bg-brand-primary-hover ${TAP_CLASS}`}
            >
              {stepIdx < MINT_STEPS.length - 1 ? "次のステップ" : rankCardCta(DEMO_RANK)}
              {ripple.ripples}
            </button>
          </div>
        </section>
      )}

      {done && (
        <section
          data-testid="mint-complete"
          aria-labelledby="mint-complete-h"
          className="rounded-2xl border border-brand-primary/30 bg-midnight-surface p-6 text-center shadow-[0_0_0_1px_rgba(76,29,149,0.25),0_0_24px_rgba(76,29,149,0.18)]"
        >
          <CrystalSvg size={96} className="mx-auto mb-3" />
          <h2 id="mint-complete-h" className="text-white font-semibold text-xl">
            おめでとうございます！
          </h2>
          <p className="mt-2 text-slate-200 text-sm leading-relaxed">
            これは <span className="text-brand-primary font-semibold">仕事の場面</span> で役立つ、
            <span className="text-[#F59E0B] font-semibold"> 金</span> の太鼓判レベルの知恵ですね！
          </p>
          <div className="mt-4 flex flex-col items-center gap-3">
            <HexRankBadge rank="S" size={64} showSubLabel />
            <ShieldedBadge />
          </div>
          <p className="mt-4 text-slate-400 text-xs leading-relaxed max-w-prose mx-auto">
            世界中の AI が、あなたの代わりにこの知恵を使って働きます。使われた分のお礼が
            <span className="text-brand-primary">マイページ — もちもの</span>に届きます。
          </p>
          <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5"
            >
              もう一枚 出品する
            </button>
            <Link
              href="/guild"
              className="rounded-full bg-brand-primary text-text-on-primary px-5 py-2 text-xs font-bold hover:bg-brand-primary text-center"
            >
              もちものを見る →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
