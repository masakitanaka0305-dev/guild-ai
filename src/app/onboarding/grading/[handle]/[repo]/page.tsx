"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Onboarding 鑑定中 — static 3-second wait between GitHub Sync and the
 * draft surface. Pure framing: no real work happens here, but the
 * pause sets the tone before the rank Reveal lands on the next screen.
 *
 *   /onboarding/grading/[handle]/[repo]
 *      → /onboarding/draft/[handle]/[repo]?reveal=1
 */
export default function GradingWaitPage({
  params,
}: {
  params: { handle: string; repo: string };
}) {
  const router = useRouter();

  useEffect(() => {
    const handle = encodeURIComponent(params.handle);
    const repo = encodeURIComponent(params.repo);
    const t = setTimeout(() => {
      router.replace(`/onboarding/draft/${handle}/${repo}?reveal=1`);
    }, 3000);
    return () => clearTimeout(t);
  }, [router, params.handle, params.repo]);

  return (
    <main
      data-testid="grading-wait"
      className="bg-[#0B1121] text-white min-h-screen min-h-dvh flex items-center justify-center px-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center gap-3 max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          鑑定中...
        </h1>
        <p className="text-slate-400 text-sm">
          Analyzing your Intelligence
        </p>
        {/* Static three-dot indicator — no animation. The dots simply
            communicate "in progress" and the page replaces itself in 3s. */}
        <div
          aria-hidden
          className="mt-3 flex items-center gap-2"
          data-testid="grading-static-dots"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/30" />
        </div>
      </div>
    </main>
  );
}
