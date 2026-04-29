export interface DistributionGraph {
  [guildId: string]: Array<{ targetId: string; shareRate: number }>;
}

export interface TraceResult {
  distribution: Record<string, number>;
  nodeCount: number;
  depthReached: number;
}

// ─── LRU cache (max 50 entries, 5 min TTL) ────────────────────────────────────

const LRU_MAX = 50;
const LRU_TTL = 5 * 60_000;

interface CacheEntry {
  graph: DistributionGraph;
  result: TraceResult;
  ts: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(rootGuildId: string, amountJpy: number): string {
  return `${rootGuildId}:${amountJpy}`;
}

function getFromCache(key: string): TraceResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > LRU_TTL) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry); // move to end (most-recently-used)
  return entry.result;
}

function setInCache(key: string, graph: DistributionGraph, result: TraceResult): void {
  if (cache.size >= LRU_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { graph, result, ts: Date.now() });
}

// ─── BFS distribution (iterative, no recursion) ──────────────────────────────

export function traceDistribution(
  rootGuildId: string,
  totalAmountJpy: number,
  graph?: DistributionGraph,
): TraceResult {
  const g = graph ?? buildDefaultGraph();
  const key = cacheKey(rootGuildId, totalAmountJpy);
  const cached = getFromCache(key);
  if (cached) return cached;

  const distribution: Record<string, number> = {};
  let depthReached = 0;

  // BFS queue: [nodeId, amountJpy, depth]
  const queue: Array<[string, number, number]> = [[rootGuildId, totalAmountJpy, 0]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const item = queue.shift()!;
    const [nodeId, amount, depth] = item;

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    distribution[nodeId] = (distribution[nodeId] ?? 0) + amount;
    if (depth > depthReached) depthReached = depth;

    const edges = g[nodeId];
    if (!edges || edges.length === 0) continue;

    for (const edge of edges) {
      if (visited.has(edge.targetId)) continue;
      const share = Math.round(amount * (edge.shareRate / 100) * 100) / 100;
      if (share > 0) {
        queue.push([edge.targetId, share, depth + 1]);
      }
    }
  }

  const result: TraceResult = {
    distribution,
    nodeCount: visited.size,
    depthReached,
  };

  setInCache(key, g, result);
  return result;
}

// ─── Test-graph builder ───────────────────────────────────────────────────────

export function buildTestGraph(depth: number, nodesPerLevel: number): DistributionGraph {
  const g: DistributionGraph = {};
  const shareRate = Math.floor(90 / nodesPerLevel);

  for (let d = 0; d < depth; d++) {
    for (let n = 0; n < nodesPerLevel; n++) {
      const nodeId = `node_${d}_${n}`;
      if (!g[nodeId]) g[nodeId] = [];
      if (d + 1 < depth) {
        for (let c = 0; c < nodesPerLevel; c++) {
          const childId = `node_${d + 1}_${c}`;
          g[nodeId].push({ targetId: childId, shareRate });
        }
      }
    }
  }

  return g;
}

function buildDefaultGraph(): DistributionGraph {
  return {};
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheSize(): number {
  return cache.size;
}
