import { getReports } from "@/lib/emergency-report";

export default function AdminReportsPage() {
  const reports = getReports();

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--n-text,#1A1714)]">不適切レポート管理</h1>
          <p className="text-xs text-[var(--n-muted,#6B6456)] mt-0.5">未処理: {reports.filter((r) => r.status === "pending").length} 件</p>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[var(--primary,#6366F1)] text-white">管理者専用</span>
      </div>

      {reports.length === 0 ? (
        <div className="section-card p-8 text-center">
          <p className="text-sm text-[var(--n-muted,#6B6456)]">レポートはまだありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="section-card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono text-[var(--n-muted,#6B6456)]">{r.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.reason === "Illegal" ? "bg-red-100 text-red-700" :
                    r.reason === "Plagiarism" ? "bg-amber-100 text-amber-700" :
                    r.reason === "Spam" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-slate-400"
                  }`}>
                    {r.reason}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    r.status === "pending" ? "bg-red-50 text-red-600 border border-red-200" :
                    r.status === "reviewed" ? "bg-amber-50 text-amber-600" :
                    "bg-gray-50 text-slate-400"
                  }`}>
                    {r.status === "pending" ? "未処理" : r.status === "reviewed" ? "確認済" : "却下"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--n-text,#1A1714)] mb-0.5">
                  対象: <span className="font-mono">{r.guildId}</span>
                </p>
                <p className="text-xs text-[var(--n-muted,#6B6456)] line-clamp-2">{r.description || "（説明なし）"}</p>
                <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-1">
                  報告者: {r.reporterHandle} · {r.reportedAt.slice(0, 10)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
