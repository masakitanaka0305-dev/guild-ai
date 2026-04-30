import Link from "next/link";
import { MOCK_PROJECTS } from "@/lib/projects";
import { computeMatchingScore, getDemoOwnedMds } from "@/lib/matching";

export const metadata = { title: "Projects | GUILD AI" };

export default function ProjectsPage() {
  const demoMds = getDemoOwnedMds("demo-user");
  const rows = MOCK_PROJECTS.map(p => ({
    ...p,
    matchScore: Math.round(computeMatchingScore(demoMds, p).score),
  })).sort((a, b) => b.matchScore - a.matchScore);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold tracking-tight text-white mb-4">Projects</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-700 text-[#E2E8F0] text-xs uppercase">
              <th className="pb-3 pr-4">Title</th>
              <th className="pb-3 pr-4">Industry</th>
              <th className="pb-3 pr-4">Match</th>
              <th className="pb-3 pr-4">Reward</th>
              <th className="pb-3 pr-4">Deadline</th>
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
                      <span className="text-[10px] text-[#22D3EE] font-bold uppercase">Recommended</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-[#E2E8F0] text-xs">{row.industry}</td>
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
                      className="px-4 py-1.5 bg-[#22D3EE] text-[#0B1121] text-xs font-bold rounded-full min-h-[44px] inline-flex items-center hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-cyan-400"
                    >
                      Apply
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
