import Link from "next/link";
import { getLineage } from "@/lib/lineage";

// ─── Data helpers ─────────────────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}
function lcg(n: number): number {
  return ((n * 1664525 + 1013904223) >>> 0);
}

interface MonthBar {
  month: string;
  total: number;
  segments: { value: number; color: string }[];
}

const SEGMENT_COLORS = ["#4C1D95", "#D4AF37", "#0E9F4F", "#2563EB", "#9B59B6"];

function getStackingChartData(seedStr: string): MonthBar[] {
  let seed = djb2(seedStr + "stacking-chart");
  const months: MonthBar[] = [];
  const now = new Date("2026-04-29T00:00:00Z");

  for (let i = 11; i >= 0; i--) {
    seed = lcg(seed);
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const month = `${d.getMonth() + 1}月`;

    // 3-5 segment contributions
    seed = lcg(seed);
    const numSegs = 3 + (seed % 3);
    const segments = Array.from({ length: numSegs }, (_, j) => {
      seed = lcg(seed);
      const value = 200 + (seed % 1800);
      return { value, color: SEGMENT_COLORS[j % SEGMENT_COLORS.length] };
    });
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    months.push({ month, total, segments });
  }
  return months;
}

// ─── SVG Network ──────────────────────────────────────────────────────────────

const W = 480;
const H = 280;
const CX = W / 2;
const CY = H / 2 - 10;

const RANK_COLORS: Record<string, string> = { S: "#D4AF37", A: "#4C1D95", B: "#2563EB" };

interface NetworkNode {
  x: number;
  y: number;
  label: string;
  rank: string;
  r: number;
  type: string;
}

function buildNetworkNodes(
  children: Array<{ title: string; rank: string }>,
  maxNodes = 30,
): NetworkNode[] {
  const displayed = children.slice(0, maxNodes);
  const nodes: NetworkNode[] = [];

  // Ring radii
  const ring1Max = 8;
  const ring2Max = 12;
  const ring3Max = 10;

  displayed.forEach((child, i) => {
    let radius: number;
    let angleCount: number;
    let ringIndex: number;

    if (i < ring1Max) {
      radius = 90;
      angleCount = Math.min(ring1Max, displayed.length);
      ringIndex = i;
    } else if (i < ring1Max + ring2Max) {
      radius = 145;
      angleCount = Math.min(ring2Max, displayed.length - ring1Max);
      ringIndex = i - ring1Max;
    } else {
      radius = 195;
      angleCount = Math.min(ring3Max, displayed.length - ring1Max - ring2Max);
      ringIndex = i - ring1Max - ring2Max;
    }

    const angle = (ringIndex / angleCount) * 2 * Math.PI - Math.PI / 2;
    nodes.push({
      x: CX + radius * Math.cos(angle),
      y: CY + radius * Math.sin(angle),
      label: child.title.slice(0, 10),
      rank: child.rank,
      r: 10,
      type: "child",
    });
  });

  return nodes;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "積み重なる知恵 — GUILD AI",
  description: "あなたの知恵が誰の創造を支えているかを可視化するスタッキングダッシュボード。",
};

