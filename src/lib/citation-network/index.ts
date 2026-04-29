
export type EdgeType = "citation" | "fork";

export interface CitationNode {
  id: string;
  handle: string;
  title: string;
  citationCount: number;
  forkCount: number;
  rank: "S" | "A" | "B";
  isSelf: boolean;
}

export interface CitationEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
}

export interface CitationGraph {
  nodes: CitationNode[];
  edges: CitationEdge[];
  centerHandle?: string;
}

// ─── Deterministic helpers ───────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function seeded(n: number, i: number): number {
  return (((n * (i + 1) * 1664525) + 1013904223) >>> 0) / 0x100000000;
}

const HANDLES = ["alice", "bob", "carol", "dave", "eve", "frank", "grace", "hiro", "iris", "jun"];
const TITLES = [
  "TypeScript設計パターン", "LLMプロンプト集", "Rust安全設計", "CSS逆引き辞典",
  "Python分析手法", "SQLクエリ最適化", "API設計指南", "CI/CD実践", "テスト戦略集", "マイクロサービス入門",
];
const RANKS: Array<"S" | "A" | "B"> = ["S", "A", "A", "B", "B", "B"];

// ─── Core API ─────────────────────────────────────────────────────────────────

export function getCitationGraph(handle?: string): CitationGraph {
  const baseHandles = handle
    ? [handle, ...HANDLES.filter((h) => h !== handle).slice(0, 9)]
    : HANDLES;

  const nodes: CitationNode[] = baseHandles.map((h, i) => {
    const seed = djb2(h + "_citation");
    return {
      id: `node_${h}`,
      handle: h,
      title: TITLES[i % TITLES.length],
      citationCount: 5 + Math.floor(seeded(seed, 0) * 40),
      forkCount: 1 + Math.floor(seeded(seed, 1) * 15),
      rank: RANKS[Math.floor(seeded(seed, 2) * RANKS.length)],
      isSelf: h === handle,
    };
  });

  // Generate edges: each node cites 1-3 others (2-hop max)
  const edges: CitationEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const seed = djb2(nodes[i].handle);
    const numEdges = 1 + Math.floor(seeded(seed, 3) * 3);
    for (let j = 0; j < numEdges; j++) {
      const targetIdx = (i + 1 + Math.floor(seeded(seed + j, 4) * (nodes.length - 1))) % nodes.length;
      if (targetIdx !== i) {
        const edgeType: EdgeType = seeded(seed + j, 5) > 0.7 ? "fork" : "citation";
        edges.push({
          id: `edge_${nodes[i].id}_${nodes[targetIdx].id}_${j}`,
          source: nodes[i].id,
          target: nodes[targetIdx].id,
          type: edgeType,
        });
      }
    }
  }

  return { nodes, edges, centerHandle: handle };
}

// ─── Respect store ────────────────────────────────────────────────────────────

const respectTable = new Map<string, Set<string>>(); // handle → set of respecters

export function addRespect(fromHandle: string, toHandle: string): void {
  if (!respectTable.has(toHandle)) respectTable.set(toHandle, new Set());
  respectTable.get(toHandle)!.add(fromHandle);
}

export function getRespectCount(handle: string): number {
  return respectTable.get(handle)?.size ?? 0;
}

export function _resetRespect(): void {
  respectTable.clear();
}
