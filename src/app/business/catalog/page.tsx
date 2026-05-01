import Link from "next/link";
import { getCatalog, type SolutionPackage } from "@/lib/solution-catalog";

const TIER_LABEL: Record<string, string> = {
  team: "Team",
  enterprise: "Enterprise",
  "enterprise-plus": "Enterprise+",
};

const TIER_COLOR: Record<string, string> = {
  team: "bg-blue-50 text-blue-700 border-blue-200",
  enterprise: "bg-amber-50 text-amber-700 border-amber-200",
  "enterprise-plus": "bg-[#EDE8FF] text-[#6B3FCE] border-[#C4B5F7]",
};

const INDUSTRY_COLOR: Record<string, string> = {
  金融: "bg-emerald-50 text-emerald-700",
  医療: "bg-rose-50 text-rose-700",
  小売: "bg-sky-50 text-sky-700",
  製造: "bg-orange-50 text-orange-700",
};

function PackageCard({ pkg }: { pkg: SolutionPackage }) {
  const roiM = (pkg.roiMonthlyJpy / 1_000_000).toFixed(1);
  return (
    <div className="section-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--n-text,#1A1714)] leading-snug flex-1">{pkg.title}</h3>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_COLOR[pkg.minTier]}`}>
          {TIER_LABEL[pkg.minTier]}
        </span>
      </div>

      {/* Summary */}
      <p className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed line-clamp-3">{pkg.summary}</p>

      {/* Industries */}
      <div className="flex flex-wrap gap-1">
        {pkg.industries.map((ind) => (
          <span key={ind} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${INDUSTRY_COLOR[ind] ?? "bg-gray-100 text-slate-400"}`}>
            {ind}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-auto pt-2 border-t border-[var(--n-divider,rgba(0,0,0,0.08))]">
        <div className="text-center">
          <p className="text-xs font-black text-[var(--primary,#6366F1)]">¥{roiM}M</p>
          <p className="text-[9px] text-[var(--n-muted,#6B6456)]">月次ROI</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-black text-[var(--n-text,#1A1714)]">{pkg.slaPct}%</p>
          <p className="text-[9px] text-[var(--n-muted,#6B6456)]">SLA</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-black text-[var(--n-text,#1A1714)]">{pkg.includedMds.length}本</p>
          <p className="text-[9px] text-[var(--n-muted,#6B6456)]">MD含む</p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/business/presale?pkg=${pkg.id}`}
        className="mt-1 w-full text-center rounded-lg bg-[var(--primary,#6366F1)] text-white text-xs font-bold py-2 hover:opacity-90 transition-opacity"
      >
        見積もる →
      </Link>
    </div>
  );
}

export default function CatalogPage() {
  const catalog = getCatalog();

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
      <Link href="/business" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline">
        ← 法人向けトップ
      </Link>

      {/* Hero */}
      <div className="mt-6 mb-8">
        <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)] mb-2">ソリューションカタログ</h1>
        <p className="text-sm text-[var(--n-muted,#6B6456)] leading-relaxed max-w-xl">
          業種別に最適化された AI エージェントパッケージ。すぐに導入できる MD バンドルと ROI 試算付き。
        </p>
      </div>

      {/* Filter hint */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["金融", "医療", "小売", "製造"] as const).map((ind) => (
          <span key={ind} className={`text-xs font-semibold px-3 py-1 rounded-full ${INDUSTRY_COLOR[ind]}`}>
            {ind}
          </span>
        ))}
        <span className="text-xs text-[var(--n-muted,#6B6456)] self-center ml-1">— 全業種対応</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      {/* CTA footer */}
      <div className="mt-10 section-card p-6 text-center">
        <p className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-1">ぴったりのパッケージが見つかりませんか？</p>
        <p className="text-xs text-[var(--n-muted,#6B6456)] mb-4">自然言語で課題を入力するだけで、最適な MD バンドルと見積もりを提案します。</p>
        <Link
          href="/business/presale"
          className="inline-block rounded-xl bg-[var(--primary,#6366F1)] px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          AI に相談する →
        </Link>
      </div>
    </main>
  );
}
