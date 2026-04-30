// GUILD AI — Drizzle schema (Postgres)
// Mirrors persistent types from src/types/index.ts.
// Computed types (MarketplaceListing / TrustScoreResult / AuditResult / LeverageResult /
// PassbookSnapshot) are intentionally NOT persisted — they are derived at read time.

import {
  pgTable, pgEnum, text, integer, jsonb, timestamp, boolean, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { CCAF } from "@/types";

// ─── enums ────────────────────────────────────────────────────────────────────
export const rankEnum                = pgEnum("rank", ["S", "A", "B"]);
export const paymentMethodEnum       = pgEnum("payment_method", ["card", "bank", "jpyc", "onramp"]);
export const currencyEnum            = pgEnum("currency", ["JPY", "JPYC"]);
export const checkoutStatusEnum      = pgEnum("checkout_status", ["pending", "settled", "failed"]);
export const escrowStatusEnum        = pgEnum("escrow_status", ["held", "confirmed", "released"]);
export const discordActionEnum       = pgEnum("discord_action_kind", ["share", "endorse", "react", "bug-report"]);
export const atoaEscrowStatusEnum    = pgEnum("atoa_escrow_status", ["held", "released", "refunded"]);
export const micropaymentStatusEnum  = pgEnum("micropayment_status", ["pending", "settled"]);
export const agentInstanceStatusEnum = pgEnum("agent_instance_status", ["running", "healthy", "degraded", "stopped"]);
export const claimStatusEnum         = pgEnum("claim_status", ["unclaimed", "verifying", "claimed"]);
export const verifyChallengeTypeEnum = pgEnum("verify_challenge_type", ["commit", "file"]);
export const genderEnum              = pgEnum("gender", ["male", "female", "other", "prefer_not_to_say"]);
export const profileStatusEnum       = pgEnum("profile_status", ["provisional", "official"]);

// ─── users ───────────────────────────────────────────────────────────────────
// 個人情報をメインに保持する。auth は email + password (scrypt-hashed) のシンプル構成。
// 住所・氏名・電話等は任意（ただし氏名と生年月日は新規登録時に推奨）。
export const users = pgTable("users", {
  id:                text("id").primaryKey(),                       // usr_<random>
  email:             text("email").notNull(),                        // login key (unique)
  passwordHash:      text("password_hash").notNull(),                // "scrypt:<saltHex>:<hashHex>"
  displayName:       text("display_name").notNull(),                 // 表示名（公開）
  // 氏名（漢字 + ふりがな）
  lastNameKanji:     text("last_name_kanji"),
  firstNameKanji:    text("first_name_kanji"),
  lastNameKana:      text("last_name_kana"),
  firstNameKana:     text("first_name_kana"),
  // 個人属性
  birthDate:         text("birth_date"),                              // YYYY-MM-DD
  gender:            genderEnum("gender"),
  phone:             text("phone"),
  // 住所
  postalCode:        text("postal_code"),
  prefecture:        text("prefecture"),
  city:              text("city"),
  addressLine1:      text("address_line1"),
  addressLine2:      text("address_line2"),
  // 同意・タイムスタンプ
  agreedToTermsAt:   timestamp("agreed_to_terms_at",  { withTimezone: true }),
  createdAt:         timestamp("created_at",          { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp("updated_at",          { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("users_email_uniq").on(t.email),
]);

// ─── sessions ────────────────────────────────────────────────────────────────
// HttpOnly cookie に保存される token を主キーとした session 表。
export const sessions = pgTable("sessions", {
  token:     text("token").primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("sessions_user_idx").on(t.userId),
]);

// ─── profiles ────────────────────────────────────────────────────────────────
// エンジニアのプロファイル — 入力ゼロを目指すマッチング用。
// 姓名/都道府県/生年は本人入力（オンボーディング画面の3項目）。残りは GitHub から自動抽出。
// status: "provisional" = Google ログインのみ / GitHub 未連携。"official" = GitHub 連携済み + 解析完了。
export const profiles = pgTable("profiles", {
  userId:             text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  // 本人入力（最小）
  lastName:           text("last_name"),
  firstName:          text("first_name"),
  prefecture:         text("prefecture"),
  birthYear:          integer("birth_year"),
  // GitHub 自動抽出
  primarySkills:      jsonb("primary_skills").$type<string[]>(),                 // 上位3言語/フレームワーク
  aiGeneratedSummary: text("ai_generated_summary"),                              // 20文字キャッチコピー
  githubStats:        jsonb("github_stats").$type<{
    stars:           number;
    contributions:   number;
    activeYears:     number;
    publicRepos:     number;
    pinnedRepoNames: string[];
  }>(),
  // 鑑定ランク（GitHub 連携後に確定）
  rank:               rankEnum("rank"),
  status:             profileStatusEnum("status").notNull().default("provisional"),
  // 最終活動 — GitHub 最終 commit 同期時刻
  lastActiveAt:       timestamp("last_active_at", { withTimezone: true }),
  createdAt:          timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:          timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── listings ────────────────────────────────────────────────────────────────
// rank / floor_price are cached at write time (autoList in lib/marketplace).
// Recompute & UPDATE on listing or trust-score change; audited_at tracks staleness.
export const listings = pgTable("listings", {
  id:               text("id").primaryKey(),
  ownerId:          text("owner_id").notNull(),
  title:            text("title").notNull(),
  description:      text("description").notNull(),
  ccaf:             jsonb("ccaf").$type<CCAF>().notNull(),
  vercelUptimeDays: integer("vercel_uptime_days").notNull(),
  basePrice:        integer("base_price").notNull(),
  rank:             rankEnum("rank").notNull(),
  floorPrice:       integer("floor_price").notNull(),
  githubUrl:        text("github_url"),
  remixedFrom:      text("remixed_from"), // soft FK to listings.id (self-ref)
  proofOfMakeNote:  text("proof_of_make_note"),
  createdAt:        timestamp("created_at",  { withTimezone: true }).defaultNow().notNull(),
  auditedAt:        timestamp("audited_at",  { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("listings_owner_idx").on(t.ownerId),
  index("listings_rank_idx").on(t.rank),
  index("listings_remixed_idx").on(t.remixedFrom),
]);

// ─── ownership_records ───────────────────────────────────────────────────────
// History table: append a row on each transfer. Current owner = MAX(acquired_at).
export const ownershipRecords = pgTable("ownership_records", {
  id:         text("id").primaryKey(),
  assetId:    text("asset_id").notNull().references(() => listings.id),
  ownerId:    text("owner_id").notNull(),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).defaultNow().notNull(),
  deployUrl:  text("deploy_url").notNull(),
  assetTitle: text("asset_title").notNull(),
}, (t) => [
  index("ownership_asset_time_idx").on(t.assetId, t.acquiredAt),
  index("ownership_owner_idx").on(t.ownerId),
]);

// ─── checkout_sessions ───────────────────────────────────────────────────────
export const checkoutSessions = pgTable("checkout_sessions", {
  id:             text("id").primaryKey(),               // chk_<ts>_<rand>
  assetId:        text("asset_id").notNull().references(() => listings.id),
  buyerId:        text("buyer_id").notNull(),
  amountJpy:      integer("amount_jpy").notNull(),
  amountJpyc:     integer("amount_jpyc").notNull(),      // 1:1 peg with amountJpy
  method:         paymentMethodEnum("method").notNull(),
  payoutCurrency: currencyEnum("payout_currency").notNull(),
  status:         checkoutStatusEnum("status").notNull().default("pending"),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("checkout_buyer_idx").on(t.buyerId),
  index("checkout_status_idx").on(t.status),
]);

// ─── escrow_records ──────────────────────────────────────────────────────────
export const escrowRecords = pgTable("escrow_records", {
  id:             text("id").primaryKey(),               // escrow-<ts>-<rand>
  buyerId:        text("buyer_id").notNull(),
  sellerId:       text("seller_id").notNull(),
  assetId:        text("asset_id").notNull().references(() => listings.id),
  amount:         integer("amount").notNull(),
  method:         paymentMethodEnum("method").notNull(),
  payoutCurrency: currencyEnum("payout_currency").notNull(),
  status:         escrowStatusEnum("status").notNull().default("held"),
  createdAt:      timestamp("created_at",  { withTimezone: true }).defaultNow().notNull(),
  releasedAt:     timestamp("released_at", { withTimezone: true }),
}, (t) => [
  index("escrow_buyer_idx").on(t.buyerId),
  index("escrow_seller_idx").on(t.sellerId),
  index("escrow_status_idx").on(t.status),
]);

// ─── api_keys ────────────────────────────────────────────────────────────────
// Store SHA-256 hash of the raw token, never the raw token itself. The raw key
// is high-entropy (24 random bytes) so a fast hash like SHA-256 is sufficient —
// no need for password-style KDFs (bcrypt/argon2) here.
// Multiple active keys per (buyer, asset) are allowed (re-purchase, rotation):
// no unique constraint, since lost raw keys cannot be recovered post-hash.
export const apiKeys = pgTable("api_keys", {
  id:        text("id").primaryKey(),                    // key-<ts>-<rand>
  buyerId:   text("buyer_id").notNull(),
  assetId:   text("asset_id").notNull().references(() => listings.id),
  keyHash:   text("key_hash").notNull(),
  issuedAt:  timestamp("issued_at",  { withTimezone: true }).defaultNow().notNull(),
  callCount: integer("call_count").notNull().default(0),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (t) => [
  index("api_keys_buyer_asset_idx").on(t.buyerId, t.assetId),
]);

// ─── gateway_logs ────────────────────────────────────────────────────────────
// High write volume. If QPS gets large, move to KV / append-only storage and keep
// only aggregated counters here.
export const gatewayLogs = pgTable("gateway_logs", {
  id:          text("id").primaryKey(),
  apiKeyId:    text("api_key_id").notNull().references(() => apiKeys.id),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  success:     boolean("success").notNull(),
  latencyMs:   integer("latency_ms").notNull(),
}, (t) => [
  index("gateway_logs_api_key_idx").on(t.apiKeyId, t.requestedAt),
]);

// ─── payout_preferences ──────────────────────────────────────────────────────
export const payoutPreferences = pgTable("payout_preferences", {
  creatorId: text("creator_id").primaryKey(),
  currency:  currencyEnum("currency").notNull().default("JPY"),
  walletId:  text("wallet_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── trust_score_inputs ──────────────────────────────────────────────────────
// Append-only history. Latest row per owner_id is the "current" input.
// Trust Score itself is recomputed on read via lib/trust-score.
export const trustScoreInputs = pgTable("trust_score_inputs", {
  id:                  text("id").primaryKey(),
  ownerId:             text("owner_id").notNull(),
  qualityHistory:      integer("quality_history").notNull(),
  discordContribution: integer("discord_contribution").notNull(),
  xAmplification:      integer("x_amplification").notNull(),
  recordedAt:          timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("trust_owner_time_idx").on(t.ownerId, t.recordedAt),
]);

// ─── discord_events ──────────────────────────────────────────────────────────
// Source data for the discordContribution component of Trust Score.
export const discordEvents = pgTable("discord_events", {
  id:         text("id").primaryKey(),
  userId:     text("user_id").notNull(),
  kind:       discordActionEnum("kind").notNull(),
  listingId:  text("listing_id").notNull().references(() => listings.id),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("discord_user_idx").on(t.userId),
  index("discord_listing_idx").on(t.listingId),
]);

// ─── royalty_payouts (parent) + royalty_distributions (children) ────────────
// One royalty_payouts row per secondary sale. Per-creator splits live in the
// child table — preserving generation/lineage as the canonical record.
export const royaltyPayouts = pgTable("royalty_payouts", {
  id:               text("id").primaryKey(),
  saleAssetId:      text("sale_asset_id").notNull().references(() => listings.id),
  saleAmount:       integer("sale_amount").notNull(),
  totalRoyaltyPaid: integer("total_royalty_paid").notNull(),
  sellerNet:        integer("seller_net").notNull(),
  occurredAt:       timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("royalty_payouts_asset_idx").on(t.saleAssetId, t.occurredAt),
]);

export const royaltyDistributions = pgTable("royalty_distributions", {
  id:              text("id").primaryKey(),
  payoutId:        text("payout_id").notNull().references(() => royaltyPayouts.id, { onDelete: "cascade" }),
  creatorId:       text("creator_id").notNull(),
  creatorName:     text("creator_name").notNull(),
  amount:          integer("amount").notNull(),
  trustScoreBonus: integer("trust_score_bonus").notNull(),
  generation:      integer("generation").notNull(),
}, (t) => [
  index("royalty_dist_payout_idx").on(t.payoutId),
  index("royalty_dist_creator_idx").on(t.creatorId),
]);

// ─── atoa_escrow_sessions ────────────────────────────────────────────────────
// Non-custodial escrow for autonomous Agent-to-Agent transactions.
// Distinct from human escrow (escrow_records) — different domain, status enum.
export const atoaEscrowSessions = pgTable("atoa_escrow_sessions", {
  id:         text("id").primaryKey(),                       // esw_<ts>_<seq>
  agentId:    text("agent_id").notNull(),
  callerId:   text("caller_id").notNull(),
  amount:     integer("amount").notNull(),
  status:     atoaEscrowStatusEnum("status").notNull().default("held"),
  createdAt:  timestamp("created_at",  { withTimezone: true }).defaultNow().notNull(),
  releasedAt: timestamp("released_at", { withTimezone: true }),
}, (t) => [
  index("atoa_escrow_agent_idx").on(t.agentId),
  index("atoa_escrow_status_idx").on(t.status),
]);

// ─── atoa_micropayments ──────────────────────────────────────────────────────
export const atoaMicropayments = pgTable("atoa_micropayments", {
  id:             text("id").primaryKey(),                    // pay_<ts>_<seq>
  escrowId:       text("escrow_id").notNull().references(() => atoaEscrowSessions.id, { onDelete: "cascade" }),
  agentId:        text("agent_id").notNull(),
  perCallAmount:  integer("per_call_amount").notNull(),
  callCount:      integer("call_count").notNull().default(1),
  totalBilled:    integer("total_billed").notNull(),
  status:         micropaymentStatusEnum("status").notNull().default("pending"),
}, (t) => [
  uniqueIndex("atoa_micropay_escrow_uniq").on(t.escrowId),    // 1 record per escrow
  index("atoa_micropay_agent_idx").on(t.agentId),
]);

// ─── agent_instances (atoa-runner) ──────────────────────────────────────────
export const agentInstances = pgTable("agent_instances", {
  instanceId: text("instance_id").primaryKey(),
  agentId:    text("agent_id").notNull(),
  startedAt:  timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  status:     agentInstanceStatusEnum("status").notNull().default("running"),
}, (t) => [
  index("agent_instance_agent_idx").on(t.agentId),
]);

// ─── crawl_claims (lib/crawler) ──────────────────────────────────────────────
// One row per crawled repo URL. Status updated as claim flow progresses.
export const crawlClaims = pgTable("crawl_claims", {
  repoUrl:   text("repo_url").primaryKey(),
  status:    claimStatusEnum("status").notNull().default("unclaimed"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── discord_user_state (lib/discord-bridge) ────────────────────────────────
// Per-user daily ingest state + cumulative contribution. One row per user.
export const discordUserState = pgTable("discord_user_state", {
  userId:            text("user_id").primaryKey(),
  currentDate:       text("current_date").notNull(),         // YYYY-MM-DD
  earnedToday:       integer("earned_today").notNull().default(0),
  contributionTotal: integer("contribution_total").notNull().default(0),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── verification_challenges (lib/ownership-verify) ─────────────────────────
// Cryptographic challenges for proving repo ownership. Keyed by `${type}:${repoUrl}`
// to allow simultaneous commit + file challenges per repo.
export const verificationChallenges = pgTable("verification_challenges", {
  key:             text("key").primaryKey(),                  // "commit:<repoUrl>" or "file:<repoUrl>"
  type:            verifyChallengeTypeEnum("type").notNull(),
  repoUrl:         text("repo_url").notNull(),
  token:           text("token").notNull(),
  claimerHandle:   text("claimer_handle"),
  payload:         jsonb("payload").notNull(),                // full challenge object (commit message or expected file contents)
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("verify_challenge_repo_idx").on(t.repoUrl),
]);

// ─── value_pools + value_pool_entries (lib/value-pool) ──────────────────────
// Retroactive reward pool: usage events accumulate per asset; on claim, total
// is released to the claimer (one-shot distributedYet flag).
export const valuePools = pgTable("value_pools", {
  assetId:        text("asset_id").primaryKey(),
  totalPooledJpy: integer("total_pooled_jpy").notNull().default(0),
  sinceDate:      text("since_date").notNull(),               // YYYY-MM-DD
  distributedYet: boolean("distributed_yet").notNull().default(false),
  creditedAt:     timestamp("credited_at", { withTimezone: true }),
  claimerId:      text("claimer_id"),
});

export const valuePoolEntries = pgTable("value_pool_entries", {
  id:        text("id").primaryKey(),
  assetId:   text("asset_id").notNull().references(() => valuePools.assetId, { onDelete: "cascade" }),
  amountJpy: integer("amount_jpy").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("value_pool_entry_asset_idx").on(t.assetId, t.occurredAt),
]);

// ─── audit_policies (v2: dynamic market policy) ─────────────────────────────
// Versioned snapshots of MarketPolicy. Each audit_results_history row
// references the policy_version that was active at audit time, enabling
// "this MD was rated S under growth-v3 policy" auditability.
export const auditPolicies = pgTable("audit_policies", {
  policyVersion: text("policy_version").primaryKey(),
  marketPhase:   text("market_phase").notNull(),                     // bootstrap | growth | competitive | mature
  params:        jsonb("params").notNull(),                          // full MarketPolicy object
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  effectiveTo:   timestamp("effective_to",   { withTimezone: true }),
  createdAt:     timestamp("created_at",     { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("audit_policies_phase_idx").on(t.marketPhase),
  index("audit_policies_effective_idx").on(t.effectiveFrom),
]);

// ─── audit_results_history (v3: every audit result over time) ──────────────
// Append-only log of audits. Latest row per md_id = current rank.
export const auditResultsHistory = pgTable("audit_results_history", {
  id:             text("id").primaryKey(),
  mdId:           text("md_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  auditedAt:      timestamp("audited_at", { withTimezone: true }).defaultNow().notNull(),
  rank:           text("rank").notNull(),                             // "S" | "A" | "B" | "C"
  subRanks:       text("sub_ranks").array().notNull().default([]),    // ["S-Core", "S-Hot"]
  score:          integer("score").notNull(),                         // 0..100 final composite
  layerScores:    jsonb("layer_scores").notNull(),                    // { static, market, longitudinal }
  policyVersion:  text("policy_version").references(() => auditPolicies.policyVersion),
  triggerEvent:   text("trigger_event").notNull(),                    // scheduled-7d | event-purchase | challenge-resolution
  confidence:     integer("confidence").notNull(),                    // 0..100, time-confidence(T)
  rawSignals:     jsonb("raw_signals"),                               // private — full breakdown
}, (t) => [
  index("audit_history_md_idx").on(t.mdId, t.auditedAt),
  index("audit_history_rank_idx").on(t.rank),
]);

// ─── md_market_metrics (v3: period snapshots of market signals) ────────────
export const mdMarketMetrics = pgTable("md_market_metrics", {
  mdId:                    text("md_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  periodStart:             timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd:               timestamp("period_end",   { withTimezone: true }).notNull(),
  purchases:               integer("purchases").notNull().default(0),
  repurchases:             integer("repurchases").notNull().default(0),
  refunds:                 integer("refunds").notNull().default(0),
  saves:                   integer("saves").notNull().default(0),
  apiCalls:                integer("api_calls").notNull().default(0),
  downstreamSuccessScore:  integer("downstream_success_score"),       // nullable: not measured this period
}, (t) => [
  uniqueIndex("md_market_metrics_pk").on(t.mdId, t.periodStart),
]);

// ─── freshness_signals (v3: detected freshness issues per MD) ──────────────
export const freshnessSignals = pgTable("freshness_signals", {
  id:          text("id").primaryKey(),
  mdId:        text("md_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  signalType:  text("signal_type").notNull(),                         // keyword | deprecated_api | version_outdated
  keyword:     text("keyword"),
  centrality:  integer("centrality").notNull().default(50),           // 0..100, how central the keyword is to the MD
  detectedAt:  timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("freshness_signals_md_idx").on(t.mdId),
]);

// ─── freshness_keywords (v3: tech keyword × decay rate table) ──────────────
// Hand-curated catalog of technologies and their typical decay rates.
// E.g. "Next.js 14" decays 0.45/year, "binary search" decays 0.02/year.
export const freshnessKeywords = pgTable("freshness_keywords", {
  pattern:       text("pattern").primaryKey(),                        // regex or literal string
  domain:        text("domain").notNull(),                            // web | ml | infra | algorithm | general
  decayPerYear:  integer("decay_per_year").notNull(),                 // 0..100 (percentage)
  deprecated:    boolean("deprecated").notNull().default(false),
  firstSeenAt:   text("first_seen_at").notNull(),                     // YYYY-MM-DD
  notes:         text("notes"),
});

// ─── md_equity_tokens (v4: knowledge equity tokens) ────────────────────────
// Each MD has 1000 shares. Author starts at 70%; remaining 30% distributable
// to early curators / benchmarkers via auctions. Royalties flow to holders.
export const mdEquityTokens = pgTable("md_equity_tokens", {
  mdId:           text("md_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  holderId:       text("holder_id").notNull(),                        // users.id (loose FK — could be system pool)
  shares:         integer("shares").notNull(),                        // 0..1000
  acquiredAt:     timestamp("acquired_at", { withTimezone: true }).defaultNow().notNull(),
  acquiredPriceJpy: integer("acquired_price_jpy").notNull().default(0),
}, (t) => [
  uniqueIndex("md_equity_pk").on(t.mdId, t.holderId),
  index("md_equity_holder_idx").on(t.holderId),
]);

// ─── audit_stakes (v4: TCR/prediction-market stakes) ───────────────────────
// Curators stake on rank predictions. Correct call → reward; wrong → slash.
export const auditStakes = pgTable("audit_stakes", {
  id:             text("id").primaryKey(),
  mdId:           text("md_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  stakerId:       text("staker_id").notNull(),                       // users.id
  position:       text("position").notNull(),                         // promote | demote | hold
  predictedRank:  text("predicted_rank").notNull(),                   // "S" | "A" | "B" | "C"
  amountJpyc:     integer("amount_jpyc").notNull(),
  stakedAt:       timestamp("staked_at",    { withTimezone: true }).defaultNow().notNull(),
  resolvedAt:     timestamp("resolved_at",  { withTimezone: true }),
  won:            boolean("won"),                                     // null until resolved
  payoutJpyc:     integer("payout_jpyc"),                             // null until resolved
}, (t) => [
  index("audit_stakes_md_idx").on(t.mdId, t.stakedAt),
  index("audit_stakes_staker_idx").on(t.stakerId),
]);

// ─── audit_challenges (v4: dispute mechanism) ──────────────────────────────
export const auditChallenges = pgTable("audit_challenges", {
  id:            text("id").primaryKey(),
  mdId:          text("md_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  challengerId:  text("challenger_id").notNull(),
  originalRank:  text("original_rank").notNull(),
  proposedRank:  text("proposed_rank").notNull(),
  bondJpyc:      integer("bond_jpyc").notNull(),
  status:        text("status").notNull().default("open"),            // open | resolved-overturned | resolved-upheld
  reason:        text("reason"),
  createdAt:     timestamp("created_at",  { withTimezone: true }).defaultNow().notNull(),
  resolvedAt:    timestamp("resolved_at", { withTimezone: true }),
  resolutionNote: text("resolution_note"),
}, (t) => [
  index("audit_challenges_md_idx").on(t.mdId),
  index("audit_challenges_status_idx").on(t.status),
]);

// ─── md_citations (v4: citation graph for PageRank-like flow) ──────────────
export const mdCitations = pgTable("md_citations", {
  citingMd:        text("citing_md").notNull().references(() => listings.id, { onDelete: "cascade" }),
  citedMd:         text("cited_md").notNull().references(() => listings.id, { onDelete: "cascade" }),
  weight:          integer("weight").notNull().default(50),           // 0..100
  detectedMethod:  text("detected_method").notNull(),                 // author-declared | semantic-similarity | etc.
  detectedAt:      timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("md_citations_pk").on(t.citingMd, t.citedMd),
  index("md_citations_cited_idx").on(t.citedMd),
]);

// ─── negative_flags (v4: harmful-MD flags from buyers) ─────────────────────
export const negativeFlags = pgTable("negative_flags", {
  id:          text("id").primaryKey(),
  mdId:        text("md_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  flaggerId:   text("flagger_id").notNull(),
  flagType:    text("flag_type").notNull(),                           // harmful | stale | plagiarism | fake-claim
  bondJpyc:    integer("bond_jpyc").notNull(),
  evidence:    jsonb("evidence"),
  status:      text("status").notNull().default("open"),              // open | confirmed | dismissed
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt:  timestamp("resolved_at", { withTimezone: true }),
}, (t) => [
  index("negative_flags_md_idx").on(t.mdId),
  index("negative_flags_status_idx").on(t.status),
]);

// ─── author_reputation (v3+: per-user score) ───────────────────────────────
export const authorReputation = pgTable("author_reputation", {
  userId:      text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  score:       integer("score").notNull().default(50),                // 0..100, default 50 (neutral cold-start)
  components:  jsonb("components").notNull(),                         // breakdown of score
  updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── inferred row types ──────────────────────────────────────────────────────
export type ListingRow             = typeof listings.$inferSelect;
export type ListingInsert          = typeof listings.$inferInsert;
export type OwnershipRecordRow     = typeof ownershipRecords.$inferSelect;
export type CheckoutSessionRow     = typeof checkoutSessions.$inferSelect;
export type EscrowRecordRow        = typeof escrowRecords.$inferSelect;
export type ApiKeyRow              = typeof apiKeys.$inferSelect;
export type GatewayLogRow          = typeof gatewayLogs.$inferSelect;
export type PayoutPreferenceRow    = typeof payoutPreferences.$inferSelect;
export type TrustScoreInputRow     = typeof trustScoreInputs.$inferSelect;
export type DiscordEventRow        = typeof discordEvents.$inferSelect;
export type RoyaltyPayoutRow       = typeof royaltyPayouts.$inferSelect;
export type RoyaltyDistributionRow = typeof royaltyDistributions.$inferSelect;
export type AtoaEscrowSessionRow      = typeof atoaEscrowSessions.$inferSelect;
export type AtoaMicropaymentRow       = typeof atoaMicropayments.$inferSelect;
export type AgentInstanceRow          = typeof agentInstances.$inferSelect;
export type CrawlClaimRow             = typeof crawlClaims.$inferSelect;
export type DiscordUserStateRow       = typeof discordUserState.$inferSelect;
export type VerificationChallengeRow  = typeof verificationChallenges.$inferSelect;
export type ValuePoolRow              = typeof valuePools.$inferSelect;
export type ValuePoolEntryRow         = typeof valuePoolEntries.$inferSelect;
export type UserRow                   = typeof users.$inferSelect;
export type UserInsert                = typeof users.$inferInsert;
export type SessionRow                = typeof sessions.$inferSelect;
export type ProfileRow                = typeof profiles.$inferSelect;
export type ProfileInsert             = typeof profiles.$inferInsert;
export type AuditPolicyRow            = typeof auditPolicies.$inferSelect;
export type AuditResultHistoryRow     = typeof auditResultsHistory.$inferSelect;
export type MdMarketMetricsRow        = typeof mdMarketMetrics.$inferSelect;
export type FreshnessSignalRow        = typeof freshnessSignals.$inferSelect;
export type FreshnessKeywordRow       = typeof freshnessKeywords.$inferSelect;
export type MdEquityTokenRow          = typeof mdEquityTokens.$inferSelect;
export type AuditStakeRow             = typeof auditStakes.$inferSelect;
export type AuditChallengeRow         = typeof auditChallenges.$inferSelect;
export type MdCitationRow             = typeof mdCitations.$inferSelect;
export type NegativeFlagRow           = typeof negativeFlags.$inferSelect;
export type AuthorReputationRow       = typeof authorReputation.$inferSelect;

// ─── relations (TypeScript-level joins) ──────────────────────────────────────
// Drizzle relations enable type-safe query joins like
// `db.query.users.findFirst({ with: { listings: true, ownerships: true } })`.
// DB-level FK constraints are intentionally NOT added on these columns yet —
// adding strict FKs would cascade-break smoke tests / integration tests that
// insert rows referring to ad-hoc userIds (smoke-creator, fixture-creator, etc.).
// FK enforcement is a follow-up: requires updating each test fixture to seed a
// user row before inserting referencing rows.
export const usersRelations = relations(users, ({ one, many }) => ({
  sessions:           many(sessions),
  profile:            one(profiles, { fields: [users.id], references: [profiles.userId] }),
  ownedListings:      many(listings),
  ownershipRecords:   many(ownershipRecords),
  checkoutSessions:   many(checkoutSessions),
  apiKeys:            many(apiKeys),
  payoutPreference:   many(payoutPreferences),
  trustScoreInputs:   many(trustScoreInputs),
  discordEvents:      many(discordEvents),
  royaltyDistributions: many(royaltyDistributions),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  owner:           one(users, { fields: [listings.ownerId], references: [users.id] }),
  ownerships:      many(ownershipRecords),
  checkoutSessions: many(checkoutSessions),
  apiKeys:         many(apiKeys),
  escrowRecords:   many(escrowRecords),
  royaltyPayouts:  many(royaltyPayouts),
}));

export const ownershipRecordsRelations = relations(ownershipRecords, ({ one }) => ({
  asset: one(listings, { fields: [ownershipRecords.assetId], references: [listings.id] }),
  owner: one(users,    { fields: [ownershipRecords.ownerId], references: [users.id] }),
}));

export const checkoutSessionsRelations = relations(checkoutSessions, ({ one }) => ({
  asset: one(listings, { fields: [checkoutSessions.assetId], references: [listings.id] }),
  buyer: one(users,    { fields: [checkoutSessions.buyerId], references: [users.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  asset: one(listings, { fields: [apiKeys.assetId], references: [listings.id] }),
  buyer: one(users,    { fields: [apiKeys.buyerId], references: [users.id] }),
  logs:  many(gatewayLogs),
}));

export const payoutPreferencesRelations = relations(payoutPreferences, ({ one }) => ({
  creator: one(users, { fields: [payoutPreferences.creatorId], references: [users.id] }),
}));

export const trustScoreInputsRelations = relations(trustScoreInputs, ({ one }) => ({
  owner: one(users, { fields: [trustScoreInputs.ownerId], references: [users.id] }),
}));

export const discordEventsRelations = relations(discordEvents, ({ one }) => ({
  user:    one(users,    { fields: [discordEvents.userId],    references: [users.id] }),
  listing: one(listings, { fields: [discordEvents.listingId], references: [listings.id] }),
}));

export const royaltyDistributionsRelations = relations(royaltyDistributions, ({ one }) => ({
  payout:  one(royaltyPayouts, { fields: [royaltyDistributions.payoutId], references: [royaltyPayouts.id] }),
  creator: one(users,          { fields: [royaltyDistributions.creatorId], references: [users.id] }),
}));

// ─── projects ─────────────────────────────────────────────────────────────────
// Intelligence-driven project marketplace. required_md_interfaces: jsonb array
// of { id, rankMin, weight, label } objects. See src/lib/projects/index.ts.
export const projectStatusEnum = pgEnum("project_status", [
  "open", "applied", "executing", "settling", "settled",
]);

export const projects = pgTable("projects", {
  id:                    text("id").primaryKey(),
  title:                 text("title").notNull(),
  description:           text("description").notNull(),
  industry:              text("industry").notNull(),
  techStack:             jsonb("tech_stack").$type<string[]>().notNull().default([]),
  requiredMdInterfaces:  jsonb("required_md_interfaces").$type<
    { id: string; rankMin: string; weight: number; label: string }[]
  >().notNull().default([]),
  grossRewardJpy:        integer("gross_reward_jpy").notNull(),
  platformFeePct:        integer("platform_fee_pct").notNull().default(5),
  rentalFeeHourlyJpy:    integer("rental_fee_hourly_jpy").notNull().default(0),
  deadline:              text("deadline").notNull(),    // YYYY-MM-DD
  applicantCount:        integer("applicant_count").notNull().default(0),
  clientHandle:          text("client_handle").notNull(),
  sesChallenge:          text("ses_challenge"),
  status:                projectStatusEnum("status").notNull().default("open"),
  createdAt:             timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("projects_status_idx").on(t.status),
  index("projects_industry_idx").on(t.industry),
]);

// ─── escrow_reserves ──────────────────────────────────────────────────────────
// Escrow for project application rental fees. Transitions:
//   pending → executing → settling → settled
export const escrowReserveStatusEnum = pgEnum("escrow_reserve_status", [
  "pending", "executing", "settling", "settled",
]);

export const escrowReserves = pgTable("escrow_reserves", {
  id:                    text("id").primaryKey(),
  projectId:             text("project_id").notNull().references(() => projects.id),
  applicantHandle:       text("applicant_handle").notNull(),
  mdRentalIds:           jsonb("md_rental_ids").$type<string[]>().notNull().default([]),
  totalReservedMilliJpy: integer("total_reserved_milli_jpy").notNull(),
  status:                escrowReserveStatusEnum("status").notNull().default("pending"),
  createdAt:             timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  settledAt:             timestamp("settled_at", { withTimezone: true }),
}, (t) => [
  index("escrow_res_project_idx").on(t.projectId),
  index("escrow_res_applicant_idx").on(t.applicantHandle),
  index("escrow_res_status_idx").on(t.status),
]);

export const projectsRelations = relations(projects, ({ many }) => ({
  escrowReserves: many(escrowReserves),
}));

export const escrowReservesRelations = relations(escrowReserves, ({ one }) => ({
  project: one(projects, { fields: [escrowReserves.projectId], references: [projects.id] }),
}));
