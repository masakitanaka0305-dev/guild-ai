"use client";

import { useState } from "react";
import Link from "next/link";
import {
  proSearch,
  DEFAULT_FILTERS,
  type ProSearchFilters,
  type CategoryFilter,
  type AccuracyFilter,
  type VolumeFilter,
  type SlaFilter,
  type TierFilter,
  type SortBy,
  type ProSearchResult,
} from "@/lib/pro-search";

// ─── Chip selector ────────────────────────────────────────────────────────────

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold text-[var(--n-muted,#6B6456)] uppercase tracking-widest shrink-0">
        {label}
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scroll-smooth">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold transition-colors ${
              value === opt.value
                ? "bg-[var(--primary,#06B6D4)] border-[var(--primary,#06B6D4)] text-white"
                : "border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] hover:border-[var(--primary,#06B6D4)] hover:text-[var(--primary,#06B6D4)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Result card ─────────────────────────────────────────────────────────────

function ResultCard({ result, rank }: { result: ProSearchResult; rank: number }) {
  const rankColors = { S: "#D4AF37", A: "#06B6D4", B: "#9890A8" } as const;
  const rankColor = rankColors[result.rank] ?? "#9890A8";

  return (
    <li className="bg-white border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-start hover:border-[var(--primary,#06B6D4)]/30 transition-colors">
      {/* Rank plate */}
      <div
        className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold text-white"
        style={{ backgroundColor: rankColor }}
        aria-label={`ランク ${result.rank}`}
      >
        {result.rank}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <p className="text-sm font-bold text-[var(--n-text,#1A1714)] flex-1 min-w-0 truncate">
            {result.title}
          </p>
          <span className="text-[9px] text-[var(--n-muted,#6B6456)] tabular-nums shrink-0">
            #{rank}
          </span>
        </div>
        <p className="text-xs text-[var(--n-muted,#6B6456)] line-clamp-2 mb-2">
          {result.description}
        </p>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span
            role="status"
            aria-label={`精度 ${result.accuracyPct.toFixed(1)} パーセント`}
            className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 font-bold text-green-700"
          >
            精度 {result.accuracyPct.toFixed(1)}%
          </span>
          <span className="rounded-full bg-[var(--n-surface-2,#F5F3EE)] border border-[var(--n-divider,rgba(0,0,0,0.08))] px-2 py-0.5 text-[var(--n-muted,#6B6456)]">
            平均レイテンシ {result.avgLatencyMs}ms
          </span>
          <span className="rounded-full bg-[var(--n-surface-2,#F5F3EE)] border border-[var(--n-divider,rgba(0,0,0,0.08))] px-2 py-0.5 text-[var(--n-muted,#6B6456)]">
            {result.recommendedTier}
          </span>
          {result.floorPrice > 0 && (
            <span className="rounded-full bg-[var(--n-surface-2,#F5F3EE)] border border-[var(--n-divider,rgba(0,0,0,0.08))] px-2 py-0.5 text-[var(--n-muted,#6B6456)]">
              ¥{result.floorPrice.toLocaleString("ja-JP")}〜
            </span>
          )}
        </div>
      </div>

      {/* CTA column */}
      <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
        <Link
          href={`/asset/${result.assetId}`}
          className="flex-1 sm:flex-none text-center h-9 px-4 rounded-full bg-[var(--primary,#06B6D4)] text-white text-xs font-bold flex items-center justify-center hover:opacity-90 active:scale-[0.97] transition-all"
        >
          この知能で解決
        </Link>
        <a
          href={`/asset/${result.assetId}`}
          className="flex-1 sm:flex-none text-center h-9 px-3 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] text-[10px] font-semibold flex items-center justify-center hover:bg-[var(--n-surface-2,#F5F3EE)] transition-all"
        >
          ためしてみる
        </a>
        <Link
          href="/business"
          className="flex-1 sm:flex-none text-center h-9 px-3 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] text-[10px] font-semibold flex items-center justify-center hover:bg-[var(--n-surface-2,#F5F3EE)] transition-all"
        >
          法人で相談
        </Link>
      </div>
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplaceProPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ProSearchFilters>({ ...DEFAULT_FILTERS });
  const [sortBy, setSortBy] = useState<SortBy>("accuracy");
  const [results, setResults] = useState<ProSearchResult[] | null>(null);
  const [searched, setSearched] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const r = proSearch(query, filters, sortBy);
    setResults(r);
    setSearched(true);
  }

  function setFilter<K extends keyof ProSearchFilters>(key: K, val: ProSearchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto py-8 pb-24 sm:pb-12">
      <h1 className="sr-only">企業向け法人検索（Pro Search）</h1>

      <Link href="/marketplace" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline mb-4 inline-block">
        ← マーケットプレイスに戻る
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 rounded-full bg-[var(--primary,#06B6D4)]" />
        <h2 className="text-xl font-extrabold text-[var(--n-text,#1A1714)]">法人検索（Pro Search）</h2>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6">
        <label htmlFor="pro-search-query" className="block text-sm font-bold text-[var(--n-text,#1A1714)] mb-2">
          解決したい課題を入力
        </label>
        <textarea
          id="pro-search-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="例：PDF の請求書を JSON に整形したい。月 50,000 件処理。SLA 99.9%"
          className="w-full rounded-2xl border border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[var(--n-surface,#FFFFFF)] px-4 py-3 text-sm text-[var(--n-text,#1A1714)] placeholder:text-[var(--n-muted,#6B6456)] focus:outline-none focus:ring-2 focus:ring-[var(--primary,#06B6D4)] resize-none"
        />

        {/* Filter chips */}
        <div className="mt-4 space-y-3">
          <ChipGroup<CategoryFilter>
            label="カテゴリ"
            options={[
              { label: "すべて", value: "all" },
              { label: "DataOps", value: "DataOps" },
              { label: "LLMOps", value: "LLMOps" },
              { label: "RPA", value: "RPA" },
              { label: "営業 AI", value: "営業AI" },
            ]}
            value={filters.category}
            onChange={(v) => setFilter("category", v)}
          />
          <ChipGroup<AccuracyFilter>
            label="必要精度"
            options={[
              { label: "指定なし", value: "all" },
              { label: ">90%", value: ">90%" },
              { label: ">95%", value: ">95%" },
              { label: ">99%", value: ">99%" },
            ]}
            value={filters.accuracy}
            onChange={(v) => setFilter("accuracy", v)}
          />
          <ChipGroup<VolumeFilter>
            label="月間コール数"
            options={[
              { label: "指定なし", value: "all" },
              { label: "〜10K", value: "〜10K" },
              { label: "〜100K", value: "〜100K" },
              { label: "100K+", value: "100K+" },
            ]}
            value={filters.volume}
            onChange={(v) => setFilter("volume", v)}
          />
          <ChipGroup<SlaFilter>
            label="SLA"
            options={[
              { label: "指定なし", value: "all" },
              { label: "99.5%", value: "99.5%" },
              { label: "99.9%", value: "99.9%" },
              { label: "99.99%", value: "99.99%" },
            ]}
            value={filters.sla}
            onChange={(v) => setFilter("sla", v)}
          />
          <ChipGroup<TierFilter>
            label="価格帯"
            options={[
              { label: "指定なし", value: "all" },
              { label: "Hobby", value: "Hobby" },
              { label: "Pro Indie", value: "Pro Indie" },
              { label: "Enterprise", value: "Enterprise" },
            ]}
            value={filters.tier}
            onChange={(v) => setFilter("tier", v)}
          />
        </div>

        {/* Sort + submit */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[var(--n-muted,#6B6456)] uppercase tracking-widest">並び替え</span>
            {(
              [
                { label: "精度順", value: "accuracy" as SortBy },
                { label: "レイテンシ順", value: "latency" as SortBy },
                { label: "コスト順", value: "cost" as SortBy },
              ] as const
            ).map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSortBy(s.value)}
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold transition-colors ${
                  sortBy === s.value
                    ? "bg-[var(--n-text,#1A1714)] border-[var(--n-text,#1A1714)] text-white"
                    : "border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="ml-auto h-11 px-8 rounded-full bg-[var(--primary,#06B6D4)] text-white font-bold text-sm hover:opacity-90 active:scale-[0.97] transition-all shadow-sm"
          >
            検索
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <section aria-live="polite">
          {results && results.length > 0 ? (
            <>
              <p className="text-xs text-[var(--n-muted,#6B6456)] mb-3">{results.length} 件の知能が見つかりました</p>
              <ol className="space-y-3">
                {results.map((r, i) => (
                  <ResultCard key={r.assetId} result={r} rank={i + 1} />
                ))}
              </ol>
            </>
          ) : (
            <div className="text-center py-12 text-[var(--n-muted,#6B6456)]">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm">条件に合う知能が見つかりませんでした。フィルタを緩めてお試しください。</p>
            </div>
          )}
        </section>
      )}

      {/* Business CTA — always visible */}
      <div className="mt-10 bg-[var(--n-text,#1A1714)] rounded-2xl p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--n-gold,#D4AF37)] mb-2">企業利用</p>
        <p className="text-sm text-white mb-4 leading-relaxed">
          カスタム契約・専用 SLA・バルク利用については<br />担当者がご対応します。
        </p>
        <Link
          href="/business"
          className="inline-block h-10 px-8 rounded-full bg-[var(--n-gold,#D4AF37)] text-[var(--n-text,#1A1714)] font-bold text-sm hover:opacity-90 active:scale-[0.97] transition-all"
        >
          企業利用について相談する →
        </Link>
      </div>
    </main>
  );
}
