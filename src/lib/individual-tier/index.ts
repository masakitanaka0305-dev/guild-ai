export type TierPlan = "hobby" | "pro-indie" | "enterprise";
export type PayerType = "individual" | "business" | "agent";

export interface TierSpec {
  plan: TierPlan;
  displayName: string;
  monthlyJpy: number;
  includedCalls: number;
  ratePerMin: number;
  commercialOk: boolean;
  note: string;
}

export interface TierQuote {
  plan: TierPlan;
  planName: string;
  included: number;
  usedCalls: number;
  overageCalls: number;
  overageJpy: number;
  totalJpy: number;
  recordedFraction: number; // 1.0 for Pro/Enterprise, 0.3 for Hobby
}

// ─── Tier definitions ─────────────────────────────────────────────────────────

export const TIERS: Record<TierPlan, TierSpec> = {
  "hobby": {
    plan: "hobby",
    displayName: "Hobby",
    monthlyJpy: 0,
    includedCalls: 1_000,
    ratePerMin: 60,
    commercialOk: false,
    note: "個人試作・学習のみ。商用利用不可。",
  },
  "pro-indie": {
    plan: "pro-indie",
    displayName: "Pro Indie",
    monthlyJpy: 1_980,
    includedCalls: 50_000,
    ratePerMin: 600,
    commercialOk: true,
    note: "個人事業主 OK。企業への外注・転売 NG。",
  },
  "enterprise": {
    plan: "enterprise",
    displayName: "Enterprise",
    monthlyJpy: 0, // 従量
    includedCalls: Infinity,
    ratePerMin: 6_000,
    commercialOk: true,
    note: "従量課金。商用 OK。レート 6,000 req/min。",
  },
};

const OVERAGE_PER_CALL_JPY: Record<TierPlan, number> = {
  "hobby": 1.5,      // ¥1.5 per call over limit
  "pro-indie": 0.04, // ¥0.04 per call over
  "enterprise": 0.03, // ¥0.03 per call
};

// ─── Core API ─────────────────────────────────────────────────────────────────

export function getQuote(plan: TierPlan, callsThisMonth: number): TierQuote {
  const tier = TIERS[plan];
  const usedCalls = callsThisMonth;
  const overageCalls = Math.max(0, usedCalls - tier.includedCalls);
  const overageJpy = overageCalls > 0
    ? Math.round(overageCalls * OVERAGE_PER_CALL_JPY[plan] * 100) / 100
    : 0;

  const totalJpy =
    plan === "enterprise"
      ? Math.round(usedCalls * OVERAGE_PER_CALL_JPY["enterprise"] * 100) / 100
      : tier.monthlyJpy + overageJpy;

  return {
    plan,
    planName: tier.displayName,
    included: tier.includedCalls === Infinity ? -1 : tier.includedCalls,
    usedCalls,
    overageCalls,
    overageJpy,
    totalJpy,
    recordedFraction: plan === "hobby" ? 0.3 : 1.0,
  };
}

export function recommendPlan(callsLast30d: number, payerType: PayerType): TierPlan {
  if (payerType === "business") return "enterprise";
  if (callsLast30d <= 1_000 && payerType === "individual") return "hobby";
  if (callsLast30d <= 50_000) return "pro-indie";
  return "enterprise";
}

export function getTierUsageBreakdown(
  hobbyCalls: number,
  proIndieCalls: number,
  enterpriseCalls: number,
): { hobby: number; proIndie: number; enterprise: number; total: number } {
  const total = hobbyCalls + proIndieCalls + enterpriseCalls;
  return { hobby: hobbyCalls, proIndie: proIndieCalls, enterprise: enterpriseCalls, total };
}
