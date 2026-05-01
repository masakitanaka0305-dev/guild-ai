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
      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 flex flex-col items-center text-center"
    >
      <span
        data-testid="deck-step-label"
        className="self-start text-xs font-bold uppercase tracking-widest text-brand-primary"
      >
        STEP {step}
      </span>
      <Hexagon size={56} stroke="#6D28D9" fill="#4C1D95" strokeWidth={2}>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontFamily="inherit"
          fontWeight={900}
          fontSize="36"
          fill="#FFFFFF"
        >
          {step}
        </text>
      </Hexagon>
      <h2 className="mt-3 font-semibold text-base sm:text-lg text-[var(--color-text-primary)]">
        {title}
      </h2>
      <p
        data-testid="deck-step-subtitle"
        className="mt-1 font-medium text-base leading-relaxed text-[var(--color-text-muted)]"
      >
        {subtitle}
      </p>
    </li>
  );
}
