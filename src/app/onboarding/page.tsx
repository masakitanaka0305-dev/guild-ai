"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Code } from "lucide-react";

function OnboardingPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null); // repoId being analyzed

  useEffect(() => {
    fetch("/api/repos/list")
      .then(r => r.json())
      .then(data => { setRepos(data.repos || []); setLoading(false); });
  }, []);

  async function handleAnalyze(owner: string, repo: string, repoId: string) {
    setAnalyzing(repoId);
    try {
      const res = await fetch("/api/repos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      const data = await res.json();
      if (data.draft) {
        // Store draft in sessionStorage for draft page to pick up
        sessionStorage.setItem(`draft:${owner}:${repo}`, JSON.stringify(data));
        router.push(`/onboarding/draft/${owner}/${repo}`);
      }
    } finally {
      setAnalyzing(null);
    }
  }

  if (loading) return <div className="p-8 text-slate-400">Loading repos…</div>;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-4">Deploy — GitHub Repos</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
              <th className="pb-3 pr-4">Repo</th>
              <th className="pb-3 pr-4">Language</th>
              <th className="pb-3 pr-4">Stars</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {repos.map((r: any) => (
              <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-900">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-100">{r.name}</p>
                      {r.description && <p className="text-xs text-slate-500">{r.description.slice(0,60)}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-slate-400">{r.language || "—"}</td>
                <td className="py-3 pr-4 text-slate-400">{r.stars ?? 0}</td>
                <td className="py-3">
                  <button
                    onClick={() => {
                      const owner = r.fullName?.split("/")[0] || "demo-user";
                      handleAnalyze(owner, r.name, r.id);
                    }}
                    disabled={analyzing === r.id}
                    className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-md hover:bg-cyan-400 disabled:opacity-50 min-h-[44px]"
                    aria-label={`Analyze ${r.name}`}
                  >
                    {analyzing === r.id ? "Analyzing…" : "Analyze"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function OnboardingWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading…</div>}>
      <OnboardingPage />
    </Suspense>
  );
}
