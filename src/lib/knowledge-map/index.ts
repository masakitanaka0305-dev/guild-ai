// GUILD AI — Knowledge Map (#130).
//
// Pure data + a couple of small helpers so the component is render-only.
// The graph centers the user (`type: "self"`) and surrounds them with
// three node kinds:
//
//   md       — registered cards     (blue,   #4C1D95)
//   project  — inbound お困りごと   (violet, #8B5CF6)
//   atoa     — AI-to-AI settlements (gold,   #F59E0B)
//
// Edge thickness is normalised against the highest call count so the
// strongest links stay visually distinct without dominating the map.

export type MapNodeType = "self" | "md" | "project" | "atoa";

export interface MapNode {
  id: string;
  type: MapNodeType;
  /** Display label for the node body. */
  label: string;
  /** Used to size the node's halo on busy nodes (e.g. high-call MDs). */
  weight: number;
}

export interface MapLink {
  source: string;
  target: string;
  /** Number of calls between source / target — drives stroke width. */
  calls: number;
  /** Days since last interaction — drives node distance. */
  daysSince: number;
}

export interface MapGraph {
  nodes: MapNode[];
  links: MapLink[];
}

export const MAP_NODE_COLOR: Record<MapNodeType, string> = {
  self:    "#FFFFFF",
  md:      "#4C1D95",   // brand-primary (Deep Purple)
  project: "#8B5CF6",   // violet (ai-flow)
  atoa:    "#F59E0B",   // brand-secondary (Electric Gold)
};

/** Builds a deterministic demo graph for /profile/map. */
export function demoKnowledgeGraph(handle: string = "you"): MapGraph {
  const self: MapNode = {
    id: handle,
    type: "self",
    label: `@${handle}`,
    weight: 1,
  };

  const mds: MapNode[] = [
    { id: "md-observability",  type: "md", label: "観測性設計メモ",      weight: 0.95 },
    { id: "md-rag-eval",       type: "md", label: "RAG 評価チェックリスト", weight: 0.84 },
    { id: "md-openapi",        type: "md", label: "OpenAPI 速習",        weight: 0.62 },
    { id: "md-types",          type: "md", label: "型推論レビュー集",    weight: 0.71 },
    { id: "md-incident",       type: "md", label: "障害対応の型",        weight: 0.55 },
  ];

  const projects: MapNode[] = [
    { id: "proj-acme",     type: "project", label: "AcmeAuto: 観測の見直し", weight: 0.65 },
    { id: "proj-finpath",  type: "project", label: "FinPath: 整合性レビュー", weight: 0.50 },
    { id: "proj-mizuho",   type: "project", label: "MizuhoOps: SLO 入門",    weight: 0.40 },
  ];

  const atoa: MapNode[] = [
    { id: "atoa-orac",     type: "atoa", label: "ORAC エージェント",  weight: 0.70 },
    { id: "atoa-foundry",  type: "atoa", label: "Foundry エージェント", weight: 0.45 },
    { id: "atoa-kotodama", type: "atoa", label: "Kotodama-Lab",        weight: 0.30 },
  ];

  const nodes: MapNode[] = [self, ...mds, ...projects, ...atoa];
  const links: MapLink[] = [
    { source: handle, target: "md-observability", calls: 312, daysSince: 1 },
    { source: handle, target: "md-rag-eval",      calls: 187, daysSince: 2 },
    { source: handle, target: "md-openapi",       calls:  62, daysSince: 6 },
    { source: handle, target: "md-types",         calls: 124, daysSince: 3 },
    { source: handle, target: "md-incident",      calls:  44, daysSince: 9 },

    { source: "md-observability", target: "proj-acme",    calls: 240, daysSince: 1 },
    { source: "md-observability", target: "proj-mizuho",  calls:  86, daysSince: 4 },
    { source: "md-rag-eval",      target: "proj-finpath", calls:  92, daysSince: 5 },
    { source: "md-types",         target: "proj-acme",    calls:  31, daysSince: 7 },

    { source: "md-observability", target: "atoa-orac",     calls: 310, daysSince: 1 },
    { source: "md-rag-eval",      target: "atoa-foundry",  calls: 110, daysSince: 4 },
    { source: "md-incident",      target: "atoa-kotodama", calls:  18, daysSince: 9 },
  ];

  return { nodes, links };
}

/**
 * Normalised stroke width helper for links.
 * Returns a px value in [1, 6].
 */
export function linkStrokeWidth(graph: MapGraph, calls: number): number {
  const max = Math.max(1, ...graph.links.map((l) => l.calls));
  return 1 + Math.min(5, (calls / max) * 5);
}

/**
 * Distance multiplier for a link (recency anchored).
 * Returns a multiplier in [0.6, 1.6] — recent ties pull tighter.
 */
export function linkDistanceMultiplier(daysSince: number): number {
  if (daysSince <= 1) return 0.6;
  if (daysSince <= 3) return 0.85;
  if (daysSince <= 7) return 1.1;
  return 1.6;
}
