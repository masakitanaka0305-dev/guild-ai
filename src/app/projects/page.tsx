import Link from "next/link";
import { ListChecks } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/projects";
import { computeMatchingScore, getDemoOwnedMds } from "@/lib/matching";

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
          className="text-white font-semibold text-2xl tracking-tight"
        >
          みんなの お困りごと
        </h1>
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline-offset-4 hover:underline"
        >
          <ListChecks className="w-4 h-4 stroke-cyan-400" aria-hidden />
          参加状況を見る →
        </Link>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        企業の困りごとに、あなたの知恵のカードを貸してみませんか？
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-700 text-[#E2E8F0] text-xs uppercase">
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
                  className={`border-b border-slate-800 hover:bg-slate-900 ${isRecommended ? "border-l-4 border-l-[#22D3EE]" : "border-l-4 border-l-transparent"}`}
                >
                  <td className="py-3 pr-4">
                    <p className="font-medium text-white">{row.title}</p>
                    {isRecommended && (
                      <span className="text-[10px] text-[#22D3EE] font-bold uppercase">おすすめ</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-[#E2E8F0] text-xs">{friendlyIndustry(row.industry)}</td>
                  <td className="py-3 pr-4">
                    <span className="font-semibold tabular-nums text-[#22D3EE]">
                      {row.matchScore}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[#E2E8F0] tabular-nums">
                    ¥{row.grossRewardJpy.toLocaleString("ja-JP")}
                  </td>
                  <td className="py-3 pr-4 text-[#E2E8F0] text-xs">{row.deadline}</td>
                  <td className="py-3">
                    <Link
                      href={`/projects/${row.id}`}
                      aria-label="この困りごとの中身を見る"
                      className="px-4 py-1.5 bg-[#22D3EE] text-[#0B1121] text-xs font-bold rounded-full min-h-[44px] inline-flex items-center hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-cyan-400"
                    >
                      中身を見る
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
