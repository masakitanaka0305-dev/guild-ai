"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MOCK_MARKETPLACE,
  sortListings,
  filterListings,
  type SortKey,
} from "@/lib/marketplace";
import { RankBadge } from "@/components/RankBadge";
import { StarRating } from "@/components/StarRating";
import { StepIndicator } from "@/components/StepIndicator";
import type { Rank, MarketplaceListing } from "@/types";
import { ShoppingBagIcon } from "@/components/icons";
import { generatePersonaCards, type Persona } from "@/lib/persona-cards";
import { useLazyMount } from "@/hooks/useLazyMount";
import { generateAllDraftListings, type ProvisionalListing } from "@/lib/draft-listing";
import { PoolPulse } from "@/components/PoolPulse";
import { getBacktestStats } from "@/lib/backtest";

interface LazyMarketplaceCardProps {
  item: MarketplaceListing;
  isNew: boolean;
  hasDetailPage: boolean;
  persona: Persona;
}

function LazyMarketplaceCard({ item, isNew, hasDetailPage, persona }: LazyMarketplaceCardProps) {
  const { ref, mounted } = useLazyMount();
  const personaCards = generatePersonaCards(item);
  const personaCard = personaCards[persona];

  const frontContent = (
    <div className={`section-card p-4 transition-all ${isNew ? "ring-2 ring-kaki animate-pulse" : ""}`}>
      <div className="aspect-[3/2] bg-gradient-to-br from-kami to-kaki/5 rounded-xl flex items-center justify-center relative mb-3 overflow-hidden">
        <div className="w-full aspect-square bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl flex items-center justify-center text-4xl">🎁</div>
        <div className="absolute top-2 right-2">
          <RankBadge rank={item.listing.rank} large />
        </div>
        {isNew && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold text-kaki uppercase tracking-widest">NEW</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {personaCard.emotionalTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-kaki/10 border border-kaki/20 px-2 py-0.5 text-[10px] font-semibold text-kaki"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold leading-snug text-white line-clamp-2 flex-1">
          {personaCard.headline}
        </h2>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <StarRating rank={item.listing.rank} size="sm" />
          {(() => {
            const acc = getBacktestStats(item.listing.id).accuracyPct;
            return (
              <span
                role="status"
                aria-label={`精度 ${acc.toFixed(1)} パーセント`}
                className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[9px] font-bold text-green-700 tabular-nums"
              >
                精度 {acc.toFixed(1)}%
              </span>
            );
          })()}
        </div>
      </div>

      <ul className="mt-2 space-y-1">
        {personaCard.bullets.slice(0, 2).map((bullet) => (
          <li key={bullet} className="flex gap-1.5 text-xs text-[#E2E8F0]">
            <span className="text-kaki mt-0.5">·</span>
            {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-2">
        <span className="text-sm text-slate-400">{personaCard.priceCallout}</span>
        <span className="text-xs font-semibold text-kaki">{personaCard.ctaLabel}</span>
      </div>

    </div>
  );


  return (
    <div ref={ref}>
      {mounted ? (
        frontContent
      ) : (
        <div className="section-card aspect-[3/2] animate-pulse bg-kuroko/5" aria-hidden="true" />
      )}
    </div>
  );
}

// Unclaimed draft card
function UnclaimedCard({ draft }: { draft: ProvisionalListing }) {
  return (
    <div className="section-card p-4 relative overflow-hidden">
      {/* Unclaimed ribbon */}
      <div
        role="note"
        aria-describedby="claim-hint"
        className="absolute top-2 left-2 bg-[#FFCC00]/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-[#8B6800] border border-[#FFCC00]/50"
      >
        未請求
      </div>

      <div className="aspect-[3/2] bg-gradient-to-br from-[#FFFBEA] to-[#FFF8D6] rounded-xl flex items-center justify-center mb-3 mt-4">
        <div className="text-center px-3">
          <p className="text-xs font-semibold text-[#8B6800] line-clamp-2">{draft.title}</p>
          <RankBadge rank={draft.rank} large />
        </div>
      </div>

      <div className="space-y-1 mb-2">
        {draft.useCases.slice(0, 2).map((uc) => (
          <p key={uc} className="text-[10px] text-[#E2E8F0] flex gap-1">
            <span className="text-[#FFCC00] shrink-0">·</span>
            <span className="line-clamp-1">{uc}</span>
          </p>
        ))}
      </div>

      <PoolPulse assetId={draft.id} pooledJpy={draft.valuePool} className="mb-2" />

      <Link
        href={`/sell?claim=${draft.id}`}
        className="block w-full text-center rounded-lg border border-[#FFCC00]/60 bg-[#FFCC00]/10 px-3 py-2 text-xs font-semibold text-[#8B6800] hover:bg-[#FFCC00]/20 transition-colors"
        aria-label={`${draft.title}の権利を確認する`}
      >
        権利を確認する →
      </Link>
    </div>
  );
}

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: "trust", label: "信用スコア" },
  { key: "ccaf",  label: "こだわり（実績）" },
  { key: "price", label: "価格" },
];

const ALL_RANKS: Rank[] = ["S", "A", "B"];

type ViewTab = "all" | "registered" | "unclaimed";

function MarketplaceContent() {
  const params = useSearchParams();

  const [sortKey, setSortKey] = useState<SortKey>("trust");
  const [filterRanks, setFilterRanks] = useState<Rank[]>(["S", "A", "B"]);
  const [minTrustScore, setMinTrustScore] = useState(0);
  const [customListings, setCustomListings] = useState<MarketplaceListing[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>("general");
  const [viewTab, setViewTab] = useState<ViewTab>("all");

  useEffect(() => {
    try {
      const stored: MarketplaceListing[] = JSON.parse(localStorage.getItem("guild_custom_listings") ?? "[]");
      setCustomListings(stored);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const id = params.get("highlight");
    if (id) {
      setHighlightId(id);
      const timer = setTimeout(() => setHighlightId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [params]);

  const allListings = useMemo(() => [...MOCK_MARKETPLACE, ...customListings], [customListings]);

  const items = useMemo(
    () => sortListings(filterListings(allListings, { ranks: filterRanks, minTrustScore }), sortKey),
    [allListings, sortKey, filterRanks, minTrustScore]
  );

  const draftListings = useMemo(() => generateAllDraftListings(), []);

  const toggleRank = (rank: Rank) => {
    setFilterRanks((prev) => prev.includes(rank) ? prev.filter((r) => r !== rank) : [...prev, rank]);
  };

  const isMock = (id: string) => MOCK_MARKETPLACE.some((m) => m.listing.id === id);

  const displayedItems = viewTab === "registered"
    ? items.filter((item) => isMock(item.listing.id))
    : viewTab === "unclaimed"
    ? null
    : items;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">

      <StepIndicator current="distribute" />

      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-snug flex items-center gap-2"><ShoppingBagIcon size={22} className="text-kaki" />保管庫（スキルの貯金箱）</h1>
          <p className="mt-1 text-base text-slate-400 leading-relaxed">
            AI評価済みスキル資産の保管庫。良質なたからものほど高評価・高価格で表示されます。
          </p>
        </div>
        <Link href="/sell" className="btn-primary shrink-0" aria-label="スキルを資産として登記する">
          登記（Sync） →
        </Link>
      </div>

      {/* View tabs: all / registered / unclaimed */}
      <div role="tablist" className="flex gap-1 border-b border-white/10 mt-4 mb-0">
        {(["all", "registered", "unclaimed"] as ViewTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={viewTab === tab}
            onClick={() => setViewTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${viewTab === tab ? "border-b-2 border-kaki text-kaki" : "text-slate-400 hover:text-white"}`}
          >
            {tab === "all" ? "すべて" : tab === "registered" ? "登録済み" : "未請求"}
          </button>
        ))}
      </div>

      {/* Unclaimed hint for screen readers */}
      <span id="claim-hint" className="sr-only">この作品はまだ権利が主張されていません。</span>

      {viewTab === "unclaimed" ? (
        /* Unclaimed draft grid */
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {draftListings.map((draft) => (
            <li key={draft.id}>
              <UnclaimedCard draft={draft} />
            </li>
          ))}
        </ul>
      ) : (
        <>
          {/* Controls */}
          <div className="mt-4 section-card p-4 flex flex-wrap gap-5 items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">並び順</p>
              <div className="flex gap-1.5 flex-wrap">
                {SORT_LABELS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortKey(key)}
                    aria-pressed={sortKey === key}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all active:scale-[0.97] ${
                      sortKey === key
                        ? "border-kaki bg-kaki text-white"
                        : "border-white/10 text-[#E2E8F0] hover:border-kaki/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">ランク</p>
              <div className="flex gap-1.5">
                {ALL_RANKS.map((rank) => (
                  <button
                    key={rank}
                    onClick={() => toggleRank(rank)}
                    aria-pressed={filterRanks.includes(rank)}
                    aria-label={`ランク${rank}でフィルタ`}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-bold transition-all active:scale-[0.97] ${
                      filterRanks.includes(rank)
                        ? rank === "S"
                          ? "border-kaki bg-kaki text-white"
                          : rank === "A"
                          ? "border-zinc-400 bg-zinc-300 text-white"
                          : "border-amber-800 bg-amber-700 text-white"
                        : "border-white/10 text-slate-400"
                    }`}
                  >
                    {rank}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                最低 信用スコア: <span className="text-white font-bold">{minTrustScore}</span>
              </p>
              <input
                type="range"
                min={0} max={900} step={50}
                value={minTrustScore}
                onChange={(e) => setMinTrustScore(Number(e.target.value))}
                aria-label="最低信用スコアフィルタ"
                className="w-32 accent-kaki"
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">表示スタイル</legend>
              <div className="flex gap-1.5">
                {(["general", "pm", "engineer"] as Persona[]).map((p) => (
                  <button key={p} onClick={() => setPersona(p)} aria-pressed={persona === p}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all active:scale-[0.97] ${
                      persona === p ? "border-kaki bg-kaki text-white" : "border-white/10 text-[#E2E8F0] hover:border-kaki/40"
                    }`}>
                    {p === "general" ? "一般" : p === "pm" ? "PM" : "エンジニア"}
                  </button>
                ))}
              </div>
            </fieldset>

            <p className="ml-auto text-sm text-slate-400 self-end">{displayedItems?.length ?? draftListings.length} 件</p>
          </div>

          {/* Asset grid */}
          {!displayedItems || displayedItems.length === 0 ? (
            <div className="mt-12 text-center">
              <p className="text-base text-slate-400">条件に一致する資産がありません。</p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displayedItems.map((item) => (
                <li key={item.listing.id}>
                  <LazyMarketplaceCard
                    item={item}
                    isNew={item.listing.id === highlightId}
                    hasDetailPage={isMock(item.listing.id)}
                    persona={persona}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        <div className="mt-12 section-card p-8 text-center">
          <p className="text-base text-slate-400">読み込み中…</p>
        </div>
      </main>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
