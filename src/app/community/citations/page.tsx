"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { getCitationGraph, addRespect, type CitationNode, type CitationEdge } from "@/lib/citation-network";
import { getTopMasters } from "@/lib/master-reputation";
import { useUserId } from "@/components/AuthProvider";

// ─── Constants ────────────────────────────────────────────────────────────────

const SVG_W = 700;
const SVG_H = 480;
const CX = SVG_W / 2;
const CY = SVG_H / 2;

const EDGE_COLOR: Record<string, string> = {
  citation: "#0000CC",
  fork: "#D4AF37",
};

// ─── Layout helpers ───────────────────────────────────────────────────────────

interface NodePos { id: string; x: number; y: number; node: CitationNode; }

function computeLayout(nodes: CitationNode[]): NodePos[] {
  return nodes.map((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    const radius = n.isSelf ? 0 : 180 + n.citationCount * 1.5;
    return {
      id: n.id,
      x: CX + (n.isSelf ? 0 : Math.cos(angle) * Math.min(radius, 260)),
      y: CY + (n.isSelf ? 0 : Math.sin(angle) * Math.min(radius, 200)),
      node: n,
    };
  });
}

function nodeRadius(n: CitationNode): number {
  return n.isSelf ? 26 : 10 + Math.min(n.citationCount * 0.5, 18);
}

// ─── Respect modal ────────────────────────────────────────────────────────────

function RespectModal({ handle, onClose }: { handle: string; onClose: () => void }) {
  const userId = useUserId();
  const [done, setDone] = useState(false);
  const handleRespect = () => {
    addRespect(userId, handle);
    setDone(true);
  };
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`@${handle} への尊敬表明`}
    >
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <p className="font-bold text-[var(--n-text,#1A1714)] mb-2 text-center">
          @{handle} を師として尊敬する
        </p>
        {done ? (
          <p className="text-center text-[var(--n-positive,#0E9F4F)] font-bold mt-4">
            尊敬を表明しました ✓
          </p>
        ) : (
          <p className="text-xs text-[var(--n-muted,#6B6456)] text-center mb-4">
            この師匠への尊敬が記録され、コミュニティランキングに反映されます。
          </p>
        )}
        <div className="flex gap-2 mt-4">
          {!done && (
            <button
              type="button"
              onClick={handleRespect}
              className="flex-1 h-10 rounded-full bg-[var(--n-primary,#0000CC)] text-white text-sm font-bold hover:opacity-90 transition-all"
            >
              尊敬する
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] text-sm font-semibold hover:bg-[var(--n-surface-2,#F5F3EE)] transition-all"
          >
            {done ? "閉じる" : "キャンセル"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CitationsPage() {
  const graph = getCitationGraph();
  const masters = getTopMasters(10);
  const positions = computeLayout(graph.nodes);
  const posMap = new Map(positions.map((p) => [p.id, p]));

  const [hovered, setHovered] = useState<CitationNode | null>(null);
  const [respectTarget, setRespectTarget] = useState<string | null>(null);

  const handleNodeFocus = useCallback((n: CitationNode) => setHovered(n), []);

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-8 pb-24 sm:pb-12">
      <h1 className="sr-only">引用ネットワーク</h1>

      <Link href="/" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline mb-4 inline-block">
        ← ホームに戻る
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 rounded-full bg-[var(--n-primary,#0000CC)]" />
        <h2 className="text-xl font-extrabold text-[var(--n-text,#1A1714)]">引用ネットワーク</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Network SVG */}
        <div className="flex-1 min-w-0">
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl overflow-hidden shadow-sm">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              width="100%"
              height="auto"
              role="img"
              aria-label="引用ネットワーク図"
              className="w-full"
            >
              <title>GUILD AI 引用ネットワーク</title>

              {/* Edges */}
              {graph.edges.map((edge: CitationEdge) => {
                const src = posMap.get(edge.source);
                const tgt = posMap.get(edge.target);
                if (!src || !tgt) return null;
                return (
                  <line
                    key={edge.id}
                    x1={src.x} y1={src.y}
                    x2={tgt.x} y2={tgt.y}
                    stroke={EDGE_COLOR[edge.type]}
                    strokeWidth={edge.type === "citation" ? 1.5 : 1}
                    strokeOpacity={0.4}
                    strokeDasharray={edge.type === "fork" ? "4 3" : undefined}
                  />
                );
              })}

              {/* Nodes */}
              {positions.map((pos) => {
                const r = nodeRadius(pos.node);
                const isHovered = hovered?.id === pos.node.id;
                const rankColor = pos.node.rank === "S" ? "#D4AF37" : pos.node.rank === "A" ? "#0000CC" : "#9890A8";
                return (
                  <g
                    key={pos.id}
                    transform={`translate(${pos.x},${pos.y})`}
                    tabIndex={0}
                    role="button"
                    aria-label={`@${pos.node.handle} — 被引用 ${pos.node.citationCount} 回`}
                    onFocus={() => handleNodeFocus(pos.node)}
                    onMouseEnter={() => handleNodeFocus(pos.node)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer outline-none"
                  >
                    <title>{`@${pos.node.handle}: ${pos.node.title} — 被引用 ${pos.node.citationCount}回`}</title>
                    <circle
                      r={isHovered ? r + 3 : r}
                      fill={rankColor}
                      fillOpacity={0.15}
                      stroke={rankColor}
                      strokeWidth={isHovered ? 2 : 1.5}
                      className="transition-all duration-150"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={pos.node.isSelf ? 9 : 7}
                      fill={rankColor}
                      fontWeight="700"
                    >
                      {pos.node.handle.slice(0, 5)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="px-4 pb-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 bg-[#0000CC] rounded-full" />
                <span className="text-[10px] text-[var(--n-muted,#6B6456)]">引用</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 bg-[#D4AF37] rounded-full border-dashed border" style={{ borderStyle: "dashed" }} />
                <span className="text-[10px] text-[var(--n-muted,#6B6456)]">派生（fork）</span>
              </div>
              {hovered && (
                <div className="ml-auto text-[10px] text-[var(--n-text,#1A1714)] font-semibold">
                  @{hovered.handle} — 被引用 {hovered.citationCount} 回
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Master ranking sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-[var(--n-gold,#D4AF37)]" />
              <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">師匠（マスター）</p>
            </div>
            <ol className="space-y-2">
              {masters.map((m, i) => (
                <li key={m.handle} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--n-surface-2,#F5F3EE)] flex items-center justify-center text-[10px] font-bold text-[var(--n-muted,#6B6456)] shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--n-text,#1A1714)] truncate">@{m.handle}</p>
                    <p className="text-[9px] text-[var(--n-muted,#6B6456)]">{m.label} · {m.masterScore}pt</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRespectTarget(m.handle)}
                    className="shrink-0 text-[9px] font-semibold text-[var(--n-primary,#0000CC)] border border-[var(--n-primary,#0000CC)]/30 rounded-full px-2 py-0.5 hover:bg-[var(--n-primary,#0000CC)]/5 transition-colors"
                    aria-label={`@${m.handle} を師として尊敬する`}
                  >
                    尊敬
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {respectTarget && (
        <RespectModal handle={respectTarget} onClose={() => setRespectTarget(null)} />
      )}
    </main>
  );
}
