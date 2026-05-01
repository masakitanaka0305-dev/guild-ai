"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScanSearch, Target, Gem, Lock } from "lucide-react";
import { HexagonSteps } from "@/components/ui/HexagonSteps";
import { MINT_STEPS, MINT_IMPORTS } from "@/lib/mint-pipeline";
import { rankCardCta } from "@/lib/proof-of-make";
import { TAP_CLASS, useRipple } from "@/lib/motion";
import { useTactile } from "@/hooks/useTactile";
import { CinematicMint } from "@/components/mint/CinematicMint";
import type { Rank } from "@/types";

// Per-rank demo valuations. The actual rank reveal is parameterised
// via `?rank=A|S|B|D`; `?demo=1` skips the importer + pipeline beats
// so anyone can preview the four-phase reveal in one step.
const RANK_VALUATIONS: Record<Rank, number> = {
  S: 248_400,
  A: 124_800,
  B:  62_400,
  D:  18_200,
};

function isRank(v: string | null): v is Rank {
  return v === "S" || v === "A" || v === "B" || v === "D";
}

const ICON_MAP = {
  ScanSearch,
  Target,
  Gem,
  Lock,
} as const;

// Default rank when no `?rank=` query is present. Production will read
// the rank from grading; this constant is only the demo fallback.
const DEFAULT_RANK: Rank = "A";

export default function MintPage() {
  return (
    <Suspense fallback={null}>
      <MintPageInner />
    </Suspense>
  );
}

function MintPageInner() {
  const params = useSearchParams();
  const rankParam = params?.get("rank") ?? null;
  const demoParam = params?.get("demo") === "1";
  const rank: Rank = isRank(rankParam) ? rankParam : DEFAULT_RANK;
  const valuationJpy = RANK_VALUATIONS[rank];

  // 3 importers select → step 0..3 → completion (4)
  // `?demo=1` jumps straight to the cinematic reveal so QA / preview
  // links don't need to walk the pipeline.
  const [imported, setImported] = useState(demoParam);
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(demoParam);
  const tap = useTactile("coin");
  const ripple = useRipple();

  // Honor `?demo=1` even when the URL changes after mount.
  useEffect(() => {
    if (demoParam) {
      setImported(true);
      setDone(true);
    }
  }, [demoParam]);

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
              {stepIdx < MINT_STEPS.length - 1 ? "次のステップ" : rankCardCta(rank)}
              {ripple.ripples}
            </button>
          </div>
        </section>
      )}

      {done && (
        <section
          data-testid="mint-complete"
          aria-labelledby="mint-complete-h"
          className="space-y-3"
        >
          <h2 id="mint-complete-h" className="sr-only">
            鑑定結果
          </h2>
          <CinematicMint rank={rank} valuationJpy={valuationJpy} />
          <button
            type="button"
            onClick={reset}
            className="block mx-auto rounded-full px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5"
          >
            もう一枚 出品する
          </button>
        </section>
      )}
    </main>
  );
}
