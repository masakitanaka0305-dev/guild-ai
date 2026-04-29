export type NodeType = "self" | "parent" | "child";

export interface LineageNode {
  id: string;
  guildId: string;
  title: string;
  rank: "S" | "A" | "B";
  monthlyJpy: number;
  type: NodeType;
}

export interface LineageLink {
  id: string;
  source: string;
  target: string;
  shareRate: number;
  monthlyFlowJpy: number;
}

export interface LineageGraph {
  nodes: LineageNode[];
  links: LineageLink[];
  selfId: string;
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function seeded(n: number, i: number): number {
  return (((n * (i + 1) * 1664525) + 1013904223) >>> 0) / 0x100000000;
}

const RANKS: Array<"S" | "A" | "B"> = ["S", "A", "A", "B", "B", "B"];

const PARENT_TITLES = [
  "プログラミング入門集", "アルゴリズム基礎ノート", "クリーンコード原則集",
  "設計パターン百選", "テスト駆動開発ガイド", "リファクタリング手法集",
];
const CHILD_TITLES = [
  "TypeScript応用ガイド", "React実装パターン集", "API設計ベストプラクティス",
  "クラウドアーキテクチャ入門", "セキュリティ基礎ノート", "パフォーマンス最適化集",
  "モバイル開発ガイド", "CI/CDパイプライン集", "データベース設計ノート", "マイクロサービス入門",
];

export function getLineage(id: string): LineageGraph {
  const seed = djb2(id);

  const selfRankIdx = Math.floor(seeded(seed, 0) * RANKS.length);
  const selfMonthly = Math.round(seeded(seed, 1) * 4000 + 500);

  const selfNode: LineageNode = {
    id: "self",
    guildId: id,
    title: id.startsWith("GUILD:") ? `ノート ${id.slice(-9)}` : id,
    rank: RANKS[selfRankIdx],
    monthlyJpy: selfMonthly,
    type: "self",
  };

  const numParents = 3 + Math.floor(seeded(seed, 2) * 3); // 3–5
  const numChildren = 4 + Math.floor(seeded(seed, 3) * 5); // 4–8

  const parents: LineageNode[] = Array.from({ length: numParents }, (_, i) => ({
    id: `parent_${i}`,
    guildId: `GUILD:P00${i + 1}-${(seed + i).toString(16).slice(-4).toUpperCase()}-PAR${i}`,
    title: PARENT_TITLES[(seed + i) % PARENT_TITLES.length],
    rank: RANKS[Math.floor(seeded(seed + i, 4) * RANKS.length)],
    monthlyJpy: Math.round(seeded(seed + i, 5) * 8000 + 1000),
    type: "parent" as NodeType,
  }));

  const children: LineageNode[] = Array.from({ length: numChildren }, (_, i) => ({
    id: `child_${i}`,
    guildId: `GUILD:C00${i + 1}-${(seed * (i + 1)).toString(16).slice(-4).toUpperCase()}-CHD${i}`,
    title: CHILD_TITLES[(seed + i) % CHILD_TITLES.length],
    rank: RANKS[Math.floor(seeded(seed + i + 10, 6) * RANKS.length)],
    monthlyJpy: Math.round(seeded(seed + i + 10, 7) * 3000 + 200),
    type: "child" as NodeType,
  }));

  const nodes = [...parents, selfNode, ...children];

  // Ancestor royalty share: parents → self (30% flows from self's earnings to each parent)
  const perParentShare = Math.round(30 / numParents);
  const parentLinks: LineageLink[] = parents.map((p, i) => ({
    id: `link_parent_${i}`,
    source: p.id,
    target: "self",
    shareRate: perParentShare,
    monthlyFlowJpy: Math.round((selfMonthly * perParentShare) / 100),
  }));

  // Derived works: self → children (10% of child earnings flows to self)
  const childLinks: LineageLink[] = children.map((c, i) => ({
    id: `link_child_${i}`,
    source: "self",
    target: c.id,
    shareRate: 10,
    monthlyFlowJpy: Math.round(c.monthlyJpy * 0.1),
  }));

  return { nodes, links: [...parentLinks, ...childLinks], selfId: "self" };
}
