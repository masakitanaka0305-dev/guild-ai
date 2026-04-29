import { traceDistribution, type DistributionGraph } from "@/lib/graph-trace";
import { getMyAssets } from "@/lib/portfolio";

export type TombstoneReason = "deleted-by-author" | "dmca" | "expired";

export interface TombstoneRecord {
  guildId: string;
  reason: TombstoneReason;
  tombstonedAt: string;
  authorHandle: string;
}

export interface RoutedEntry {
  tombstonedNode: string;
  recipient: string;
  amountJpy: number;
}

export interface FallbackDistribution {
  distribution: Record<string, number>;
  routedFrom: RoutedEntry[];
  indexFundJpy: number;
}

// ─── In-memory tombstone store ────────────────────────────────────────────────

const tombstoneStore = new Map<string, TombstoneRecord>();

// Seed with one demo tombstone to make tests meaningful (system-level entry)
tombstoneStore.set("GUILD:DEMO-TOMB-0001", {
  guildId: "GUILD:DEMO-TOMB-0001",
  reason: "deleted-by-author",
  tombstonedAt: "2026-01-15T10:00:00Z",
  authorHandle: "system",
});

// ─── Index fund accumulator ───────────────────────────────────────────────────

let indexFundBalance = 0;

export function getIndexFundBalance(): number {
  return indexFundBalance;
}

// ─── Core API ─────────────────────────────────────────────────────────────────

export function tombstone(
  guildId: string,
  reason: TombstoneReason = "deleted-by-author",
  authorHandle = "system",
): TombstoneRecord {
  const record: TombstoneRecord = {
    guildId,
    reason,
    tombstonedAt: new Date().toISOString(),
    authorHandle,
  };
  tombstoneStore.set(guildId, record);
  return record;
}

export function isTombstoned(guildId: string): boolean {
  return tombstoneStore.has(guildId);
}

export function getTombstone(guildId: string): TombstoneRecord | null {
  return tombstoneStore.get(guildId) ?? null;
}

export function resolveActiveLineage(
  rootGuildId: string,
  graph?: DistributionGraph,
): { activeNodes: string[]; fallbacks: RoutedEntry[] } {
  const g = graph ?? buildAssetGraph();
  // Include source nodes AND all edge targets
  const allNodes = new Set([rootGuildId, ...Object.keys(g)]);
  for (const edges of Object.values(g)) {
    for (const edge of edges) allNodes.add(edge.targetId);
  }
  const activeNodes: string[] = [];
  const fallbacks: RoutedEntry[] = [];

  for (const nodeId of allNodes) {
    if (isTombstoned(nodeId)) {
      const record = getTombstone(nodeId)!;
      // Fallback: author → index-fund
      const recipient = record.authorHandle || "index-fund";
      fallbacks.push({ tombstonedNode: nodeId, recipient, amountJpy: 0 });
    } else {
      activeNodes.push(nodeId);
    }
  }

  return { activeNodes, fallbacks };
}

export function distributeWithFallback(
  rootGuildId: string,
  amountJpy: number,
  graph?: DistributionGraph,
): FallbackDistribution {
  const g = graph ?? buildAssetGraph();
  const { fallbacks } = resolveActiveLineage(rootGuildId, g);
  const tombstonedIds = new Set(fallbacks.map((f) => f.tombstonedNode));

  const raw = traceDistribution(rootGuildId, amountJpy, g);
  const distribution: Record<string, number> = {};
  const routedFrom: RoutedEntry[] = [];
  let indexFundJpy = 0;

  for (const [nodeId, amount] of Object.entries(raw.distribution)) {
    if (tombstonedIds.has(nodeId)) {
      const ts = getTombstone(nodeId)!;
      const recipient = ts.authorHandle || "index-fund";
      if (recipient === "index-fund") {
        indexFundJpy += amount;
        indexFundBalance += amount;
      } else {
        distribution[recipient] = (distribution[recipient] ?? 0) + amount;
      }
      routedFrom.push({ tombstonedNode: nodeId, recipient, amountJpy: amount });
    } else {
      distribution[nodeId] = (distribution[nodeId] ?? 0) + amount;
    }
  }

  return { distribution, routedFrom, indexFundJpy };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAssetGraph(): DistributionGraph {
  const assets = getMyAssets();
  const g: DistributionGraph = {};
  // Simple fan-out: each active asset receives 5% from root
  const activeIds = assets.filter((a) => a.status === "active").map((a) => a.guildId);
  if (activeIds.length > 0) {
    g["root"] = activeIds.map((id) => ({ targetId: id, shareRate: 5 }));
  }
  return g;
}

export function _resetTombstones(): void {
  tombstoneStore.clear();
  indexFundBalance = 0;
}
