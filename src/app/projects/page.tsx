import Link from "next/link";
import { ListChecks } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/projects";
import { computeMatchingScore, getDemoOwnedMds } from "@/lib/matching";
import { TAP_CLASS } from "@/lib/motion";

export const metadata = { title: "みんなの お困りごと | ギルドAI" };

// Friendly-tone display labels for the existing industry tags.
const FRIENDLY_INDUSTRY: Record<string, string> = {
  "金融・インフラ":         "データの仕組みを直したい",
  "EC・Retail":             "仕事に AI を入れたい",
  "エンタープライズ・HR":   "サービスの信頼性を上げたい",
  "公共・行政":             "新しいサービスを始めたい",
  "ヘルスケア":             "ルール対応を片付けたい",
};

function friendlyIndustry(raw: string): string {
  return FRIENDLY_INDUSTRY[raw] ?? raw;
}

/**
 * Returns a friendly relative-deadline string ("あと N 日") computed
 * deterministically from the project's `YYYY-MM-DD` deadline. Uses a
 * fixed reference date so SSR / tests stay stable; in production we'd
 * thread `Date.now()`.
 */
function relativeDeadline(deadline: string, today = new Date("2026-05-09T00:00:00.000Z")): string {
  const due = new Date(`${deadline}T00:00:00.000Z`).getTime();
  const diffDays = Math.round((due - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return "締切を過ぎました";
  if (diffDays === 0) return "今日まで";
  if (diffDays === 1) return "あと 1 日";
  return `あと ${diffDays} 日`;
}

export default function ProjectsPage() {
  const demoMds = getDemoOwnedMds("demo-user");
  const rows = MOCK_PROJECTS.map(p => ({
    ...p,
    matchScore: Math.round(computeMatchingScore(demoMds, p).score),
  })).sort((a, b) => b.matchScore - a.matchScore);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1
          data-testid="projects-h1"
          className="text-[var(--color-text-primary)] font-semibold text-2xl tracking-tight"
        >
          みんなの お困りごと
        </h1>
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ai-action)] underline-offset-4 hover:underline"
        >
          <ListChecks className="w-4 h-4 stroke-[var(--color-ai-action)]" aria-hidden />
          参加状況を見る →
        </Link>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        企業の困りごとに、あなたの知恵のカードを貸してみませんか？
      </p>

      {/* Mobile: Mercari-style 2-column card grid */}
      <ul
        data-testid="projects-mobile-grid"
        aria-label="お困りごと一覧"
        className="md:hidden grid grid-cols-2 gap-3"
      >
        {rows.map((row) => {
          const isRecommended = row.matchScore >= 80;
          return (
            <li
              key={row.id}
              data-testid="project-card-mobile"
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2238] p-3 flex flex-col gap-2 min-w-[160px] shadow-sm"
            >
              <p className="font-semibold text-[var(--color-text-primary)] text-sm leading-snug line-clamp-2 min-h-[2.6em]">
                {row.title}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                {friendlyIndustry(row.industry)}
              </p>
              <p
                data-testid="project-card-reward"
                className="font-bold tracking-tight tabular-nums text-[#A16207] dark:text-[#F59E0B] flex items-baseline gap-1 leading-none"
              >
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] mr-0.5 self-center">
                  想定お礼
                </span>
                <span data-testid="project-card-yen-mark" className="text-[1.4em] font-extrabold leading-none">¥</span>
                <span className="text-base">{row.grossRewardJpy.toLocaleString("ja-JP")}</span>
              </p>
              <div className="flex items-center justify-between text-[11px] tabular-nums">
                <span
                  data-testid="project-card-deadline"
                  className="font-medium text-[var(--color-text-primary)] dark:text-[#F1F5F9]"
                >
                  {relativeDeadline(row.deadline)}
                </span>
                <span className="font-semibold text-brand-primary">
                  マッチ {row.matchScore}%
                </span>
              </div>
              <Link
                href={`/projects/${row.id}`}
                aria-label="この困りごとを助ける"
                className={`mt-1 inline-flex items-center justify-center min-h-[40px] rounded-full bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover focus:outline focus:outline-2 focus:outline-brand-primary ${TAP_CLASS}`}
              >
                {isRecommended ? "🌟 この困りごとを助ける" : "この困りごとを助ける"}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: keep the table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] text-xs uppercase">
              <th className="pb-3 pr-4">困りごと</th>
              <th className="pb-3 pr-4">分野</th>
              <th className="pb-3 pr-4">マッチ度</th>
              <th className="pb-3 pr-4">想定お礼</th>
              <th className="pb-3 pr-4">締切</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isRecommended = row.matchScore >= 80;
              return (
                <tr
                  key={row.id}
                  className={`border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] ${isRecommended ? "border-l-4 border-l-brand-primary" : "border-l-4 border-l-transparent"}`}
                >
                  <td className="py-3 pr-4">
                    <p className="font-medium text-[var(--color-text-primary)]">{row.title}</p>
                    {isRecommended && (
                      <span className="text-[10px] text-brand-primary font-bold uppercase">おすすめ</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-[var(--color-text-muted)] text-xs">{friendlyIndustry(row.industry)}</td>
                  <td className="py-3 pr-4">
                    <span className="font-semibold tabular-nums text-brand-primary">
                      {row.matchScore}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    <span className="font-bold text-[#A16207] dark:text-[#F59E0B] inline-flex items-baseline gap-0.5">
                      <span className="text-[1.4em] font-extrabold">¥</span>
                      <span>{row.grossRewardJpy.toLocaleString("ja-JP")}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[var(--color-text-primary)] text-xs tabular-nums font-medium">
                    {relativeDeadline(row.deadline)}
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/projects/${row.id}`}
                      aria-label="この困りごとを助ける"
                      className={`px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-full min-h-[44px] inline-flex items-center hover:bg-brand-primary-hover outline-none focus:outline focus:outline-2 focus:outline-brand-primary ${TAP_CLASS}`}
                    >
                      この困りごとを助ける
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
