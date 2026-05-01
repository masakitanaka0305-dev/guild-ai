"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MAP_NODE_COLOR,
  linkDistanceMultiplier,
  linkStrokeWidth,
  type MapGraph,
  type MapNodeType,
} from "@/lib/knowledge-map";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * KnowledgeMap (#130) — d3-force layout with the user pinned at center.
 *
 *   self     → white dot (center, fx/fy locked)
 *   md       → blue (#4C1D95) cards
 *   project  → violet inbound projects
 *   atoa     → gold AtoA counterparties
 *
 * Reduced-motion users get a static deterministic layout (no physics
 * tick), so screen readers + low-power devices don't pay for a
 * simulation. Each node is Tab-reachable (tabIndex=0); Enter triggers
 * the stub onSelect callback (no nav today, but ready when we wire
 * detail pages).
 */
export interface KnowledgeMapProps {
  graph: MapGraph;
  width?: number;
  height?: number;
  selfId: string;
}

interface LayoutPoint {
  id: string;
  x: number;
  y: number;
}

const DEFAULT_W = 720;
const DEFAULT_H = 520;

function staticLayout(graph: MapGraph, w: number, h: number, selfId: string): LayoutPoint[] {
  // Concentric rings: self at center, each non-self type on its own ring.
  const cx = w / 2;
  const cy = h / 2;
  const groups: Record<MapNodeType, string[]> = { self: [], md: [], project: [], atoa: [] };
  for (const n of graph.nodes) groups[n.type].push(n.id);

  const RADII: Record<MapNodeType, number> = { self: 0, md: 110, project: 200, atoa: 240 };
  const out: LayoutPoint[] = [];
  for (const t of ["self", "md", "project", "atoa"] as const) {
    const ids = groups[t];
    const r = RADII[t];
    ids.forEach((id, i) => {
      if (t === "self") {
        out.push({ id, x: cx, y: cy });
      } else {
        const angle = (i / Math.max(1, ids.length)) * Math.PI * 2 + (t === "project" ? 0.4 : t === "atoa" ? 0.9 : 0);
        out.push({ id, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
      }
    });
  }
  return out;
}

export function KnowledgeMap({
  graph,
  width = DEFAULT_W,
  height = DEFAULT_H,
  selfId,
}: KnowledgeMapProps) {
  const reduced = usePrefersReducedMotion();
  const [points, setPoints] = useState<LayoutPoint[]>(() => staticLayout(graph, width, height, selfId));
  const [activeId, setActiveId] = useState<string | null>(null);

  const linksWithIds = useMemo(() => graph.links.map((l, i) => ({ ...l, key: `${l.source}-${l.target}-${i}` })), [graph.links]);
  const pos = useMemo(() => Object.fromEntries(points.map((p) => [p.id, p])), [points]);

  // Force layout (skipped under reduced-motion).
  useEffect(() => {
    if (reduced) {
      setPoints(staticLayout(graph, width, height, selfId));
      return;
    }
    let cancelled = false;
    (async () => {
      const cx = width / 2;
      const cy = height / 2;
      const { forceSimulation, forceLink, forceManyBody, forceCenter, forceX, forceY } =
        await import("d3-force");
      if (cancelled) return;
      const initial = staticLayout(graph, width, height, selfId);
      const nodes = graph.nodes.map((n) => {
        const seed = initial.find((p) => p.id === n.id)!;
        return {
          id: n.id,
          x: seed.x,
          y: seed.y,
          fx: n.id === selfId ? cx : undefined,
          fy: n.id === selfId ? cy : undefined,
        };
      });
      const links = graph.links.map((l) => ({
        source: l.source,
        target: l.target,
        distance: 130 * linkDistanceMultiplier(l.daysSince),
      }));
      const sim = forceSimulation(nodes)
        .force("link", forceLink(links).id((d) => (d as { id: string }).id).distance((d) => (d as { distance: number }).distance))
        .force("charge", forceManyBody().strength(-280))
        .force("center", forceCenter(cx, cy))
        .force("x", forceX(cx).strength(0.05))
        .force("y", forceY(cy).strength(0.05))
        .stop();
      sim.tick(300);
      if (cancelled) return;
      setPoints(
        nodes.map((n) => ({
          id: n.id,
          x: Math.min(Math.max(n.x, 32), width - 32),
          y: Math.min(Math.max(n.y, 32), height - 32),
        })),
      );
    })();
    return () => { cancelled = true; };
  }, [graph, width, height, selfId, reduced]);

  return (
    <svg
      data-testid="knowledge-map"
      data-self-id={selfId}
      role="img"
      aria-label="知恵の地図：自分のノートと外部とのつながり"
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-full h-auto bg-[var(--color-bg-base)] rounded-2xl border border-[var(--color-border-subtle)]"
    >
      {/* Edges */}
      {linksWithIds.map((link) => {
        const a = pos[link.source];
        const b = pos[link.target];
        if (!a || !b) return null;
        return (
          <line
            key={link.key}
            data-testid="knowledge-map-edge"
            data-source={link.source}
            data-target={link.target}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(196,181,253,0.4)"
            strokeWidth={linkStrokeWidth(graph, link.calls)}
          />
        );
      })}
      {/* Nodes */}
      {graph.nodes.map((n) => {
        const p = pos[n.id];
        if (!p) return null;
        const isSelf = n.id === selfId;
        const isActive = activeId === n.id;
        const fill = MAP_NODE_COLOR[n.type];
        const r = isSelf ? 14 : 8 + n.weight * 4;
        return (
          <g
            key={n.id}
            data-testid="knowledge-map-node"
            data-type={n.type}
            data-self={isSelf ? "true" : "false"}
            tabIndex={0}
            role="button"
            aria-label={`${n.type === "self" ? "あなた" : n.type === "md" ? "知恵カード" : n.type === "project" ? "お困りごと" : "AI 取引相手"}：${n.label}`}
            onFocus={() => setActiveId(n.id)}
            onMouseEnter={() => setActiveId(n.id)}
            onMouseLeave={() => setActiveId(null)}
            onBlur={() => setActiveId(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveId(n.id);
              }
            }}
            transform={`translate(${p.x} ${p.y})`}
            className="cursor-pointer focus:outline-none"
          >
            <circle
              r={r}
              fill={fill}
              stroke={isSelf ? "#F59E0B" : isActive ? "#FFFFFF" : "rgba(248,250,252,0.2)"}
              strokeWidth={isSelf || isActive ? 2 : 1}
            />
            <text
              x="0"
              y={r + 14}
              textAnchor="middle"
              fontSize="11"
              fill="#F1F5F9"
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
