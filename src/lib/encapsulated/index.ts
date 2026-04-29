// Encapsulated Intelligence — highest protection tier
// Wraps existing Blackbox with crawler UA blocking and rate limiting.

import { setVisibility, filterGetResponse as blackboxFilter, type BlackboxOptions } from "@/lib/blackbox";

export type EncapsulatedMode = "open" | "api-only" | "blackbox" | "encapsulated";

// Known AI crawler User-Agent substrings to block
export const CRAWLER_UA_LIST = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "CCBot",
  "Anthropic-AI",
  "Bytespider",
  "PerplexityBot",
  "Diffbot",
  "Amazonbot",
  "Applebot-Extended",
];

export interface EncapsulationOptions extends BlackboxOptions {
  allowOpen?: boolean;
  rateLimit?: { rpm: number };
}

export interface EncapsulationRecord {
  guildId: string;
  mode: EncapsulatedMode;
  enabledAt: string;
  options: EncapsulationOptions;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const _store = new Map<string, EncapsulationRecord>();
const _rateLimitMap = new Map<string, { count: number; windowStart: number }>();

// ─── Crawler detection ────────────────────────────────────────────────────────

export function isLikelyCrawler(userAgent: string): boolean {
  const ua = userAgent ?? "";
  return CRAWLER_UA_LIST.some((bot) => ua.includes(bot));
}

// ─── Core API ─────────────────────────────────────────────────────────────────

export function enableEncapsulation(
  guildId: string,
  options: EncapsulationOptions = {},
): EncapsulationRecord {
  const record: EncapsulationRecord = {
    guildId,
    mode: "encapsulated",
    enabledAt: new Date().toISOString(),
    options: { allowOpen: false, rateLimit: { rpm: 10 }, ...options },
  };
  _store.set(guildId, record);
  // Also set blackbox level in the underlying store so filterGetResponse works
  setVisibility(guildId, "blackbox", { enabledAt: record.enabledAt });
  return record;
}

export function getEncapsulationRecord(guildId: string): EncapsulationRecord | null {
  return _store.get(guildId) ?? null;
}

export function getEffectiveMode(guildId: string): EncapsulatedMode {
  return _store.get(guildId)?.mode ?? "open";
}

// ─── Rate limit check ─────────────────────────────────────────────────────────

export function checkRateLimit(guildId: string, clientKey: string): boolean {
  const record = _store.get(guildId);
  if (!record || !record.options.rateLimit) return true;
  const { rpm } = record.options.rateLimit;

  const mapKey = `${guildId}:${clientKey}`;
  const now = Date.now();
  const entry = _rateLimitMap.get(mapKey);

  if (!entry || now - entry.windowStart > 60_000) {
    _rateLimitMap.set(mapKey, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= rpm) return false;
  entry.count += 1;
  return true;
}

// ─── Response filtering ───────────────────────────────────────────────────────

/**
 * Filter GET response for encapsulated mode.
 * Strips mdBody, source, body, content, internalNotes.
 */
export function filterEncapsulatedResponse<T extends Record<string, unknown>>(
  guildId: string,
  data: T,
): Record<string, unknown> {
  const mode = getEffectiveMode(guildId);
  if (mode !== "encapsulated" && mode !== "blackbox") {
    // Delegate to blackbox for open / api-only
    return blackboxFilter(guildId, data);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mdBody: _mb, source: _s, body: _b, content: _c, internalNotes: _in, ...rest } = data;
  return rest;
}

// ─── UI metadata ──────────────────────────────────────────────────────────────

export interface EncapsulatedModeInfo {
  mode: EncapsulatedMode;
  label: string;
  description: string;
  badge?: string;
}

export const ENCAPSULATED_MODES: EncapsulatedModeInfo[] = [
  {
    mode: "open",
    label: "フルオープン（学習可）",
    description: "MD の本文を公開。AI が自由に学習・引用できます。",
  },
  {
    mode: "api-only",
    label: "API のみ（学習不可）",
    description: "実行は可能ですが、MD の本文は非公開。スクレイピング不可。",
  },
  {
    mode: "blackbox",
    label: "Blackbox（実行専用）",
    description: "コードは見せない、結果だけ売る。海外スクレイピング対策済み。",
    badge: "🛡 海外スクレイピング対策済み",
  },
  {
    mode: "encapsulated",
    label: "Encapsulated（最高保護）",
    description: "クローラー UA を即ブロック + rate limit + 実行従量課金。最上位保護。",
    badge: "🛡 Encapsulated Intelligence",
  },
];

// ─── Test helper ──────────────────────────────────────────────────────────────

export function _resetEncapsulated(): void {
  _store.clear();
  _rateLimitMap.clear();
}
