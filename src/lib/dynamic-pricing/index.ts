// Multi-Currency API Gateway — dynamic pricing based on IP / auth context
// Japan → JPY (1.0x), Global → USD (1.2x premium)

export type PricingCurrency = "JPY" | "USD" | "EUR" | "GBP";

export interface PricingResult {
  currency: PricingCurrency;
  multiplier: number;
  reasoning: string;
  floorPriceLocal: number;  // in resolved currency
  currencyHint: string;     // mock Currency-Hint header value
}

export interface ResolveInput {
  ip?: string;
  authToken?: string;
  floorPriceJpy?: number;
}

// ─── FX rates (approximate, static for mock) ─────────────────────────────────

const FX: Record<PricingCurrency, number> = {
  JPY: 1,
  USD: 150,   // 1 USD ≈ 150 JPY
  EUR: 165,
  GBP: 192,
};

// ─── Japan detection ──────────────────────────────────────────────────────────

// Representative Japan IP prefix ranges (mock — not exhaustive)
const JAPAN_IP_PREFIXES = [
  "103.", "106.", "113.", "118.", "119.", "122.", "124.", "126.",
  "153.", "163.", "182.", "210.", "219.", "61.196", "61.197",
];

const JAPAN_AUTH_PREFIXES = ["gld_JP", "gld_ja", "gld_jp"];

function isJapanIp(ip: string): boolean {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true; // local dev
  return JAPAN_IP_PREFIXES.some((p) => ip.startsWith(p));
}

function isJapanAuth(token: string): boolean {
  return JAPAN_AUTH_PREFIXES.some((p) => token.startsWith(p));
}

// ─── Core pricing resolver ────────────────────────────────────────────────────

export const USD_PREMIUM = 1.2;

export function resolvePrice(input: ResolveInput): PricingResult {
  const { ip = "", authToken = "", floorPriceJpy = 1000 } = input;

  const japan = isJapanIp(ip) || isJapanAuth(authToken);

  if (japan) {
    return {
      currency: "JPY",
      multiplier: 1.0,
      reasoning: "日本国内アクセス — JPY 等価",
      floorPriceLocal: floorPriceJpy,
      currencyHint: "JPY;q=1.0",
    };
  }

  // Global (non-Japan) → USD with 1.2x premium
  const floorUsd = Math.round((floorPriceJpy / FX.USD) * USD_PREMIUM * 100) / 100;
  return {
    currency: "USD",
    multiplier: USD_PREMIUM,
    reasoning: "Global access — USD premium pricing (1.2x of JPY equivalent)",
    floorPriceLocal: floorUsd,
    currencyHint: "USD;q=1.0",
  };
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const CURRENCY_SYMBOLS: Record<PricingCurrency, string> = {
  JPY: "¥",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export const CURRENCY_FLAGS: Record<PricingCurrency, string> = {
  JPY: "🇯🇵",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
};

export const ALL_CURRENCIES: PricingCurrency[] = ["JPY", "USD", "EUR", "GBP"];

export function formatPrice(amount: number, currency: PricingCurrency): string {
  const sym = CURRENCY_SYMBOLS[currency];
  if (currency === "JPY") {
    return `${sym}${amount.toLocaleString("ja-JP")}`;
  }
  return `${sym}${amount.toFixed(2)}`;
}

// Sample inputs for documentation / testing
export const SAMPLE_INPUTS: Array<{ label: string; input: ResolveInput }> = [
  { label: "国内 (Japan IP)",         input: { ip: "122.20.1.1",      authToken: "gld_abc" } },
  { label: "国内 (Japan auth)",        input: { ip: "8.8.8.8",         authToken: "gld_JP_abc" } },
  { label: "Global (US IP)",           input: { ip: "54.240.1.1",      authToken: "gld_us_abc" } },
  { label: "Global (EU IP)",           input: { ip: "185.60.1.1",      authToken: "gld_eu_abc" } },
];
