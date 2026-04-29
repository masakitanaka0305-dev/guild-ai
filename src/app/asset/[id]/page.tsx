import { notFound } from "next/navigation";
import Link from "next/link";
import { MOCK_MARKETPLACE } from "@/lib/marketplace";
import { RankBadge } from "@/components/RankBadge";
import { CheckoutSection } from "@/components/CheckoutSection";
import { ValuationSection } from "@/components/ValuationSection";
import { SearchIcon, LinkIcon } from "@/components/icons";
import { RawDataPanel } from "@/components/RawDataPanel";
import { AssetReview } from "@/components/AssetReview";
import { buildAssetJsonLd } from "@/lib/structured-data";
import { computeBundlePricing, computeMonthlyFromFloor } from "@/lib/checkout";
import { ActivityPulse } from "@/components/ActivityPulse";
import { BilingualLayout } from "@/components/BilingualLayout";
import { mintGuildIdForAsset } from "@/lib/guild-id";

const BASE_URL = "https://guild-ai.vercel.app";

export function generateStaticParams() {
  return MOCK_MARKETPLACE.map((item) => ({ id: item.listing.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const item = MOCK_MARKETPLACE.find((m) => m.listing.id === params.id);
  if (!item) return {};
  const { listing, trustScore } = item;
  const title = `${listing.title} — GUILD AI`;
  const description = `${listing.description} 信用スコア ${trustScore.score}/1000 · ランク ${listing.rank} · ¥${listing.floorPrice.toLocaleString("ja-JP")}`;
  const url = `${BASE_URL}/asset/${listing.id}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: `/api/emblem/${listing.id}`, width: 1200, height: 630, alt: listing.title }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [`/api/emblem/${listing.id}`] },
  };
}

export default function AssetPage({ params }: { params: { id: string } }) {
  const item = MOCK_MARKETPLACE.find((m) => m.listing.id === params.id);
  if (!item) notFound();

  const { listing, auditResult, trustScore } = item;
  const guildId = mintGuildIdForAsset(listing.id);

  const curlSample = `curl -X POST https://guild-ai.vercel.app/api/atoa/${listing.id} \\
  -H "Authorization: Bearer gld_<YOUR_ACCESS_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "タスクを入力してください", "agentId": "agent-xyz"}'`;

  const jsonPayload = JSON.stringify(
    {
      input: "タスクを入力してください",
      agentId: "agent-xyz",
      sessionId: "chk_...",
    },
    null,
    2
  );

  // Bilingual layout: emotional (left/yasashii) content
  const emotionalContent = (
    <>
      <p className="text-sm text-[#4A4464] leading-relaxed">{listing.description}</p>

      {listing.githubUrl && (
        <a
          href={listing.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-[#9890A8] underline hover:text-kaki transition-colors"
        >
          作品を見る →
        </a>
      )}

      {/* Lineage link */}
      <Link
        href={`/lineage/${encodeURIComponent(listing.id)}`}
        className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--n-primary,#E64545)] hover:underline font-semibold"
      >
        この知能の家系図を見る →
      </Link>

      {/* クリエイターのこだわり (Proof of Make) */}
      {listing.proofOfMakeNote && (
        <section className="mt-4 section-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8]">
            クリエイターのこだわり（実績ログ）
          </h2>
          <p className="mt-3 text-sm text-[#4A4464] leading-relaxed whitespace-pre-wrap">
            {listing.proofOfMakeNote}
          </p>
        </section>
      )}

      <div className="mt-4">
        <ActivityPulse assetId={listing.id} />
      </div>
    </>
  );

  // Bilingual layout: spec (right/kuwashii) content
  const specContent = (
    <>
      {/* CCAF detail */}
      <section className="section-card p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8] flex items-center">
          こだわり（実績ログ）
        </h2>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#4A4464]">考えの深さ</dt>
            <dd className="font-semibold tabular-nums text-kuroko">{listing.ccaf.thoughtDensity} / 100</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#4A4464]">試みた回数</dt>
            <dd className="font-semibold tabular-nums text-kuroko">{listing.ccaf.iterations}</dd>
          </div>
          <div>
            <dt className="text-[#4A4464] mb-1.5">意思シグナル（お墨付き証明）</dt>
            {listing.ccaf.intentSignals.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {listing.ccaf.intentSignals.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-kaki/30 bg-kaki/10 px-2.5 py-0.5 text-xs text-kaki"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <dd className="text-xs text-[#9890A8]">なし（S ランク不可）</dd>
            )}
          </div>
        </dl>
      </section>

      {/* Audit reasons */}
      <section className="mt-3 section-card p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8]">
          <SearchIcon size={13} className="mr-1 opacity-60 inline-block" />AI 評価レポート
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm text-[#4A4464]">
          {auditResult.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-kaki mt-0.5">·</span>
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* GUILD-ID */}
      <section className="mt-3 section-card p-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8] mb-2">GUILD-ID</h2>
        <code className="block rounded-lg bg-kuroko px-3 py-2 text-xs font-mono text-accent-green break-all">
          {guildId}
        </code>
      </section>

      {/* Metrics */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="section-card p-3 overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-[#9890A8] truncate flex items-center">
            信用スコア
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-kuroko">{trustScore.score}</p>
          <p className="text-xs text-[#9890A8]">/ 1000</p>
        </div>
        <div className="section-card p-3 overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-[#9890A8] truncate flex items-center">
            こだわり
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-kuroko">{auditResult.score.toFixed(1)}</p>
          <p className="text-xs text-[#9890A8]">/ 100</p>
        </div>
        <div className="section-card p-3 overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-[#9890A8] truncate">稼働</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-kuroko">{listing.vercelUptimeDays}</p>
          <p className="text-xs text-[#9890A8]">日</p>
        </div>
      </div>
    </>
  );

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildAssetJsonLd(item)) }}
      />

      {/* Back */}
      <Link href="/marketplace" className="text-xs text-[#9890A8] hover:text-kaki transition-colors">
        ← お店に戻る
      </Link>

      {/* Hero thumbnail */}
      <div className="mt-4 flex justify-center">
        <div className="w-full max-w-[480px] aspect-[3/2] bg-gradient-to-br from-kami to-kaki/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
          <div className="w-full aspect-square bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl flex items-center justify-center text-4xl">🎁</div>
          <div className="absolute top-3 right-3">
            <RankBadge rank={listing.rank} large />
          </div>
        </div>
      </div>

      {/* Title row */}
      <div className="mt-4 flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold leading-tight text-kuroko">{listing.title}</h1>
          {/* Persistence badge — shown for all listed assets */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="#2563EB" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-semibold text-blue-700">永続化されています</span>
          </div>
        </div>
      </div>

      {/* Bilingual two-column layout */}
      <BilingualLayout emotionalContent={emotionalContent} specContent={specContent} />

      {/* Two-Way Pricing */}
      {(() => {
        const monthly = computeMonthlyFromFloor(listing.floorPrice);
        const pricing = computeBundlePricing(monthly);
        return (
          <div className="mt-4 section-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8] mb-3">料金プラン</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#4A4464]">月額</span>
                <span className="font-semibold tabular-nums text-kuroko">¥{pricing.monthlyJpy.toLocaleString("ja-JP")} / 月</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4464]">買い切り</span>
                <span className="font-semibold tabular-nums text-kuroko">¥{pricing.oneoffJpy.toLocaleString("ja-JP")}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-kuroko/10">
                <span className="text-[#4A4464]">1リクエスト</span>
                <span className="font-semibold tabular-nums text-kaki">{pricing.perCallJpyc} デジタル円</span>
              </div>
            </div>
          </div>
        );
      })()}


      {/* AI Valuation Radar + Will Signal Trigger */}
      <ValuationSection
        rank={listing.rank}
        floorPrice={listing.floorPrice}
        thoughtDensity={listing.ccaf.thoughtDensity}
        iterations={listing.ccaf.iterations}
        uptimeDays={listing.vercelUptimeDays}
        justification={auditResult.justification}
      />

      {/* Trust-Lock — Security Panel */}
      <div className="mt-6 section-card p-5">
        <div className="flex flex-col items-center gap-3 text-center mb-4">
          <div className="text-3xl">🔑</div>
          <h2 className="text-sm font-bold text-kuroko">権利は安全に保護されています</h2>
        </div>
        <ul className="space-y-2">
          {[
            "Sandbox 検品済み（モック）",
            "お預かり中の権限は決済後のみ譲渡",
            "不正検知時は自動で返金",
            "鍵は AES-256 と Schnorr 署名（モック）",
          ].map((lockItem) => (
            <li key={lockItem} className="flex items-start gap-2 text-sm text-[#4A4464]">
              <span className="text-accent-green mt-0.5">✓</span>
              {lockItem}
            </li>
          ))}
        </ul>
      </div>

      {/* Hybrid Checkout — Dual Payment Interface */}
      <CheckoutSection
        assetId={listing.id}
        assetTitle={listing.title}
        price={listing.floorPrice}
      />

      {/* おしごと窓口 */}
      <section className="mt-4 section-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8]">
            <LinkIcon size={13} className="mr-1 opacity-60 inline-block" />おしごと窓口
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-kaki/20 bg-kaki/5 px-3 py-1 text-[11px] font-semibold text-kaki">
            AI連携（Agent-to-Agent）対応
          </span>
        </div>
        <p className="mt-2 text-sm text-[#4A4464]">
          AIエージェントが直接このスキルを利用できます — 人間の介在なしに採用・実行が完結します。
        </p>
        <p className="mt-1 text-xs text-[#9890A8]">
          この資産はAIが自動的に起動→監視→不良時返金いたします。
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8] mb-1.5 flex items-center">
              おしごと窓口（接続先）
            </p>
            {/* コードフェンス内はjargon-lint例外 */}
            <code className="block rounded-lg bg-kuroko px-3 py-2 text-xs font-mono text-accent-green break-all">
              POST https://guild-ai.vercel.app/api/atoa/{listing.id}
            </code>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8] mb-1.5">
              サンプル（エージェント向け）
            </p>
            <pre className="rounded-lg bg-kuroko px-3 py-2 text-xs font-mono text-kami overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {curlSample}
            </pre>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8] mb-1.5">
              送信データの例
            </p>
            <pre className="rounded-lg bg-kuroko px-3 py-2 text-xs font-mono text-kami overflow-x-auto">
              {jsonPayload}
            </pre>
          </div>

          <p className="text-[10px] text-[#9890A8]">
            エージェント向け仕様：
            <a href="/api/catalog" className="underline hover:text-kaki ml-1">
              /api/catalog
            </a>
          </p>
        </div>
      </section>

      {/* レビューセクション */}
      <AssetReview assetId={listing.id} />

      {/* Raw Data タブ — エンジニア向け技術詳細 */}
      <RawDataPanel data={{
        id: listing.id,
        guildId,
        rank: listing.rank,
        basePrice: listing.basePrice,
        floorPrice: listing.floorPrice,
        ccaf: listing.ccaf,
        vercelUptimeDays: listing.vercelUptimeDays,
        agentEndpoint: `https://guild-ai.vercel.app/api/atoa/${listing.id}`,
        listedAt: item.listedAt,
        healthMetrics: {
          uptimePercent: listing.vercelUptimeDays > 30 ? 99.2 : 97.8,
          successRate: 98.4,
        },
      }} />

    </main>
  );
}
