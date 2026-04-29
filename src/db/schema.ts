// GUILD AI — Drizzle schema (Postgres)
// Mirrors persistent types from src/types/index.ts.
// Computed types (MarketplaceListing / TrustScoreResult / AuditResult / LeverageResult /
// PassbookSnapshot) are intentionally NOT persisted — they are derived at read time.

import {
  pgTable, pgEnum, text, integer, jsonb, timestamp, boolean, index, uniqueIndex,
} from "drizzle-orm/pg-core";
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