export default function StackingPage() {
  const lineage = getLineage("stacking-demo-user");
  const children = lineage.nodes.filter((n) => n.type === "child");
  const displayed = children.slice(0, 30);
  const networkNodes = buildNetworkNodes(displayed);
  const chartData = getStackingChartData("stacking-demo-user");

  const maxBar = Math.max(...chartData.map((m) => m.total), 1);
  const CHART_H = 100;
  const CHART_W = 460;
  const barW = Math.floor(CHART_W / 12) - 2;
  const totalDescendants = displayed.length;

  // Unique "people" = distinct child nodes (deterministic mock count)
  const uniquePeople = Math.min(totalDescendants + djb2("stacking-demo-user") % 20, totalDescendants + 15);

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      <Link href="/profile" className="text-xs text-slate-400 hover:text-kaki transition-colors">
        ← プロフィールに戻る
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-white">積み重なる知恵</h1>
        <p className="text-sm text-slate-400 mt-1">
          あなたのどのノートが、誰の創造を支えているかを可視化します。
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-2xl border border-[var(--primary,#4C1D95)]/20 bg-[var(--primary,#4C1D95)]/5 p-5 text-center">
        <p className="text-lg font-black text-[var(--primary,#4C1D95)] leading-snug">
          {totalDescendants} 件の知恵が、{uniquePeople} 人の創造を支えています
        </p>
        <p className="text-xs text-slate-400 mt-1">直近30日のデータをもとに算出（モック）</p>
      </div>

      {/* Network SVG */}
      <section className="section-card p-5 mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
          知恵のネットワーク
        </h2>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            role="img"
            aria-label={`知恵のネットワーク — ${totalDescendants}件の派生ノート`}
            className="block"
          >
            <title>知恵のネットワーク — あなたのノートを引用・派生した知恵の繋がり</title>
            {/* Lines from center to each child */}
            {networkNodes.map((n, i) => (
              <line
                key={`line_${i}`}
                x1={CX} y1={CY}
                x2={n.x} y2={n.y}
                stroke="#E9E7E1"
                strokeWidth="1"
              />
            ))}
            {/* Child nodes */}
            {networkNodes.map((n, i) => (
              <g key={`node_${i}`}>
                <circle
                  cx={n.x} cy={n.y} r={n.r}
                  fill={RANK_COLORS[n.rank] ?? "#9890A8"}
                  opacity="0.85"
                />
                <text
                  x={n.x} y={n.y + n.r + 10}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#6B6456"
                >
                  {n.label}
                </text>
              </g>
            ))}
            {/* Self node (center) */}
            <circle cx={CX} cy={CY} r={20} fill="#4C1D95" opacity="0.95" />
            <text x={CX} y={CY + 1} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
              あなた
            </text>
          </svg>
        </div>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-400 justify-center">
          {Object.entries(RANK_COLORS).map(([rank, color]) => (
            <span key={rank} className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {rank}ランク
            </span>
          ))}
        </div>
      </section>

      {/* Stacked Bar Chart */}
      <section className="section-card p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
          積み重なる資産（月次）
        </h2>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_W + 20} ${CHART_H + 30}`}
            width="100%"
            height={CHART_H + 30}
            role="img"
            aria-label="月次積み重なる資産グラフ（12ヶ月）"
          >
            <title>直近12ヶ月の積み重なる資産グラフ</title>
            {chartData.map((bar, i) => {
              const x = 10 + i * (barW + 2);
              const totalH = (bar.total / maxBar) * CHART_H;
              let yOffset = CHART_H;

              return (
                <g key={bar.month}>
                  {bar.segments.map((seg, j) => {
                    const segH = (seg.value / maxBar) * CHART_H;
                    yOffset -= segH;
                    return (
                      <rect
                        key={j}
                        x={x} y={yOffset}
                        width={barW} height={segH}
                        fill={seg.color}
                        opacity="0.8"
                        aria-label={`${bar.month} セグメント${j + 1}: ¥${seg.value.toLocaleString("ja-JP")}`}
                      />
                    );
                  })}
                  <text
                    x={x + barW / 2}
                    y={CHART_H + 16}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#9890A8"
                  >
                    {bar.month}
                  </text>
                  {/* invisible hover rect for aria */}
                  <rect
                    x={x} y={CHART_H - totalH}
                    width={barW} height={totalH}
                    fill="transparent"
                    aria-label={`${bar.month}: 合計 ¥${bar.total.toLocaleString("ja-JP")}`}
                  />
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mt-2 flex items-center gap-3 justify-center flex-wrap">
          {SEGMENT_COLORS.slice(0, 3).map((color, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
              {i === 0 ? "直系子孫" : i === 1 ? "孫世代" : "曾孫以降"}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-slate-400 text-center">
          各色 = 子孫ノードの貢献の大きさ（モックデータ）
        </p>
      </section>

      {/* CTA */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/sell"
          className="rounded-xl bg-[var(--primary,#4C1D95)] px-4 py-3 text-sm font-bold text-white text-center hover:opacity-90 transition-opacity"
        >
          新しいノートを追加 →
        </Link>
        <Link
          href="/profile"
          className="rounded-xl border border-kaki/30 bg-kaki/5 px-4 py-3 text-sm font-semibold text-kaki text-center hover:bg-kaki/10 transition-colors"
        >
          プロフィールに戻る
        </Link>
      </div>
    </main>
  );
}
