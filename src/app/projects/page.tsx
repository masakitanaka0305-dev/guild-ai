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
      <h1 className="text-xl font-bold text-slate-100 mb-4">Projects</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
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
                  className={`border-b border-slate-800 hover:bg-slate-900 ${isRecommended ? "border-l-4 border-l-cyan-500" : "border-l-4 border-l-transparent"}`}
                >
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-100">{row.title}</p>
                    {isRecommended && (
                      <span className="text-[10px] text-cyan-400 font-bold uppercase">Recommended</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{row.industry}</td>
                  <td className="py-3 pr-4">
                    <span className={`font-bold tabular-nums ${isRecommended ? "text-cyan-400" : "text-slate-300"}`}>
                      {row.matchScore}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-300 tabular-nums">
                    ¥{row.grossRewardJpy.toLocaleString("ja-JP")}
                  </td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{row.deadline}</td>
                  <td className="py-3">
                    <Link
                      href={`/projects/${row.id}`}
                      className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-md hover:bg-cyan-400 min-h-[44px] inline-flex items-center"
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
