// Immutable append-only dependency ledger with merkle hash chain
// No removeEdge — deletion is intentionally absent (append-only design)

export type EdgeKind = "cite" | "fork";

export interface LedgerEdge {
  id: string;
  child: string;       // guildId of the dependent (newer) node
  parent: string;      // guildId of the dependency (older) node
  kind: EdgeKind;
  ts: string;          // ISO-8601
  hash: string;        // payload hash
  merkleHash: string;  // hash of (prevMerkleHash + this.hash)
}

// ─── Deterministic hash helpers ──────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function hashOf(s: string): string {
  return djb2(s).toString(16).padStart(8, "0");
}

// ─── Append-only ledger store ─────────────────────────────────────────────────

const _ledger: LedgerEdge[] = [];

export interface AppendEdgeInput {
  child: string;
  parent: string;
  kind: EdgeKind;
  ts?: string;
  hash?: string;
}

export function appendEdge(input: AppendEdgeInput): LedgerEdge {
  const ts = input.ts ?? new Date().toISOString();
  const payloadStr = `${input.child}:${input.parent}:${input.kind}:${ts}`;
  const hash = input.hash ?? hashOf(payloadStr);
  const prevMerkle = _ledger.length > 0 ? _ledger[_ledger.length - 1].merkleHash : "00000000";
  const merkleHash = hashOf(prevMerkle + hash);

  const edge: LedgerEdge = {
    id: `edge_${_ledger.length}`,
    child: input.child,
    parent: input.parent,
    kind: input.kind,
    ts,
    hash,
    merkleHash,
  };

  _ledger.push(edge);
  return edge;
}

// removeEdge is intentionally not implemented — append-only by design

export function getLedger(): ReadonlyArray<LedgerEdge> {
  return _ledger;
}

// ─── Chain integrity verification ────────────────────────────────────────────

export function verifyChain(): { valid: boolean; firstBrokenIndex: number | null } {
  let prev = "00000000";
  for (let i = 0; i < _ledger.length; i++) {
    const expected = hashOf(prev + _ledger[i].hash);
    if (expected !== _ledger[i].merkleHash) {
      return { valid: false, firstBrokenIndex: i };
    }
    prev = _ledger[i].merkleHash;
  }
  return { valid: true, firstBrokenIndex: null };
}

// ─── Graph traversal ──────────────────────────────────────────────────────────

export function getDescendants(rootGuildId: string): string[] {
  const result = new Set<string>();
  const queue = [rootGuildId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const e of _ledger) {
      if (e.parent === curr && !result.has(e.child)) {
        result.add(e.child);
        queue.push(e.child);
      }
    }
  }
  return [...result];
}

export function getAncestors(guildId: string): string[] {
  const result = new Set<string>();
  const queue = [guildId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const e of _ledger) {
      if (e.child === curr && !result.has(e.parent)) {
        result.add(e.parent);
        queue.push(e.parent);
      }
    }
  }
  return [...result];
}

// Deterministic short hash for display (e.g. badge)
export function shortHash(guildId: string): string {
  return hashOf(guildId + "ledger").slice(0, 8);
}

// ─── Test helper ──────────────────────────────────────────────────────────────

export function _resetLedger(): void {
  _ledger.length = 0;
}
