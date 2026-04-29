"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getLineage } from "@/lib/lineage";
import type { LineageNode, LineageLink, LineageGraph } from "@/lib/lineage";

// ─── Constants ────────────────────────────────────────────────────────────────

const SVG_W = 800;
const SVG_H = 540;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const NODE_R: Record<string, number> = { self: 28, parent: 18, child: 14 };
const RANK_COLOR: Record<string, string> = { S: "#D4AF37", A: "#E64545", B: "#9890A8" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodePos {
  id: string;
  x: number;
  y: number;
}

// ─── Compute tree layout (manual — no d3 needed for default mode) ─────────────

function computeTreeLayout(graph: LineageGraph): NodePos[] {
  const parents  = graph.nodes.filter((n) => n.type === "parent");
  const children = graph.nodes.filter((n) => n.type === "child");

  const parentPositions: NodePos[] = parents.map((n, i) => ({
    id: n.id,
    x: (SVG_W / (parents.length + 1)) * (i + 1),
    y: 90,
  }));

  const childPositions: NodePos[] = children.map((n, i) => ({
    id: n.id,
    x: (SVG_W / (children.length + 1)) * (i + 1),
    y: SVG_H - 80,
  }));

  return [...parentPositions, { id: "self", x: CX, y: CY }, ...childPositions];
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function NodeTooltip({ node, x, y }: { node: LineageNode; x: number; y: number }) {
  const TW = 160, TH = 70;
  const tx = Math.min(Math.max(x - TW / 2, 8), SVG_W - TW - 8);
  const ty = y < CY ? y + 36 : y - TH - 36;
  return (
    <foreignObject x={tx} y={ty} width={TW} height={TH}>
      <div
        className="bg-[#1A1714] text-white rounded-xl px-3 py-2 shadow-lg"
        style={{ fontSize: "11px", lineHeight: 1.4 }}
      >
        <p className="font-bold truncate">{node.title}</p>
        <p className="text-gray-300">ランク {node.rank}</p>
        <p className="text-[var(--n-gold,#D4AF37)] tabular-nums">
          月 ¥{node.monthlyJpy.toLocaleString("ja-JP")}
        </p>
      </div>
    </foreignObject>
  );
}

function EdgeTooltip({ link, x, y }: { link: LineageLink; x: number; y: number }) {
  const TW = 140, TH = 52;
  const tx = Math.min(Math.max(x - TW / 2, 8), SVG_W - TW - 8);
  const ty = y - TH - 8;
  return (
    <foreignObject x={tx} y={ty} width={TW} height={TH}>
      <div
        className="bg-[#1A1714] text-white rounded-xl px-3 py-2 shadow-lg"
        style={{ fontSize: "11px", lineHeight: 1.4 }}
      >
        <p className="text-[var(--n-gold,#D4AF37)]">分配率 {link.shareRate}%</p>
        <p className="text-gray-300 tabular-nums">
          月額流量 ¥{link.monthlyFlowJpy.toLocaleString("ja-JP")}
        </p>
      </div>
    </foreignObject>
  );
}

// ─── Main graph component ─────────────────────────────────────────────────────

function LineageGraph({
  graph,
  layoutMode,
}: {
  graph: LineageGraph;
  layoutMode: "tree" | "force";
}) {
  const [positions, setPositions] = useState<NodePos[]>(() => computeTreeLayout(graph));
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Recompute layout when mode changes
  useEffect(() => {
    if (layoutMode === "tree") {
      setPositions(computeTreeLayout(graph));
      return;
    }

    // Force layout via dynamic import of d3-force
    let cancelled = false;
    (async () => {
      const { forceSimulation, forceLink, forceManyBody, forceCenter, forceX, forceY } =
        await import("d3-force");

      if (cancelled) return;

      const nodes = graph.nodes.map((n) => {
        const tree = computeTreeLayout(graph);
        const pos = tree.find((p) => p.id === n.id)!;
        return { id: n.id, x: pos.x, y: pos.y, fx: n.type === "self" ? CX : undefined, fy: n.type === "self" ? CY : undefined };
      });

      const links = graph.links.map((l) => ({ source: l.source, target: l.target }));

      const sim = forceSimulation(nodes)
        .force("link", forceLink(links).id((d) => (d as { id: string }).id).distance(150))
        .force("charge", forceManyBody().strength(-220))
        .force("center", forceCenter(CX, CY))
        .force("x", forceX(CX).strength(0.05))
        .force("y", forceY(CY).strength(0.05))
        .stop();

      sim.tick(300);

      if (!cancelled) {
        setPositions(nodes.map((n) => ({
          id: n.id,
          x: Math.min(Math.max(n.x, 30), SVG_W - 30),
          y: Math.min(Math.max(n.y, 30), SVG_H - 30),
        })));
      }
    })();

    return () => { cancelled = true; };
  }, [layoutMode, graph]);

  const posMap = Object.fromEntries(positions.map((p) => [p.id, p]));
  const allNodes = graph.nodes;
  const flatNodes = [...graph.nodes.filter(n => n.type === "parent"), graph.nodes.find(n => n.type === "self")!, ...graph.nodes.filter(n => n.type === "child")];

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setSelectedIdx((i) => (i + 1) % flatNodes.length);
      if (e.key === "ArrowLeft")  setSelectedIdx((i) => (i - 1 + flatNodes.length) % flatNodes.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flatNodes.length]);

  const selectedNode = flatNodes[selectedIdx];

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full"
      role="img"
      aria-label="知能家系図：このノートの依存関係と収益分配経路"
      tabIndex={0}
    >
      <title>知能家系図：依存関係と収益分配経路</title>

      {/* Defs for particle paths */}
      <defs>
        {graph.links.map((link) => {
          const s = posMap[link.source];
          const t = posMap[link.target];
          if (!s || !t) return null;
          return (
            <path
              key={`def-${link.id}`}
              id={`path-${link.id}`}
              d={`M ${s.x} ${s.y} L ${t.x} ${t.y}`}
            />
          );
        })}
      </defs>

      {/* Edges */}
      {graph.links.map((link) => {
        const s = posMap[link.source];
        const t = posMap[link.target];
        if (!s || !t) return null;
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        return (
          <g key={link.id}>
            <line
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={hoveredEdge === link.id ? "#D4AF37" : "rgba(0,0,0,0.15)"}
              strokeWidth={hoveredEdge === link.id ? 2 : 1.5}
              strokeDasharray={link.source === "self" ? "none" : "4 3"}
            />
            {/* Clickable invisible overlay for edge hover */}
            <line
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke="transparent"
              strokeWidth={12}
              onMouseEnter={() => setHoveredEdge(link.id)}
              onMouseLeave={() => setHoveredEdge(null)}
              style={{ cursor: "pointer" }}
            />
            {/* Particle animation along edge */}
            {!reducedMotion && (
              <circle r={3} fill="#D4AF37" opacity={0.85}>
                <animateMotion
                  dur={`${1.8 + (link.shareRate % 5) * 0.2}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#path-${link.id}`} />
                </animateMotion>
              </circle>
            )}
            {hoveredEdge === link.id && (
              <EdgeTooltip link={link} x={mx} y={my} />
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {allNodes.map((node) => {
        const pos = posMap[node.id];
        if (!pos) return null;
        const r = NODE_R[node.type] ?? 14;
        const isSelected = selectedNode?.id === node.id;
        return (
          <g
            key={node.id}
            tabIndex={-1}
            role="button"
            aria-label={`${node.title} ランク${node.rank} 月収¥${node.monthlyJpy.toLocaleString("ja-JP")}`}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{ cursor: "pointer" }}
          >
            <title>{node.title} — ランク {node.rank} — 月 ¥{node.monthlyJpy.toLocaleString("ja-JP")}</title>
            <circle
              cx={pos.x} cy={pos.y} r={r + (isSelected ? 3 : 0)}
              fill={node.type === "self" ? "#FAFAF7" : "white"}
              stroke={node.type === "self" ? RANK_COLOR[node.rank] : "rgba(0,0,0,0.12)"}
              strokeWidth={node.type === "self" ? 3 : 1.5}
            />
            {/* Rank badge inside */}
            <text
              x={pos.x} y={pos.y + 4}
              textAnchor="middle"
              fontSize={node.type === "self" ? 13 : 9}
              fontWeight="bold"
              fill={RANK_COLOR[node.rank]}
            >
              {node.rank}
            </text>
            {/* Label below */}
            <text
              x={pos.x} y={pos.y + r + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#6B6456"
            >
              {node.title.length > 10 ? node.title.slice(0, 10) + "…" : node.title}
            </text>
            {hoveredNode === node.id && (
              <NodeTooltip node={node} x={pos.x} y={pos.y} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LineagePage({ params }: { params: { guildId: string } }) {
  const guildId = decodeURIComponent(params.guildId);
  const graph = getLineage(guildId);
  const [layoutMode, setLayoutMode] = useState<"tree" | "force">("tree");

  const selfNode = graph.nodes.find((n) => n.type === "self");
  const parents  = graph.nodes.filter((n) => n.type === "parent");
  const children = graph.nodes.filter((n) => n.type === "child");

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <Link href={`/asset/${guildId}`} className="text-xs text-[var(--n-muted,#6B6456)] hover:underline">
            ← 資産詳細に戻る
          </Link>
          <h1 className="text-lg font-bold text-[var(--n-text,#1A1714)] mt-1">
            知能家系図
          </h1>
          <p className="text-xs text-[var(--n-muted,#6B6456)]">
            依存元（親）{parents.length} 件 ／ 派生作品（子）{children.length} 件
          </p>
        </div>
        {/* Layout toggle */}
        <div className="flex gap-2">
          {(["tree", "force"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setLayoutMode(mode)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                layoutMode === mode
                  ? "bg-[var(--n-primary,#E64545)] text-white"
                  : "bg-white border border-gray-200 text-[var(--n-muted,#6B6456)] hover:border-[var(--n-primary,#E64545)]"
              }`}
            >
              {mode === "tree" ? "ツリー表示" : "力学表示"}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-[var(--n-muted,#6B6456)]">
        {[
          { label: "自分のノート", color: "border-[#E64545]", bg: "bg-[#FAFAF7]" },
          { label: "親（依存元）", color: "border-black/20", bg: "bg-white" },
          { label: "子（引用先）", color: "border-black/20", bg: "bg-white" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded-full border-2 ${item.color} ${item.bg} inline-block`} />
            {item.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-[#D4AF37] inline-block" />
          分配経路（金色の粒子が流れる）
        </span>
      </div>

      {/* SVG graph */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--n-divider,rgba(0,0,0,0.08))] bg-white p-4 shadow-sm">
        <LineageGraph graph={graph} layoutMode={layoutMode} />
      </div>

      {/* Stats summary */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[var(--n-divider,rgba(0,0,0,0.08))] p-3 text-center">
          <p className="text-[10px] text-[var(--n-muted,#6B6456)]">総ノード数</p>
          <p className="text-lg font-black text-[var(--n-text,#1A1714)]">{graph.nodes.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--n-divider,rgba(0,0,0,0.08))] p-3 text-center">
          <p className="text-[10px] text-[var(--n-muted,#6B6456)]">分配経路数</p>
          <p className="text-lg font-black text-[var(--n-text,#1A1714)]">{graph.links.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--n-divider,rgba(0,0,0,0.08))] p-3 text-center">
          <p className="text-[10px] text-[var(--n-muted,#6B6456)]">月間流量</p>
          <p className="text-sm font-black text-[var(--n-gold,#D4AF37)] tabular-nums">
            ¥{graph.links.reduce((s, l) => s + l.monthlyFlowJpy, 0).toLocaleString("ja-JP")}
          </p>
        </div>
      </div>
    </main>
  );
}
