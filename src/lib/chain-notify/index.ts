// Chain Notify — viral stacking notification engine
// Fires when an MD is cited 2+ levels deep; max 5 events/min.
// Opt-out: localStorage key "guild_chain_notify_optout" = "1"

export interface ChainEvent {
  id: string;
  parentGuildId: string;
  parentTitle: string;
  depth: number;
  prevCumulative: number;
  newCumulative: number;
  cumulativeIncrease: number;
  text: string;
  at: string;
}

// ─── Deterministic mock data ──────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0) / 0x100000000;
}

const PARENT_TITLES = [
  "請求書自動化スクリプト",
  "TypeScript設計パターン集",
  "LLM Prompt Engineering集",
  "Rustメモリ安全設計ノート",
  "CSSアニメーション逆引き辞典",
];

export function simulateChainEvent(seed?: number): ChainEvent {
  const s = seed ?? djb2(`chain_${Date.now()}`);
  const idx = Math.floor(lcg(s) * PARENT_TITLES.length);
  const depth = 2 + Math.floor(lcg(s + 1) * 4); // 2–5
  const prevCumulative = 120 + Math.floor(lcg(s + 2) * 300);
  const cumulativeIncrease = 50 + Math.floor(lcg(s + 3) * 300);
  const newCumulative = prevCumulative + cumulativeIncrease;
  const title = PARENT_TITLES[idx];

  const text = `あなたの「${title}」が ${depth} 段階先で引用されました！累積配当が +¥${prevCumulative} → +¥${newCumulative} に増加中`;

  return {
    id: `chain_${s.toString(16)}`,
    parentGuildId: `GUILD:C${s.toString(16).slice(-4).toUpperCase()}-CHAIN`,
    parentTitle: title,
    depth,
    prevCumulative,
    newCumulative,
    cumulativeIncrease,
    text,
    at: new Date().toISOString(),
  };
}

// ─── Subscription + rate limiting ────────────────────────────────────────────

type ChainCallback = (event: ChainEvent) => void;

const listeners = new Set<ChainCallback>();
let timer: ReturnType<typeof setTimeout> | null = null;
const recentEvents: ChainEvent[] = [];
const fireTimestamps: number[] = [];
const MAX_PER_MINUTE = 5;

function isOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("guild_chain_notify_optout") === "1";
}

function canFire(): boolean {
  if (isOptedOut()) return false;
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = fireTimestamps.filter((t) => t > windowStart);
  return recent.length < MAX_PER_MINUTE;
}

function scheduleNext() {
  if (timer) return;
  const delay = 28_000 + Math.floor(Math.random() * 20_000); // 28–48s
  timer = setTimeout(() => {
    timer = null;
    if (listeners.size === 0) return;

    if (canFire()) {
      const evt = simulateChainEvent();
      fireTimestamps.push(Date.now());
      // Keep only last 10 timestamps
      if (fireTimestamps.length > 10) fireTimestamps.splice(0, fireTimestamps.length - 10);

      recentEvents.unshift(evt);
      if (recentEvents.length > 5) recentEvents.pop();

      listeners.forEach((cb) => cb(evt));
    }

    scheduleNext();
  }, delay);
}

export function subscribeChain(callback: ChainCallback): void {
  listeners.add(callback);
  if (listeners.size === 1) scheduleNext();
}

export function unsubscribeChain(callback: ChainCallback): void {
  listeners.delete(callback);
  if (listeners.size === 0 && timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

export function getRecentChainEvents(): ChainEvent[] {
  return [...recentEvents];
}

export function formatChainNotifyText(event: ChainEvent): string {
  return `${event.depth}段階先で引用 +¥${event.cumulativeIncrease}`;
}

export function _fireForTest(seed?: number): ChainEvent {
  const evt = simulateChainEvent(seed);
  recentEvents.unshift(evt);
  if (recentEvents.length > 5) recentEvents.pop();
  listeners.forEach((cb) => cb(evt));
  return evt;
}

export function _resetChainNotify(): void {
  recentEvents.length = 0;
  fireTimestamps.length = 0;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
