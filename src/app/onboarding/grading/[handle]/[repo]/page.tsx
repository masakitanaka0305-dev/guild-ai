"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CinematicMint } from "@/components/mint/CinematicMint";
import type { Rank } from "@/types";

/**
 * Onboarding 鑑定中 — Cinematic Mint reveal (#128).
 *
 * The page mounts <CinematicMint> which carries the four-phase
 * progression (matrix → crystal → curtain → glow). A "次へ" link to
 * the draft page is exposed once the reveal has settled, but the
 * cinematic component itself owns the timing and reduced-motion path.
 *
 *   /onboarding/grading/[handle]/[repo]
 *      → /onboarding/draft/[handle]/[repo]?reveal=1
 */

// Demo: this surface fakes an S-rank reveal with a deterministic
// valuation. In production both come from the grading service.
const DEMO_RANK: Rank = "S";
const DEMO_VALUATION_JPY = 248_400;

export default function GradingWaitPage({
  params,
}: {
  params: { handle: string; repo: string };
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);

  const handle = encodeURIComponent(params.handle);
  const repo = encodeURIComponent(params.repo);
  const continueHref = `/onboarding/draft/${handle}/${repo}?reveal=1`;

  return (
    <main
      data-testid="grading-wait"
      className="bg-midnight-base text-white min-h-screen min-h-dvh flex items-center justify-center px-4 sm:px-6 py-10"
    >
      <div className="w-full max-w-2xl">
        <CinematicMint
          rank={DEMO_RANK}
          valuationJpy={DEMO_VALUATION_JPY}
          onReveal={() => {
            setRevealed(true);
          }}
        />
        {revealed && (
          <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
            続けて、ノートの編集に進めます。{" "}
            <button
              type="button"
              onClick={() => router.push(continueHref)}
              className="text-[var(--color-link)] underline-offset-4 hover:underline"
            >
              ノートを編集する →
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
