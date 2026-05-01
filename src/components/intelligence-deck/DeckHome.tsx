"use client";

import { StepCard } from "@/components/intelligence-deck/StepCard";
import { HeroButton } from "@/components/intelligence-deck/HeroButton";
import {
  DECK_STEPS,
  getRegisteredAgents,
  getRecentAgentsDelta24h,
  formatAgentCount,
} from "@/lib/intelligence-deck";

/**
 * Intelligence Deck — three-step onboarding home.
 *
 * Reusable across /intelligence-deck (public landing) and the
 * /onboarding entry surface when the visitor is anonymous.
 */
export function DeckHome() {
  const registered = getRegisteredAgents();
  const delta = getRecentAgentsDelta24h();

  return (
    <main className="bg-[#0B1121] text-white min-h-screen min-h-dvh flex flex-col">
      <h1 className="sr-only">自分の知能を登記する</h1>

      {/* Top bar */}
      <header className="flex items-start justify-between px-5 pt-6 sm:px-8 sm:pt-8">
        <span className="text-white font-semibold text-sm tracking-wide">GUILD AI</span>
        <div className="text-right">
          <p
            data-testid="deck-registered-count"
            className="text-cyan-400/80 text-xs tabular-nums font-mono"
          >
            登記済みエージェント数：{formatAgentCount(registered)} 体
          </p>
          <p className="mt-0.5 text-slate-400 text-[10px] tabular-nums">
            直近 24h で +{delta} 体
          </p>
        </div>
      </header>

      {/* Roadmap cards */}
      <section className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-8">
        <ol
          aria-label="知能を資産化する 3 ステップ"
          className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          {DECK_STEPS.map((s) => (
            <StepCard
              key={s.number}
              step={s.number}
              title={s.title}
              subtitle={s.subtitle}
            />
          ))}
        </ol>

        {/* Hero CTA */}
        <div className="w-full max-w-md mx-auto">
          <HeroButton />
          <p className="mt-3 text-center text-slate-400 text-xs">
            = 知能の資産化を開始する
          </p>
        </div>
      </section>
    </main>
  );
}
