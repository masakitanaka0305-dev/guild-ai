import { computeComplexityScore } from "@/lib/complexity-score";
import { getCitationGraph } from "@/lib/citation-network";

export interface MasterStats {
  handle: string;
  masterScore: number; // 0–1000
  citationCount: number;
  discipleCount: number;
  collectiveScore: number; // weighted contribution
  label: string;
}

// ─── Deterministic helpers ───────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// ─── Score computation ────────────────────────────────────────────────────────

export function computeMasterScore(handle: string): number {
  const graph = getCitationGraph(handle);
  const selfNode = graph.nodes.find((n) => n.isSelf || n.handle === handle);
  if (!selfNode) return 0;

  const cxScore = computeComplexityScore(handle); // 0–100
  const citationCount = selfNode.citationCount;
  const forkCount = selfNode.forkCount;

  // Weighted formula: citations (50%) + complexity (30%) + forks (20%)
  const score = Math.round(
    citationCount * 5 +   // up to ~250 (50 citations × 5)
    cxScore * 3 +         // up to 300 (100 × 3)
    forkCount * 6.67,     // up to ~100 (15 forks × 6.67)
  );

  return Math.min(1000, score);
}

export function getMasterStats(handle: string): MasterStats {
  const graph = getCitationGraph(handle);
  const selfNode = graph.nodes.find((n) => n.isSelf || n.handle === handle);
  const citationCount = selfNode?.citationCount ?? 0;
  const forkCount = selfNode?.forkCount ?? 0;
  const masterScore = computeMasterScore(handle);

  // Disciples: nodes that cite this handle
  const discipleCount = graph.edges.filter((e) => e.target === `node_${handle}`).length;

  // Collective score: contribution weighted by complexity
  const cxScore = computeComplexityScore(handle);
  const collectiveScore = Math.round(
    (citationCount * 10 + forkCount * 15 + cxScore * 8) * (masterScore / 1000 + 0.5),
  );

  const label =
    masterScore >= 700 ? "マスター" :
    masterScore >= 400 ? "シニア" :
    masterScore >= 150 ? "メンター" :
    "コントリビューター";

  return { handle, masterScore, citationCount, discipleCount, collectiveScore, label };
}

export function getTopMasters(limit = 10): Array<{ handle: string; masterScore: number; label: string }> {
  const { nodes } = getCitationGraph();
  return nodes
    .map((n) => {
      const score = computeMasterScore(n.handle);
      const label =
        score >= 700 ? "マスター" :
        score >= 400 ? "シニア" :
        score >= 150 ? "メンター" :
        "コントリビューター";
      return { handle: n.handle, masterScore: score, label };
    })
    .sort((a, b) => b.masterScore - a.masterScore)
    .slice(0, limit);
}

export function getRecommendedNotes(handle: string): Array<{ title: string; guildId: string }> {
  const seed = djb2(handle + "_recommend");
  const NOTES = [
    { title: "TypeScript設計パターン集",     guildId: "GUILD:0001-TS01-PAT1" },
    { title: "LLM Prompt Engineering集",    guildId: "GUILD:0003-LLM1-PRO1" },
    { title: "Rustメモリ安全設計ノート",      guildId: "GUILD:0002-RS01-MEM1" },
    { title: "CSSアニメーション逆引き辞典",    guildId: "GUILD:0004-CSS1-ANI1" },
    { title: "Pythonデータ分析ベストプラクティス", guildId: "GUILD:0005-PY01-DAT1" },
  ];
  const start = seed % NOTES.length;
  return [
    NOTES[start % NOTES.length],
    NOTES[(start + 1) % NOTES.length],
    NOTES[(start + 2) % NOTES.length],
  ];
}
