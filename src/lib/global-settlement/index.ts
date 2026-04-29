import { distributeWithFallback } from "@/lib/persistence-protocol";
import { accumulate, jpyToMilli } from "@/lib/shima-ledger";

export type Currency = "JPY" | "USD" | "EUR" | "GBP";

export const FX_RATES: Record<Currency, number> = {
  JPY: 1,
  USD: 152.4,
  EUR: 165.2,
  GBP: 192.8,
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  JPY: "日本円",
  USD: "米ドル",
  EUR: "ユーロ",
  GBP: "英ポンド",
};

export interface SettleInput {
  payerCurrency: Currency;
  amount: number;
  payerType: "human" | "agent" | "big-ai";
  knowledgeIndex: number; // 0–100
}

export interface DistributionEntry {
  guildId: string;
  amountJpy: number;
  currency: Currency;
}

export interface SettleResult {
  totalJpyEq: number;
  distributions: DistributionEntry[];
  settledAtMs: number;
}

export interface SettlementRecord extends SettleResult {
  id: string;
  input: SettleInput;
  lineageRoot: string;
}

// ─── Knowledge index → bonus multiplier ──────────────────────────────────────

function knowledgeMultiplier(index: number): number {
  // 0–100 → 1.0–1.25 bonus
  return 1 + Math.min(100, Math.max(0, index)) * 0.0025;
}

// ─── Settlement history ───────────────────────────────────────────────────────

const settlementHistory: SettlementRecord[] = [];

export function getRecentSettlements(limit = 5): SettlementRecord[] {
  return settlementHistory.slice(0, limit);
}

export function getSettlementSummary(hours = 24): Record<Currency, number> {
  const cutoff = Date.now() - hours * 3_600_000;
  const summary: Record<Currency, number> = { JPY: 0, USD: 0, EUR: 0, GBP: 0 };
  for (const rec of settlementHistory) {
    if (rec.settledAtMs >= cutoff) {
      summary[rec.input.payerCurrency] += rec.totalJpyEq;
    }
  }
  return summary;
}

// ─── Core settle ─────────────────────────────────────────────────────────────

export function settle(input: SettleInput, lineageRoot: string): SettleResult {
  // 1. Convert to JPY-equivalent (full float, milli precision via accumulate)
  const fxRate = FX_RATES[input.payerCurrency];
  const rawJpyEq = input.amount * fxRate;

  // 2. Apply knowledge multiplier
  const multiplier = knowledgeMultiplier(input.knowledgeIndex);
  const totalJpyEq = rawJpyEq * multiplier;

  // 3. Distribute with fallback (tombstone-aware)
  const fallbackResult = distributeWithFallback(lineageRoot, totalJpyEq);

  // 4. Accumulate each recipient's share in shima-ledger (milli-jpy precision)
  const distributions: DistributionEntry[] = [];
  for (const [guildId, amountJpy] of Object.entries(fallbackResult.distribution)) {
    if (amountJpy > 0) {
      accumulate(guildId, jpyToMilli(amountJpy));
      distributions.push({ guildId, amountJpy, currency: input.payerCurrency });
    }
  }

  // 5. Also accumulate index-fund share for demo-user
  if (fallbackResult.indexFundJpy > 0) {
    accumulate("demo-user", jpyToMilli(fallbackResult.indexFundJpy));
    distributions.push({
      guildId: "index-fund",
      amountJpy: fallbackResult.indexFundJpy,
      currency: input.payerCurrency,
    });
  }

  const result: SettleResult = {
    totalJpyEq,
    distributions,
    settledAtMs: Date.now(),
  };

  // 6. Record in history
  const record: SettlementRecord = {
    ...result,
    id: `settle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    input,
    lineageRoot,
  };
  settlementHistory.unshift(record);
  if (settlementHistory.length > 100) settlementHistory.pop();

  return result;
}

// ─── Seed demo settlements for profile page ───────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

export function seedDemoSettlements(): void {
  if (settlementHistory.length > 0) return;
  const currencies: Currency[] = ["JPY", "USD", "EUR", "GBP"];
  const payerTypes: SettleInput["payerType"][] = ["human", "agent", "big-ai"];

  for (let i = 0; i < 20; i++) {
    const seed = djb2(`demo_settle_${i}`);
    const currency = currencies[seed % 4];
    const fxRate = FX_RATES[currency];
    const amount = 1 + (seed % 50) / fxRate;
    const payerType = payerTypes[seed % 3];
    const knowledgeIndex = 30 + (seed % 60);

    const input: SettleInput = { payerCurrency: currency, amount, payerType, knowledgeIndex };
    settle(input, "GUILD:0001-TS01-PAT1");
  }
}

export function _resetSettlements(): void {
  settlementHistory.length = 0;
}
