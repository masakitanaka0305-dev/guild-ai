"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_MARKETPLACE } from "@/lib/marketplace";
import { StarRating } from "@/components/StarRating";
import { ShareButton } from "@/components/ShareButton";
import { RankBadge } from "@/components/RankBadge";
import { StepIndicator } from "@/components/StepIndicator";
import type { MarketplaceListing } from "@/types";
import { mapToEmotionalTags } from "@/lib/emotional-tags";

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ─── Showcase card ────────────────────────────────────────────────────────────

function ShowcaseCard({
  item,
  isMine,
}: {
  item: MarketplaceListing;
  isMine: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(djb2(item.listing.id + "_likes") % 40 + 5);
  const [showShare, setShowShare] = useState(false);

  function handleLike() {
    if (!liked) {
      setLiked(true);
      setLikeCount((n) => n + 1);
    }
  }

  const emotionalTags = mapToEmotionalTags(item);

  const frontFace = (
    <article
      aria-label={`${item.listing.title} — ${item.listing.rank}ランク`}
      className="section-card overflow-hidden hover:shadow-card-hover transition-shadow"
    >
      {/* Thumbnail — aspect-[3/2] hero */}
      <div className="aspect-[3/2] bg-gradient-to-br from-kami to-kaki/5 flex items-center justify-center relative overflow-hidden">
        <div className="w-full aspect-square bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl flex items-center justify-center text-4xl">🎁</div>
        <div className="absolute top-2 right-2">
          <RankBadge rank={item.listing.rank} />
        </div>
        {isMine && (
          <div className="absolute top-2 left-2">
            <span className="rounded-full bg-kaki px-2 py-0.5 text-[10px] font-bold text-white">
              あなたの たからもの
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Emotional tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {emotionalTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-kaki/10 border border-kaki/20 px-2 py-0.5 text-[10px] font-semibold text-kaki"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-bold text-kuroko leading-snug line-clamp-2 flex-1">
            {item.listing.title}
          </h2>
          <StarRating rank={item.listing.rank} size="sm" />
        </div>

        <p className="mt-1.5 text-xs text-[#9890A8] leading-relaxed line-clamp-2">
          {item.listing.description}
        </p>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-3 text-xs text-[#9890A8]">
          <span className="tabular-nums">信用 {item.trustScore.score}</span>
          <span>·</span>
          <span>¥{item.listing.floorPrice.toLocaleString("ja-JP")}</span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? "いいね済み" : "いいねする"}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] ${
              liked
                ? "border-pink-300 bg-pink-50 text-pink-500"
                : "border-kuroko/20 text-[#9890A8] hover:border-pink-300 hover:text-pink-400"
            }`}
          >
            💖 {likeCount}
          </button>

          <button
            type="button"
            onClick={() => setShowShare((v) => !v)}
            aria-expanded={showShare}
            aria-label="シェアする"
            className="inline-flex items-center gap-1 rounded-full border border-kuroko/20 px-3 py-1.5 text-xs font-semibold text-[#9890A8] hover:border-kaki/40 transition-colors active:scale-[0.97]"
          >
            シェア
          </button>

          <Link
            href={`/asset/${item.listing.id}`}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-kaki px-3 py-1.5 text-xs font-bold text-white hover:bg-kaki/90 active:scale-[0.97] transition-all"
            aria-label={`${item.listing.title}に投資する・買う`}
            onClick={(e) => e.stopPropagation()}
          >
            この分身に投資する →
          </Link>
        </div>

        {/* Share panel */}
        {showShare && (
          <div className="mt-3 pt-3 border-t border-kuroko/10" onClick={(e) => e.stopPropagation()}>
            <ShareButton
              context={{ type: "listing_published", title: item.listing.title, assetId: item.listing.id }}
              url={`https://guild-ai.vercel.app/asset/${item.listing.id}`}
              seed={djb2(item.listing.id) % 3}
              compact
            />
          </div>
        )}
      </div>
    </article>
  );

  return frontFace;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  // Show 6 items from MOCK_MARKETPLACE; first item is treated as "mine"
  const items = MOCK_MARKETPLACE.slice(0, 6);

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">

      <StepIndicator current="distribute" />

      {/* Header */}
      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-kaki">✨ つくったもの</span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-kuroko leading-snug">
            Showcase
          </h1>
          <p className="mt-1 text-sm text-[#9890A8] leading-relaxed">
            みんなのたからものを見る。気に入ったら、分身として投資できます。
          </p>
        </div>
        <Link href="/sell" className="btn-primary shrink-0" aria-label="たからもの登記する">
          ✨ たからもの登記（Sync）
        </Link>
      </div>

      {/* My pinned card */}
      <section className="mt-6" aria-label="あなたのたからもの">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9890A8] mb-3">
          あなたの たからもの
        </p>
        <ShowcaseCard item={items[0]} isMine />
      </section>

      {/* Timeline grid */}
      <section className="mt-8" aria-label="みんなのたからもの">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9890A8] mb-3">
          みんなのたからもの
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(1).map((item) => (
            <ShowcaseCard key={item.listing.id} item={item} isMine={false} />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="mt-10 section-card p-5 text-center">
        <p className="text-base font-bold text-kuroko">あなたのたからものをお店にならべる準備はできていますか？</p>
        <p className="mt-1 text-sm text-[#9890A8]">スキルは、一生のたからもの。</p>
        <div className="mt-4 flex justify-center gap-3 flex-wrap">
          <Link href="/sell" className="btn-primary" aria-label="たからもの登記する">
            たからもの登記（Sync） →
          </Link>
          <Link href="/marketplace" className="btn-secondary" aria-label="保管庫を見る">
            保管庫を見る
          </Link>
        </div>
      </div>

    </main>
  );
}
