// Recursive Payout Algorithm — BFS upward from leaf to ancestors
// Weight per depth: d=1→50%, d=2→25%, d≥3→25/(2^(d-2))%
// Precision: milli-JPY integers (0.001¥ granularity = 0.01¥ displayable)

import { getLedger } from "@/lib/dep-ledger";
import { accumulate } from "@/lib/shima-ledger";

export type ParentMap = Record<string, string[]>;

export interface PayoutRecipient {
  guildId: string;
  amountMilliJpy: number;
  depth: number;
}

export interface PayoutRecord {
  id: string;
  leafGuildId: string;
  totalMilliJpy: number;
  recipients: PayoutRecipient[];
  leafRetainedMilliJpy: number;
  ts: string;
}

export interface PayoutDisplayEntry {
  layer: number;
  recipientId: string;
  amountJpy: string;  // formatted "0.01" etc
  ts: string;
}

// ─── Weight formula ───────────────────────────────────────────────────────────

export function weightForDepth(depth: number): number {
  if (depth <= 0) return 0;
  if (depth === 1) return 0.5;
  if (depth === 2) return 0.25;
  return 0.25 / Math.pow(2, depth - 2);
}

// Sum of weights for depths 1..maxDepth approaches 1.0 as maxDepth → ∞
export function totalWeightUpToDepth(maxDepth: number): number {
  let sum = 0;
  for (let d = 1; d <= maxDepth; d++) sum += weightForDepth(d);
  return sum;
}

// ─── History store ────────────────────────────────────────────────────────────

const _history: PayoutRecord[] = [];
const MAX_DEPTH = 20;

// ─── Build parent map from dep-ledger ────────────────────────────────────────

function buildParentMap(custom?: ParentMap): ParentMap {
  if (custom) return custom;
  const map: ParentMap = {};
  for (const edge of getLedger()) {
    if (!map[edge.child]) map[edge.child] = [];
    if (!map[edge.child].includes(edge.parent)) {
      map[edge.child].push(edge.parent);
    }
  }
  return map;
}

// ─── Core payout function ─────────────────────────────────────────────────────

export function payoutOnApiCall(
  leafGuildId: string,
  totalMilliJpy: number,
  customParents?: ParentMap,
): PayoutRecord {
  const parentMap = buildParentMap(customParents);
  const recipients: PayoutRecipient[] = [];
  let totalDistributed = 0;

  // BFS by layer: collect all ancestors grouped by depth
  const visited = new Set<string>([leafGuildId]);
  let currentLayer = new Set<string>([leafGuildId]);

  for (let d = 1; d <= MAX_DEPTH && currentLayer.size > 0; d++) {
    const nextLayer = new Set<string>();
    for (const nodeId of currentLayer) {
      for (const parent of (parentMap[nodeId] ?? [])) {
        if (!visited.has(parent)) {
          visited.add(parent);
          nextLayer.add(parent);
        }
      }
    }
    if (nextLayer.size === 0) break;

    const weight = weightForDepth(d);
    const layerBudget = Math.round(totalMilliJpy * weight);
    const perNode = nextLayer.size > 0 ? Math.round(layerBudget / nextLayer.size) : 0;

    for (const guildId of nextLayer) {
      if (perNode > 0) {
        recipients.push({ guildId, amountMilliJpy: perNode, depth: d });
        accumulate(guildId, perNode);
        totalDistributed += perNode;
      }
    }

    currentLayer = nextLayer;
  }

  const record: PayoutRecord = {
    id: `po_${Date.now().toString(36)}`,
    leafGuildId,
    totalMilliJpy,
    recipients,
    leafRetainedMilliJpy: totalMilliJpy - totalDistributed,
    ts: new Date().toISOString(),
  };

  _history.unshift(record);
  if (_history.length > 100) _history.pop();

  return record;
}

export function getPayoutHistory(leafGuildId?: string, limit = 10): PayoutRecord[] {
  const filtered = leafGuildId
    ? _history.filter((r) => r.leafGuildId === leafGuildId)
    : _history;
  return filtered.slice(0, limit);
}

// ─── Deterministic mock display data (for pages with no real payouts yet) ────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}
function lcg(n: number): number {
  return ((n * 1664525 + 1013904223) >>> 0);
}

const RECIPIENT_SUFFIXES = ["PAR1", "PAR2", "GPA1", "GPA2", "ANC1", "ANC2", "ANC3", "ANC4"];

export function getPayoutDisplayEntries(guildId: string, limit = 10): PayoutDisplayEntry[] {
  let seed = djb2(guildId + "payout-display");
  const now = new Date("2026-04-29T06:00:00Z").getTime();
  const entries: PayoutDisplayEntry[] = [];

  for (let i = 0; i < limit; i++) {
    seed = lcg(seed);
    const ageMs = seed % (7 * 24 * 3600 * 1000); // within last 7 days
    const ts = new Date(now - ageMs).toISOString();
    seed = lcg(seed);
    const layer = 1 + (seed % 3); // depth 1-3
    seed = lcg(seed);
    const suffixIdx = seed % RECIPIENT_SUFFIXES.length;
    const recipientId = `GUILD:${(djb2(guildId + i).toString(16).slice(0, 4).toUpperCase())}-${RECIPIENT_SUFFIXES[suffixIdx]}`;
    seed = lcg(seed);
    const milliJpy = 10 + (seed % 990); // 10 to 999 milliJpy = 0.01¥ to 0.99¥
    const amountJpy = (milliJpy / 1000).toFixed(3);

    entries.push({ layer, recipientId, amountJpy, ts });
  }

  entries.sort((a, b) => b.ts.localeCompare(a.ts));
  return entries;
}

export function formatMilliJpyDisplay(milliJpy: number): string {
  return (milliJpy / 1000).toFixed(2);
}

// ─── Test helper ──────────────────────────────────────────────────────────────

export function _resetPayoutHistory(): void {
  _history.length = 0;
}
