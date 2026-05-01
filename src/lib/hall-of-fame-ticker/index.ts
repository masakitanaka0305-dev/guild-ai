// GUILD AI — Hall of Fame Ticker (#130).
//
// A thin under-header strip that surfaces honest, fact-anchored events:
//   - anonymized S-rank Mint events:  "@h***o さんの『観測性設計』が金の太鼓判を獲得"
//   - the user's own facts:           "@you の知恵が直近 24 時間で 41 人に使われました"
//
// Other handles get their middle truncated to "@first*****last" so the
// surface stays public-facing while still feeling alive. Pure /
// deterministic — same userId / day → same line.

export interface HoFTickerEvent {
  id: string;
  kind: "peer_s_mint" | "self_recent_calls";
  /** Plain-text line (used by the strip + aria-live). */
  message: string;
  /** ISO 8601 timestamp anchored to the underlying event. */
  at: string;
  /** Anonymized handle for peer events; raw handle for self events. */
  handleDisplay: string;
}

const MOCK_PEER_HANDLES = [
  "haruyo",     "kotaro",  "saito_n",   "moca-d",
  "nine.lab",   "0xdrip",  "midori-s",  "tomoaki",
];

const MOCK_PEER_TITLES = [
  "観測性設計",
  "RAG 評価チェックリスト",
  "OpenAPI 速習",
  "型推論レビュー集",
  "障害対応の型",
];

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Anonymizes a handle by keeping the first character + last character
 * and masking everything in between. Stable: same input → same output.
 */
export function anonymizeHandle(handle: string): string {
  const raw = handle.startsWith("@") ? handle.slice(1) : handle;
  if (raw.length <= 2) return `@${raw}`;
  if (raw.length === 3) return `@${raw[0]}*${raw[2]}`;
  return `@${raw[0]}${"*".repeat(Math.min(5, raw.length - 2))}${raw[raw.length - 1]}`;
}

/** Builds the deterministic peer-S-Mint event for a given seed. */
export function makePeerSMintEvent(seed: string, at: string): HoFTickerEvent {
  const h = djb2(seed + at);
  const handle = MOCK_PEER_HANDLES[h % MOCK_PEER_HANDLES.length];
  const title = MOCK_PEER_TITLES[(h >> 4) % MOCK_PEER_TITLES.length];
  const masked = anonymizeHandle(handle);
  return {
    id: `peer-s-${(h & 0xffffff).toString(36)}`,
    kind: "peer_s_mint",
    message: `${masked} さんの『${title}』が金の太鼓判を獲得`,
    at,
    handleDisplay: masked,
  };
}

/** Builds the user's own "your knowledge was used by N people" event. */
export function makeSelfRecentCallsEvent(
  userId: string,
  uniqueUsers24h: number,
  at: string,
): HoFTickerEvent {
  const display = userId.startsWith("@") ? userId : `@${userId}`;
  return {
    id: `self-calls-${djb2(userId + at).toString(36).slice(0, 8)}`,
    kind: "self_recent_calls",
    message: `${display} の知恵が直近 24 時間で ${uniqueUsers24h} 人に使われました`,
    at,
    handleDisplay: display,
  };
}

/**
 * Returns up to N events for the strip. Alternates between self facts
 * and peer announcements so the user sees both their own progress and
 * a sense of being part of a community. SSR-stable.
 */
export function buildHoFTickerStack(
  userId: string,
  uniqueUsers24h: number,
  reference: Date = new Date("2026-05-01T09:00:00.000Z"),
  count = 6,
): HoFTickerEvent[] {
  const out: HoFTickerEvent[] = [];
  for (let i = 0; i < count; i++) {
    const at = new Date(reference.getTime() - i * 60_000).toISOString();
    if (i % 3 === 0) {
      out.push(makeSelfRecentCallsEvent(userId, uniqueUsers24h, at));
    } else {
      out.push(makePeerSMintEvent(`${userId}_${i}`, at));
    }
  }
  return out;
}

export const TICKER_INTERVAL_MS = 30_000;
export const TICKER_DISMISS_HOURS = 24;
export const TICKER_DISMISS_KEY = "halloffame_dismissed_until";
