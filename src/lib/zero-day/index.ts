// Zero-Day Update Feed — deterministic mock events + subscribe/unsubscribe

export type ZeroDayStatus = "covered" | "recruiting";
export type ZeroDayPriority = "critical" | "high" | "medium";

export interface ZeroDayEvent {
  id: string;
  title: string;
  description: string;
  occurredAt: string;     // ISO-8601
  priority: ZeroDayPriority;
  status: ZeroDayStatus;
  coveredBy?: {           // present if status === "covered"
    guildId: string;
    title: string;
    registeredAgoSec: number;
  };
  topic: string;          // used as query param for /sell?topic=ZERO-DAY:{id}
}

export type ZeroDayCallback = (event: ZeroDayEvent) => void;

// ─── Mock event catalog (deterministic) ──────────────────────────────────────

export const ZERO_DAY_EVENTS: ZeroDayEvent[] = [
  {
    id: "zd-pg18-migration",
    title: "PostgreSQL 18 互換のマイグレーションスクリプト",
    description: "PostgreSQL 18 の新しい型システムに対応したスキーマ移行スクリプト。既存の JSONB カラムが影響を受ける。",
    occurredAt: "2026-04-29T04:32:00Z",
    priority: "critical",
    status: "covered",
    coveredBy: {
      guildId: "GUILD:0099-PG18-MIG1",
      title: "PG18 互換マイグレーションノート",
      registeredAgoSec: 90,
    },
    topic: "ZERO-DAY:zd-pg18-migration",
  },
  {
    id: "zd-llm-token-limit",
    title: "LLM APIトークン上限変更への対応",
    description: "主要 LLM プロバイダが 2026-05-01 よりトークン上限を変更。既存のチャンク戦略が影響を受ける。",
    occurredAt: "2026-04-29T02:15:00Z",
    priority: "high",
    status: "recruiting",
    topic: "ZERO-DAY:zd-llm-token-limit",
  },
  {
    id: "zd-my-number-2026",
    title: "マイナンバー法改正 2026 対応",
    description: "2026年改正により本人確認フローに変更が必要。APIベースの本人確認サービスが影響を受ける。",
    occurredAt: "2026-04-28T23:00:00Z",
    priority: "critical",
    status: "covered",
    coveredBy: {
      guildId: "GUILD:0087-MNB1-REG1",
      title: "マイナンバー法改正 2026 対応スクリプト",
      registeredAgoSec: 7200,
    },
    topic: "ZERO-DAY:zd-my-number-2026",
  },
  {
    id: "zd-next15-breaking",
    title: "Next.js 15 破壊的変更まとめ",
    description: "Next.js 15 で削除・変更された API の棚卸しと移行ガイド。cache 動作変更が特に影響大。",
    occurredAt: "2026-04-28T18:44:00Z",
    priority: "high",
    status: "covered",
    coveredBy: {
      guildId: "GUILD:0072-NX15-BRK1",
      title: "Next.js 15 移行チェックリスト",
      registeredAgoSec: 14400,
    },
    topic: "ZERO-DAY:zd-next15-breaking",
  },
  {
    id: "zd-openai-api-v2",
    title: "OpenAI API v2 移行期限（〜2026-06-01）",
    description: "OpenAI API v1 が 2026-06-01 に廃止。SDK v4 以上への移行が必要。",
    occurredAt: "2026-04-27T09:00:00Z",
    priority: "medium",
    status: "recruiting",
    topic: "ZERO-DAY:zd-openai-api-v2",
  },
  {
    id: "zd-cloud-run-cold-start",
    title: "Cloud Run コールドスタート問題回避策",
    description: "Cloud Run Gen2 で新たに確認されたコールドスタート遅延問題（最大 8 秒）と回避パターン。",
    occurredAt: "2026-04-26T14:22:00Z",
    priority: "medium",
    status: "recruiting",
    topic: "ZERO-DAY:zd-cloud-run-cold-start",
  },
];

// ─── Subscribe / Unsubscribe ──────────────────────────────────────────────────

const _callbacks = new Set<ZeroDayCallback>();
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _eventIndex = 0;

function _startInterval() {
  if (_intervalId !== null) return;
  _intervalId = setInterval(() => {
    if (_callbacks.size === 0) return;
    const event = ZERO_DAY_EVENTS[_eventIndex % ZERO_DAY_EVENTS.length];
    _eventIndex++;
    _callbacks.forEach((cb) => cb(event));
  }, 5000);
}

function _stopInterval() {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

export function subscribeZeroDay(callback: ZeroDayCallback): void {
  _callbacks.add(callback);
  _startInterval();
}

export function unsubscribeZeroDay(callback: ZeroDayCallback): void {
  _callbacks.delete(callback);
  if (_callbacks.size === 0) _stopInterval();
}

export function getZeroDayEvents(priorityOrder = true): ZeroDayEvent[] {
  if (!priorityOrder) return [...ZERO_DAY_EVENTS];
  const order: ZeroDayPriority[] = ["critical", "high", "medium"];
  return [...ZERO_DAY_EVENTS].sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

export function _fireForTest(eventIndex = 0): ZeroDayEvent {
  const event = ZERO_DAY_EVENTS[eventIndex % ZERO_DAY_EVENTS.length];
  _callbacks.forEach((cb) => cb(event));
  return event;
}

export function _resetZeroDay(): void {
  _callbacks.clear();
  _stopInterval();
  _eventIndex = 0;
}

// ─── Opt-out key (localStorage) ──────────────────────────────────────────────

export const ZERO_DAY_OPTOUT_KEY = "guild_zero_day_optout";
