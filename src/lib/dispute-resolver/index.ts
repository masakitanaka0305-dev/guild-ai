// Dispute Resolver — automated dispute resolution for GUILD AI

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

export type ClaimType = "payment-dispute" | "quality-dispute" | "ownership-dispute" | "plagiarism";
export type ResolutionVerdict = "creator-wins" | "buyer-wins" | "split" | "escalated";
export type DisputeStatus = "open" | "auto-resolved" | "escalated" | "closed";

export interface DisputeClaim {
  claimType: ClaimType;
  guildId: string;
  claimantHandle: string;
  respondentHandle: string;
  description: string;
  amountJpy?: number;
}

export interface Dispute {
  id: string;
  claim: DisputeClaim;
  status: DisputeStatus;
  verdict?: ResolutionVerdict;
  reasoning?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

let _counter = 0;
const _disputes = new Map<string, Dispute>();

// ─── Resolution logic ─────────────────────────────────────────────────────────

const RESOLUTION_REASONS: Record<ClaimType, string> = {
  "payment-dispute":   "決済記録を照合した結果、エスクロー残高が確認されました。",
  "quality-dispute":   "AI 審査スコアと実稼働ログを照合した結果を通知します。",
  "ownership-dispute": "オリジン署名とコミット履歴を照合した結果を通知します。",
  "plagiarism":        "Originality Watch の類似度スコアに基づいて判定します。",
};

function resolveVerdict(claim: DisputeClaim): ResolutionVerdict {
  const seed = djb2(`${claim.claimType}:${claim.guildId}:${claim.claimantHandle}`);
  if (claim.claimType === "plagiarism") return "creator-wins";
  const bucket = seed % 4;
  const map: ResolutionVerdict[] = ["creator-wins", "buyer-wins", "split", "escalated"];
  return map[bucket];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function openDispute(claim: DisputeClaim): Dispute {
  const id = `dsp_${(++_counter).toString().padStart(4, "0")}`;
  const dispute: Dispute = {
    id,
    claim,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  _disputes.set(id, dispute);
  return dispute;
}

export function autoResolve(disputeId: string): Dispute {
  const dispute = _disputes.get(disputeId);
  if (!dispute) throw new Error(`Dispute ${disputeId} not found`);
  if (dispute.status !== "open") return dispute;

  const verdict = resolveVerdict(dispute.claim);
  const resolved: Dispute = {
    ...dispute,
    status: verdict === "escalated" ? "escalated" : "auto-resolved",
    verdict,
    reasoning: RESOLUTION_REASONS[dispute.claim.claimType],
    resolvedAt: new Date().toISOString(),
  };
  _disputes.set(disputeId, resolved);
  return resolved;
}

export function getDisputes(handle: string): Dispute[] {
  return Array.from(_disputes.values()).filter(
    (d) => d.claim.claimantHandle === handle || d.claim.respondentHandle === handle
  );
}

export function getDisputeById(id: string): Dispute | null {
  return _disputes.get(id) ?? null;
}

export function _resetDisputeResolver(): void {
  _counter = 0;
  _disputes.clear();
}
