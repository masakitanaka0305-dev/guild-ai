"use client";

import { Hexagon } from "@/components/ui/Hexagon";

interface StepCardProps {
  step: 1 | 2 | 3;
  title: string;
  subtitle: string;
}

/**
 * Intelligence Deck — single roadmap card.
 * Hexagon-anchored, static, no animation. Pure layout primitive.
 */
export function StepCard({ step, title, subtitle }: StepCardProps) {
  return (
    <li
      data-testid={`deck-step-${step}`}
      className="rounded-2xl border border-white/10 bg-midnight-surface p-6 flex flex-col items-center text-center"
    >
      <span className="self-start text-xs font-bold uppercase tracking-widest text-cyan-400">
        STEP {step}
      </span>
      <Hexagon size={56} stroke="#22D3EE" fill="#0B1121" strokeWidth={2}>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontFamily="inherit"
          fontWeight={900}
          fontSize="36"
          fill="#22D3EE"
        >
          {step}
        </text>
      </Hexagon>
      <h2 className="mt-3 text-white font-semibold text-base sm:text-lg">
        {title}
      </h2>
      <p className="mt-1 text-slate-300 text-sm leading-relaxed">
        {subtitle}
      </p>
    </li>
  );
}
