// GUILD AI — Net Payout Simulation
// Calculates net income from a project after rental fees and platform fee.

import type { Rank } from "@/types";

const RANK_SCORE: Record<Rank, number> = { S: 3, A: 2, B: 1, D: 0 };

export interface RentalFee {
  mdId: string;
  jpy: number;
}

export interface OwnedMdRef {
  id: string;
  rank: Rank;
}

export interface RequiredMdRef {
  id: string;
  rankMin: Rank;
  weight: number;
  /** Hours expected for this MD if rented (defaults to 40h). */
  rentalHours?: number;
}

export interface LegacyPayoutInput {
  grossJpy: number;
  /** Array of pre-computed rental fees in JPY (one entry per MD rented). */
  rentalFees: number[];
  platformFeePct: number;
}

export interface RichPayoutInput {
  grossJpy: number;
  ownedMds: OwnedMdRef[];
  requiredMds: RequiredMdRef[];
  /** Hourly rental fee in JPY for unfulfilled MDs. */
  rentalFeeHourlyJpy: number;
  platformFeePct: number;
}

export type PayoutSimInput = LegacyPayoutInput | RichPayoutInput;

export interface PayoutBreakdown {
  grossJpy: number;
  /** Per-MD rental fees. Empty array when ownership covers all requirements. */
  rentalFees: RentalFee[];
  totalRentalJpy: number;
  platformFeeJpy: number;
  netJpy: number;
  /** Alias for netJpy — matches the spec terminology. */
  net: number;
  warning?: "underwater";
}

function isRichInput(input: PayoutSimInput): input is RichPayoutInput {
  return Array.isArray((input as RichPayoutInput).requiredMds);
}

function ownedSatisfies(owned: OwnedMdRef | undefined, req: RequiredMdRef): boolean {
  if (!owned) return false;
  return RANK_SCORE[owned.rank] >= RANK_SCORE[req.rankMin];
}

export function calcNet(input: PayoutSimInput): PayoutBreakdown {
  const grossJpy = input.grossJpy;
  const platformFeeJpy = Math.round(grossJpy * input.platformFeePct / 100);

  let rentalFees: RentalFee[];

  if (isRichInput(input)) {
    rentalFees = [];
    for (const req of input.requiredMds) {
      const owned = input.ownedMds.find((m) => m.id === req.id);
      if (ownedSatisfies(owned, req)) continue; // requirement met — no rental
      const hours = req.rentalHours ?? 40;
      const fee = Math.round(input.rentalFeeHourlyJpy * hours * req.weight);
      rentalFees.push({ mdId: req.id, jpy: fee });
    }
  } else {
    rentalFees = input.rentalFees.map((jpy, i) => ({ mdId: `md_${i}`, jpy }));
  }

  const totalRentalJpy = rentalFees.reduce((s, f) => s + f.jpy, 0);
  const netJpy = grossJpy - totalRentalJpy - platformFeeJpy;

  return {
    grossJpy,
    rentalFees,
    totalRentalJpy,
    platformFeeJpy,
    netJpy,
    net: netJpy,
    ...(netJpy < 0 ? { warning: "underwater" as const } : {}),
  };
}

export function formatJpy(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}
