"use client";

import Link from "next/link";
import { KnowledgeMap } from "@/components/map/KnowledgeMap";
import { demoKnowledgeGraph, MAP_NODE_COLOR } from "@/lib/knowledge-map";

/**
 * /profile/map (#130) — Knowledge Map.
 *
 * The graph centers the user and surrounds them with three node kinds:
 * registered MDs (blue), inbound projects (violet), and AtoA
 * counterparties (gold). Edge thickness is normalised by call volume,
 * distance by recency.
 */
export default function KnowledgeMapPage() {
  const handle = "you";
  const graph = demoKnowledgeGraph(handle);

  return (
    <main
      data-testid="knowledge-map-page"
      className="bg-midnight-base text-white min-h-screen min-h-dvh px-4 sm:px-6 py-8 max-w-5xl mx-auto pb-24"
    >
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-white font-semibold text-2xl tracking-tight">
            知恵の地図 (Knowledge Map)
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            あなたを中心に、知恵カードと外部のつながりを描いています。線の太さ ＝ 使われた回数、距離 ＝ 直近性。
          </p>
        </div>
        <Link
          href="/profile"
          className="text-xs font-semibold text-[var(--color-link)] underline-offset-4 hover:underline"
        >
          ← プロフィールに戻る
        </Link>
      </header>

      {/* Legend */}
      <ul
        data-testid="knowledge-map-legend"
        className="flex flex-wrap gap-3 mb-4 text-[11px] text-[var(--color-text-muted)]"
      >
        {([
          { type: "self",    label: "あなた" },
          { type: "md",      label: "知恵カード" },
          { type: "project", label: "お困りごと" },
          { type: "atoa",    label: "AI 取引相手" },
        ] as const).map((item) => (
          <li key={item.type} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: MAP_NODE_COLOR[item.type] }}
            />
            {item.label}
          </li>
        ))}
      </ul>

      <KnowledgeMap graph={graph} selfId={handle} />

      <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">
        ノードは Tab で移動 / Enter で詳細プレビュー（フォーカス強調）。
      </p>
    </main>
  );
}
