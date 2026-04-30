// GUILD AI — Shared types
// Cross-referenced from docs/マスター設計図.md (Single Source of Truth).

export type Rank = "S" | "A" | "B" | "D";

/**
 * CCAF = Cognitive Context Audit File.
 * Structured proof-of-thought document used by ai-auditor.
 */
export interface CCAF {
  intentSignals: string[]; // Human-intent signals (required for S rank — 魂の登記)
  thoughtDensity: number; // 0-100
  iterations: number; // attempt count
  authorId: string;
  createdAt: string; // ISO8601
}

/**
 * Listing = a registered piece of intelligence (知能資産).
 * Inherits the listing_008 structure referenced in the spec.
 */
export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  ccaf: CCAF;
  vercelUptimeDays: number;
  rank: Rank;
  basePrice: number;
  floorPrice: number;
  githubUrl?: string;
  remixedFrom?: string; // parent asset ID — royalty lineage anchor
  proofOfMakeNote?: string; // voice transcript displayed as "クリエイターのこだわり"
}

/**
 * TrustScoreInput — inputs for Trust Score calculation.
 * Base weights: 0.5 * qualityHistory + 0.3 * discordContribution + 0.2 * xAmplification
 * EtoE-enhanced (when peerRatings/peerComments provided):
 *   0.4q + 0.2d + 0.15x + 0.15 * peerRatingsAvg + 0.10 * peerCommentsLog
 */
export interface TrustScoreInput {
  qualityHistory: number;      // 0-100
  discordContribution: number; // 0-100
  xAmplification: number;      // 0-100
  peerRatings?: number[];      // 5-star ratings from peers (EtoE) — optional
  peerComments?: number;       // count of peer text comments (EtoE) — optional
}

export interface TrustScoreResult {
  raw: number; // 0-100
  score: number; // 0-1000 (raw * 10)
  rank: Rank;
  updatedAt: string;
}

export type DiscordActionKind = "share" | "endorse" | "react" | "bug-report";

export interface DiscordEvent {
  userId: string;
  kind: DiscordActionKind;
  listingId: string;
  occurredAt: string; // ISO8601
}

export interface AuditResult {
  rank: Rank;
  score: number; // composite score (0-100)
  reasons: string[];
  justification?: string; // AI解説サマリー
  feedback?: string[];    // improvement advice (populated for D rank)
}

// ─── Marketplace ───────────────────────────────────────────────────────────

export interface MarketplaceListing {
  listing: Listing;
  auditResult: AuditResult;
  trustScore: TrustScoreResult;
  listedAt: string; // ISO8601
}

// ─── Ownership / Transfer ──────────────────────────────────────────────────

export interface OwnershipRecord {
  assetId: string;
  ownerId: string;
  acquiredAt: string; // ISO8601
  deployUrl: string; // Vercel Deploy Button URL
  assetTitle: string;
}

// ─── Royalty ───────────────────────────────────────────────────────────────

/** Ancestor chain, oldest creator first, newest (direct parent) last. */
export interface Creator {
  creatorId: string;
  name: string;
}

export interface RoyaltyDistribution {
  creatorId: string;
  name: string;
  amount: number; // JPY
  trustScoreBonus: number; // Trust Score points added
  generation: number; // 1 = direct parent, 2 = grandparent, …
}

export interface RoyaltyResult {
  distributions: RoyaltyDistribution[];
  totalRoyaltyPaid: number;
  sellerNet: number;
}

// ─── Payments / Checkout ──────────────────────────────────────────────────────

export type PaymentMethod = "card" | "bank" | "jpyc" | "onramp";
export type Currency = "JPY" | "JPYC";

export interface CheckoutSession {
  id: string;
  assetId: string;
  buyerId: string;
  amountJpy: number;
  amountJpyc: number; // always 1:1 with amountJpy
  method: PaymentMethod;
  payoutCurrency: Currency;
  status: "pending" | "settled" | "failed";
  createdAt: string;
}

export interface PaymentResult {
  sessionId: string;
  status: "settled" | "failed";
  receiptUrl?: string;
  txHash?: string;
}

