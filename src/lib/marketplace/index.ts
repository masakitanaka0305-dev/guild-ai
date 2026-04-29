// GUILD AI — Smart Marketplace
// autoList() converts an audited Listing into a MarketplaceListing automatically.
// Spec: docs/マスター設計図.md §5 (自動出品).

import type { Listing, MarketplaceListing, TrustScoreInput } from "@/types";
import { audit } from "@/lib/ai-auditor";
import { computeFloorPrice } from "@/lib/ai-auditor";
import { computeTrustScore } from "@/lib/trust-score";

type ListingInput = Omit<Listing, "rank" | "floorPrice"> & { mdContent?: string };

/**
 * autoList — takes a raw Listing + Trust Score inputs, runs the AI Auditor,
 * computes Floor Price, and returns a ready-to-display MarketplaceListing.
 */
export function autoList(
  listing: ListingInput,
  trustInput: TrustScoreInput,
  listedAt = "2026-04-28T00:00:00.000Z"
): MarketplaceListing {
  const auditResult = audit({ ccaf: listing.ccaf, vercelUptimeDays: listing.vercelUptimeDays, mdContent: listing.mdContent });
  const trustScore = computeTrustScore(trustInput);
  const floorPrice = computeFloorPrice(listing.basePrice, trustScore.score);
  return {
    listing: { ...listing, rank: auditResult.rank, floorPrice },
    auditResult,
    trustScore: { ...trustScore, updatedAt: listedAt },
    listedAt,
  };
}

// ─── Sort / Filter helpers ─────────────────────────────────────────────────

export type SortKey = "ccaf" | "trust" | "price";

export function sortListings(items: MarketplaceListing[], key: SortKey): MarketplaceListing[] {
  return [...items].sort((a, b) => {
    if (key === "ccaf") return b.auditResult.score - a.auditResult.score;
    if (key === "trust") return b.trustScore.score - a.trustScore.score;
    return a.listing.floorPrice - b.listing.floorPrice;
  });
}

export interface FilterOptions {
  ranks: ("S" | "A" | "B")[];
  minTrustScore: number;
}

export function filterListings(items: MarketplaceListing[], opts: FilterOptions): MarketplaceListing[] {
  return items.filter(
    (item) =>
      opts.ranks.includes(item.listing.rank) &&
      item.trustScore.score >= opts.minTrustScore
  );
}

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_RAW: Array<{
  listing: ListingInput;
  trustInput: TrustScoreInput;
  listedAt: string;
}> = [
  {
    listedAt: "2026-01-20T00:00:00.000Z",
    listing: {
      id: "asset-001",
      ownerId: "creator-001",
      title: "AI コード補完エンジン β",
      description:
        "TypeScript/Python に対応した意図駆動コード補完エンジン。Proof of Thought により設計意図が API として公開される。",
      ccaf: {
        intentSignals: ["設計レビュー済み", "ペアプロ実施", "author-statement"],
        thoughtDensity: 92,
        iterations: 28,
        authorId: "creator-001",
        createdAt: "2026-01-15T00:00:00.000Z",
      },
      vercelUptimeDays: 45,
      basePrice: 50000,
      githubUrl: "https://github.com/guild-ai/code-complete-beta",
      mdContent: `
async function complete(input: string) { }
function validate(data: unknown) { }
class CompletionEngine { }
// test example: output: { result: "ok" }
`,
    },
    trustInput: { qualityHistory: 88, discordContribution: 75, xAmplification: 60 },
  },
  {
    listedAt: "2026-01-12T00:00:00.000Z",
    listing: {
      id: "asset-002",
      ownerId: "creator-002",
      title: "自然言語 SQL ジェネレーター",
      description:
        "日本語の問いをそのまま SQL に変換。要件定義フェーズからの深い文脈を CCAF に記録。",
      ccaf: {
        intentSignals: ["要件定義参加", "ユーザーインタビュー反映"],
        thoughtDensity: 85,
        iterations: 34,
        authorId: "creator-002",
        createdAt: "2026-01-08T00:00:00.000Z",
      },
      vercelUptimeDays: 60,
      basePrice: 80000,
      githubUrl: "https://github.com/guild-ai/nl-sql-gen",
    },
    trustInput: { qualityHistory: 92, discordContribution: 68, xAmplification: 71 },
  },
  {
    listedAt: "2026-02-05T00:00:00.000Z",
    listing: {
      id: "asset-003",
      ownerId: "creator-003",
      title: "マルチモーダル検索 SDK",
      description:
        "テキスト・画像・音声を横断する検索 SDK。アーキテクチャ設計書付きで拡張性を担保。",
      ccaf: {
        intentSignals: ["アーキテクチャ設計書あり"],
        thoughtDensity: 72,
        iterations: 19,
        authorId: "creator-003",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      vercelUptimeDays: 21,
      basePrice: 30000,
      githubUrl: "https://github.com/guild-ai/multimodal-search",
    },
    trustInput: { qualityHistory: 70, discordContribution: 62, xAmplification: 45 },
  },
  {
    listedAt: "2026-02-15T00:00:00.000Z",
    listing: {
      id: "asset-004",
      ownerId: "creator-004",
      title: "ドキュメント自動生成ツール",
      description:
        "コードベースを解析し、API ドキュメントと README を自動生成。CI に組み込み可能。",
      ccaf: {
        intentSignals: [],
        thoughtDensity: 65,
        iterations: 12,
        authorId: "creator-004",
        createdAt: "2026-02-10T00:00:00.000Z",
      },
      vercelUptimeDays: 14,
      basePrice: 20000,
      githubUrl: "https://github.com/guild-ai/doc-gen",
    },
    trustInput: { qualityHistory: 68, discordContribution: 55, xAmplification: 38 },
  },
  {
    listedAt: "2026-03-05T00:00:00.000Z",
    listing: {
      id: "asset-005",
      ownerId: "creator-005",
      title: "データクリーニング スクリプト集",
      description:
        "CSV/JSON の欠損値処理・外れ値検出・正規化をワンライナーで実現するスクリプトパック。",
      ccaf: {
        intentSignals: [],
        thoughtDensity: 50,
        iterations: 8,
        authorId: "creator-005",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      vercelUptimeDays: 5,
      basePrice: 8000,
    },
    trustInput: { qualityHistory: 55, discordContribution: 40, xAmplification: 30 },
  },
  {
    listedAt: "2026-03-20T00:00:00.000Z",
    listing: {
      id: "asset-006",
      ownerId: "creator-006",
      title: "CSV → JSON コンバーター",
      description:
        "シンプルな CSV → JSON 双方向変換ツール。ネスト構造とカスタムデリミタに対応。",
      ccaf: {
        intentSignals: [],
        thoughtDensity: 42,
        iterations: 5,
        authorId: "creator-006",
        createdAt: "2026-03-15T00:00:00.000Z",
      },
      vercelUptimeDays: 2,
      basePrice: 3000,
    },
    trustInput: { qualityHistory: 45, discordContribution: 30, xAmplification: 20 },
  },
];

export const MOCK_MARKETPLACE: MarketplaceListing[] = MOCK_RAW.map(({ listing, trustInput, listedAt }) =>
  autoList(listing, trustInput, listedAt)
);
