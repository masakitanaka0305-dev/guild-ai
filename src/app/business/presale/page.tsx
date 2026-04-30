"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { proposeFromText, type PresaleProposal } from "@/lib/presale-agent";
import { getPackage } from "@/lib/solution-catalog";

const TIER_LABEL: Record<string, string> = {
  team: "Team",
  enterprise: "Enterprise",
  "enterprise-plus": "Enterprise+",
};

const EXAMPLE_QUERIES = [
  "製造業の在庫管理を自動化したい",
  "金融機関のコンプライアンスモニタリングを強化したい",
  "ECサイトのカスタマーレビューを自動分析したい",
  "医療機関でカルテの電子化を進めたい",
];

export default function PresalePage() {
  const searchParams = useSearchParams();
  const pkgParam = searchParams.get("pkg");

  const [query, setQuery] = useState("");
  const [proposal, setProposal] = useState<PresaleProposal | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pkgParam) {
      const pkg = getPackage(pkgParam);
      if (pkg) {
        setQuery(pkg.summary);
        runProposal(pkg.summary);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgParam]);

  function runProposal(text: string) {
    setLoading(true);
    setProposal(null);
    setTimeout(() => {
      setProposal(proposeFromText(text));
      setLoading(false);
    }, 1200);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) runProposal(query.trim());
  };

  const roiM = proposal ? (proposal.expectedSavings / 1_000_000).toFixed(1) : "0";
  const monthlyBase = proposal ? (proposal.pricing.baseMonthlyJpy / 10000).toFixed(0) : "0";
  const setup = proposal ? (proposal.pricing.setupJpy / 10000).toFixed(0) : "0";

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
      <Link href="/business/catalog" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline">
        ← カタログに戻る
      </Link>

      <div className="mt-6 mb-8">
        <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)] mb-2">AI 事前提案</h1>
        <p className="text-sm text-[var(--n-muted,#6B6456)] leading-relaxed">
          解決したい課題を日本語で入力してください。最適な MD バンドルと費用対効果を提案します。
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="section-card p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--n-text,#1A1714)] mb-2">
            課題・要件を入力
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例：製造ラインの在庫管理を自動化し、発注業務を効率化したい"
            rows={4}
            className="w-full rounded-xl border border-[var(--n-divider,rgba(0,0,0,0.12))] bg-[var(--n-surface-2,#F5F3EE)] px-4 py-3 text-sm text-[var(--n-text,#1A1714)] placeholder:text-[var(--n-muted,#6B6456)] focus:outline-none focus:ring-2 focus:ring-[var(--n-primary,#E64545)] resize-none"
          />
        </div>

        {/* Example queries */}
        <div>
          <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-1.5">例文から選ぶ：</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuery(q)}
                className="text-[10px] px-2 py-1 rounded-full bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)] border border-[var(--n-divider,rgba(0,0,0,0.08))] hover:border-[var(--n-primary,#E64545)] hover:text-[var(--n-primary,#E64545)] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="w-full rounded-xl bg-[var(--n-primary,#E64545)] text-white text-sm font-bold py-3 hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {loading ? "分析中..." : "提案を生成する →"}
        </button>
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-6 section-card p-5 space-y-3 animate-pulse">
          <div className="h-4 bg-[var(--n-divider,rgba(0,0,0,0.08))] rounded w-2/3" />
          <div className="h-3 bg-[var(--n-divider,rgba(0,0,0,0.08))] rounded w-full" />
          <div className="h-3 bg-[var(--n-divider,rgba(0,0,0,0.08))] rounded w-4/5" />
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 bg-[var(--n-divider,rgba(0,0,0,0.08))] rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Proposal result */}
      {proposal && !loading && (
        <div className="mt-6 space-y-4">
          {/* Rationale */}
          <div className="section-card p-5">
            <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-2">提案内容</h2>
            <p className="text-sm text-[var(--n-muted,#6B6456)] leading-relaxed">{proposal.rationale}</p>
          </div>

          {/* Recommended package highlight */}
          {proposal.recommendedPackage && (
            <div className="section-card p-5 border-2 border-[var(--n-primary,#E64545)]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-[var(--n-text,#1A1714)]">
                  推奨パッケージ: {proposal.recommendedPackage.title}
                </h3>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--n-primary,#E64545)] text-white">
                  {TIER_LABEL[proposal.recommendedPackage.minTier]}
                </span>
              </div>
              <p className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed mb-3">
                {proposal.recommendedPackage.summary}
              </p>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {proposal.mdBundle.map((md) => (
                  <span key={md} className="px-2 py-0.5 rounded bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)] font-mono">
                    {md}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="section-card p-4 text-center">
              <p className="text-xs font-black text-[var(--n-primary,#E64545)]">¥{roiM}M</p>
              <p className="text-[9px] text-[var(--n-muted,#6B6456)] mt-0.5">月次期待ROI</p>
            </div>
            <div className="section-card p-4 text-center">
              <p className="text-xs font-black text-[var(--n-text,#1A1714)]">¥{monthlyBase}万</p>
              <p className="text-[9px] text-[var(--n-muted,#6B6456)] mt-0.5">月額基本料</p>
            </div>
            <div className="section-card p-4 text-center">
              <p className="text-xs font-black text-[var(--n-text,#1A1714)]">
                {setup === "0" ? "無料" : `¥${setup}万`}
              </p>
              <p className="text-[9px] text-[var(--n-muted,#6B6456)] mt-0.5">初期費用</p>
            </div>
          </div>

          {/* Compliance tags */}
          {proposal.complianceTags.length > 0 && (
            <div className="section-card p-4">
              <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-2">関連法令・準拠基準</p>
              <div className="flex flex-wrap gap-1.5">
                {proposal.complianceTags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/business/checkout"
              className="flex-1 text-center rounded-xl bg-[var(--n-primary,#E64545)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              このプランで申し込む →
            </Link>
            <Link
              href="/business/catalog"
              className="flex-1 text-center rounded-xl border border-[var(--n-divider,rgba(0,0,0,0.12))] px-6 py-3 text-sm font-bold text-[var(--n-text,#1A1714)] hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
            >
              カタログで比較する
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
