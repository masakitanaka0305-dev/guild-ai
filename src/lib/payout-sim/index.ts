// GUILD AI — Net Payout Simulation
// Calculates net income from a project after rental fees and platform fee.

export interface PayoutSimInput {
  grossJpy: number;
  rentalFees: number[];     // one entry per rented MD (JPY)
  platformFeePct: number;   // e.g. 5 = 5%
}

export interface PayoutBreakdown {
  grossJpy: number;
  totalRentalJpy: number;
  platformFeeJpy: number;
  netJpy: number;
}

export function calcNet(input: PayoutSimInput): PayoutBreakdown {
  const totalRentalJpy = input.rentalFees.reduce((s, f) => s + f, 0);
  const platformFeeJpy = Math.round(input.grossJpy * input.platformFeePct / 100);
  const netJpy = input.grossJpy - totalRentalJpy - platformFeeJpy;
  return {
    grossJpy: input.grossJpy,
    totalRentalJpy,
    platformFeeJpy,
    netJpy,
  };
}

export function formatJpy(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}
