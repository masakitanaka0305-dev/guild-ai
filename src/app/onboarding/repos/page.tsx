"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BackArrow } from "@/components/ui/BackArrow";
import type { MockRepo } from "@/lib/github-picker";

interface RepoItem extends MockRepo {
  isPrivate?: boolean;
  updatedAt?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function LanguageBadge({ lang }: { lang: string }) {
  const colors: Record<string, string> = {
    TypeScript: "bg-blue-100 text-blue-700",
    JavaScript: "bg-yellow-100 text-yellow-700",
    Python: "bg-green-100 text-green-700",
    Go: "bg-cyan-100 text-cyan-700",
    Rust: "bg-orange-100 text-orange-700",
  };
  const cls = colors[lang] ?? "bg-gray-100 text-slate-400";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{lang}</span>;
}

export default function ReposPage() {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/repos/list")
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setRepos(data.repos ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      {/* Header */}
      <div className="mb-8">
        <div className="-ml-2 mb-2 flex items-center gap-1">
          <BackArrow href="/onboarding" label="オンボーディングに戻る" />
          <span className="text-xs text-slate-400">オンボーディング ›</span>
          <span aria-current="step" className="text-xs text-white font-medium">コードベース選択</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
          コードベースを選択
        </h1>
        <p className="text-slate-400 text-sm">
          GUILD AI に登記するコードベースを選んでください。AI が内容を解析して知能資産の草稿を生成します。
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-[var(--n-surface-2,#F5F3EE)] animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">
          <p className="font-medium">エラーが発生しました</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetch("/api/repos/list").then(r => r.json()).then(d => { setRepos(d.repos ?? []); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); }); }}
            className="mt-4 px-4 py-2 rounded-xl bg-[var(--primary,#06B6D4)] text-white text-sm font-bold"
          >
            再試行
          </button>
        </div>
      )}

      {!loading && !error && repos.length === 0 && (
        <div className="text-center py-12 text-[var(--n-muted,#6B6456)]">
          <p>コードベースが見つかりませんでした。</p>
        </div>
      )}

      {!loading && !error && repos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map(repo => {
            const [owner] = repo.fullName.split("/");
            return (
              <article
                key={repo.id}
                className={`relative flex flex-col p-5 rounded-2xl border transition-shadow hover:shadow-md ${
                  repo.recommended
                    ? "border-[var(--primary,#06B6D4)] bg-[var(--n-surface,#FFFFFF)]"
                    : "border-[var(--n-border,#E8E4DE)] bg-[var(--n-surface,#FFFFFF)]"
                }`}
              >
                {repo.recommended && (
                  <span className="absolute top-3 right-3 text-xs font-bold text-[var(--primary,#06B6D4)] bg-red-50 px-2 py-0.5 rounded-full">
                    おすすめ
                  </span>
                )}

                <div className="flex items-start gap-2 mb-2 pr-16">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-[var(--n-muted,#6B6456)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  <h2 className="font-bold text-[var(--n-text,#1A1714)] text-sm leading-tight">{repo.name}</h2>
                </div>

                {repo.isPrivate && (
                  <span className="self-start mb-2 text-xs font-medium text-[var(--n-muted,#6B6456)] bg-[var(--n-surface-2,#F5F3EE)] px-2 py-0.5 rounded-full">
                    Private
                  </span>
                )}

                <p className="text-xs text-[var(--n-muted,#6B6456)] flex-1 mb-3 line-clamp-2">
                  {repo.description || "説明なし"}
                </p>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <LanguageBadge lang={repo.language} />
                  <span className="flex items-center gap-1 text-xs text-[var(--n-muted,#6B6456)]">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {repo.stars}
                  </span>
                  {repo.updatedAt && (
                    <span className="text-xs text-[var(--n-muted,#6B6456)]">{formatDate(repo.updatedAt)}</span>
                  )}
                </div>

                <Link
                  href={`/onboarding/draft/${owner}/${repo.name}`}
                  className="block text-center py-2 px-4 rounded-full bg-[#22D3EE] text-[#0B1121] text-xs font-bold hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-cyan-400"
                >
                  Analyze — このコードベースを解析
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
