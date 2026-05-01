"use client";

import Link from "next/link";

/**
 * Intelligence Deck — primary hero CTA.
 *
 * - Cyan-glow ring (static — no animation per Water Guild rule)
 * - Routes to /onboarding/repos (GitHub-connect surface)
 * - Caption "= 知能の資産化を開始する" lives outside the button
 */
export function HeroButton() {
  return (
    <Link
      href="/onboarding/repos"
      data-testid="deck-hero-button"
      aria-label="自分の知能を登記する"
      className="inline-flex items-center justify-center rounded-full bg-brand-primary text-text-on-primary font-semibold h-14 w-full md:h-16 md:max-w-md mx-auto px-6 text-base shadow-[0_0_0_2px_rgba(99,102,241,0.5),0_0_28px_rgba(99,102,241,0.35)] focus:outline focus:outline-2 focus:outline-brand-primary"
    >
      自分の知能を登記する
    </Link>
  );
}
