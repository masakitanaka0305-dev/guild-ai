"use client";

import Link from "next/link";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";
import { demoUserHistory } from "@/lib/achievements";

/**
 * /profile/achievements (#130) — the Achievement Wall.
 *
 * Demo data renders ~11 unlocks out of 30 so the surface looks like a
 * mid-journey state. In production the history snapshot comes from
 * the passbook + grading services.
 */
export default function AchievementsPage() {
  const history = demoUserHistory();
  const handle = "@demo-user";

  return (
    <main
      data-testid="achievements-page"
      className="bg-midnight-base text-white min-h-screen min-h-dvh px-4 sm:px-6 py-8 max-w-4xl mx-auto pb-24"
    >
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-white font-semibold text-2xl tracking-tight">
            アチーブメント
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            あなたの旅の足跡を、5 つの軸で集めています。
          </p>
        </div>
        <Link
          href="/profile"
          className="text-xs font-semibold text-[var(--color-link)] underline-offset-4 hover:underline"
        >
          ← プロフィールに戻る
        </Link>
      </header>

      <AchievementGrid history={history} handle={handle} />
    </main>
  );
}