export interface PayoutPreference {
  creatorId: string;
  currency: Currency;
  walletId?: string;
}

// ─── Escrow ───────────────────────────────────────────────────────────────────

export type EscrowStatus = "held" | "confirmed" | "released";

export interface EscrowRecord {
  id: string;
  buyerId: string;
  sellerId: string;
  assetId: string;
  amount: number;
  method: PaymentMethod;
  payoutCurrency: Currency;
  status: EscrowStatus;
  createdAt: string;
  releasedAt?: string;
}

// ─── API Gateway ──────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  buyerId: string;
  assetId: string;
  key: string; // "gld_..." token
  issuedAt: string;
  callCount: number;
}

export interface GatewayLog {
  apiKeyId: string;
  requestedAt: string;
  success: boolean;
  latencyMs: number;
}

// ─── Passbook ─────────────────────────────────────────────────────────────────

export interface PassbookTransaction {
  id: string;
  type: "card" | "jpyc";
  amount: number;
  assetTitle: string;
  at: string; // ISO8601
}

export interface PassbookSnapshot {
  userId: string;
  jpycBalance: number;
  trustScore: number;
  assetCount: number;
  rankBreakdown: { S: number; A: number; B: number };
  recentTransactions: PassbookTransaction[];
  trustHistory: number[]; // 7 data points (oldest → newest)
}

// ─── AtoA Autonomous Execution Engine ────────────────────────────────────────

export interface AgentCatalogEntry {
  id: string;
  title: string;
  description: string;
  rank: Rank;
  floorPrice: number;
  endpoint: string;           // POST /api/atoa/{id}
  tags: string[];
  trustScore: number;         // 0-1000
}

export interface MatchRequest {
  task: string;
  budget?: number;            // JPY upper limit
  tags?: string[];
}

export interface MatchResult {
  agent: AgentCatalogEntry;
  confidence: number;         // 0-1
  reason: string;
}

export interface AtoaEscrowSession {
  id: string;                 // esw_...
  agentId: string;
  callerId: string;
  amount: number;
  status: "held" | "released" | "refunded";
  createdAt: number;
  releasedAt?: number;
}

export interface MicropaymentRecord {
  id: string;                 // pay_...
  escrowId: string;
  agentId: string;
  perCallAmount: number;
  callCount: number;
  totalBilled: number;
  status: "pending" | "settled";
}

export interface AgentInstance {
  instanceId: string;         // inst_...
  agentId: string;
  startedAt: number;
  status: "running" | "healthy" | "degraded" | "stopped";
}

export interface HealthCheckResult {
  instanceId: string;
  ok: boolean;
  latencyMs: number;
  checkedAt: number;
}

export interface AtoaRunResult {
  success: boolean;
  instanceId: string;
  output: string;
  refundIssued: boolean;
  refundReason?: string;
  durationMs: number;
}

export type NotificationType = "job_income" | "royalty" | "rank_up" | "refund" | "ambassador";

export interface IncomeNotification {
  id: string;                 // notif_...
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  read: boolean;
  createdAt: string;
}

// ─── Magic Guild — Weapon & Job ───────────────────────────────────────────────

export interface Weapon {
  id: string;
  title: string;
  noteContent: string;
  rank: Rank;
  score: number;
  tags: string[];
  mintedAt: string; // ISO8601
  jobsCompleted: string[]; // job IDs
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requiredRank: Rank;
  requiredTags: string[];
  reward: number; // JPY
  category: string;
  status: "open" | "applied" | "completed";
}

export interface JobApplication {
  jobId: string;
  weaponId: string;
  appliedAt: string;
  reward: number;
}

// ─── SES Leverage ─────────────────────────────────────────────────────────────

export interface LeverageBreakdown {
  directLabor: number;    // JPY from salary
  royaltyIncome: number;  // JPY from asset royalties
  projectedTrend: number; // JPY projected next period
}

export interface LeverageResult {
  multiplier: number;
  breakdown: LeverageBreakdown;
  totalIncome: number;
}
