"use client";
import { useState, useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";

const STATUS_STEPS = ["受付", "AI鑑定中", "クライアント確認中"] as const;
type Status = typeof STATUS_STEPS[number];

const STATUS_COLOR: Record<Status, string> = {
  "受付": "bg-slate-400",
  "AI鑑定中": "bg-cyan-500",
  "クライアント確認中": "bg-amber-500",
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    // In real mode would fetch /api/applications
    // For now use sessionStorage-backed mock
    const stored = sessionStorage.getItem("applications") || "[]";
    setApps(JSON.parse(stored));
  }, []);

  // Demo data if empty
  const displayApps = apps.length > 0 ? apps : [
    { id: "demo_1", projectTitle: "金融インフラ監視パイプライン", mdGuildId: "GUILD:001", status: "AI鑑定中", appliedAt: new Date().toISOString() },
    { id: "demo_2", projectTitle: "EC在庫管理API", mdGuildId: "GUILD:002", status: "受付", appliedAt: new Date().toISOString() },
  ];

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-4">Applications</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
              <th className="pb-3 pr-4">Project</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">MD</th>
              <th className="pb-3 pr-4">Applied</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {displayApps.map(app => (
              <>
                <tr key={app.id} className="border-b border-slate-800 hover:bg-slate-900 cursor-pointer" onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                  <td className="py-3 pr-4 text-slate-100">{app.projectTitle}</td>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[app.status as Status] ?? "bg-slate-400"}`} />
                      <span className="text-slate-300">{app.status}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400 text-xs font-mono">{app.mdGuildId}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{new Date(app.appliedAt).toLocaleDateString("ja-JP")}</td>
                  <td className="py-3 text-slate-400 text-xs">{expanded === app.id ? "▲" : "▼"}</td>
                </tr>
                {expanded === app.id && (
                  <tr key={`${app.id}-detail`} className="bg-slate-900">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        {STATUS_STEPS.map((step, i) => {
                          const current = STATUS_STEPS.indexOf(app.status as Status);
                          const done = i <= current;
                          return (
                            <span key={step} className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${done ? STATUS_COLOR[step] : "bg-slate-700"}`} />
                              <span className={done ? "text-slate-100" : "text-slate-400"}>{step}</span>
                              {i < STATUS_STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                            </span>
                          );
                        })}
                      </div>
                      <button className="mt-3 text-xs text-slate-400 hover:text-slate-300">取り消す（Cancel）</button>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
