import type { Rank } from "@/types";
import { Hexagon } from "@/components/ui/Hexagon";
import { RANK_COLOR_TOKEN, RANK_TIER } from "@/lib/grading";

// ─── Mercari Lightness (#126) — Hexagonal Rank Medal ───────────────
// 金 / 銀 / 銅 / みならい. The medal colors are sourced from the
// canonical RANK_COLOR_TOKEN dictionary so they stay in lockstep with
// HexRankBadge / grading / rankCardCta.

const STROKE: Record<Rank, string> = {
  S: "#CA8A04", // gold edge
  A: "#94A3B8", // silver edge
  B: "#92400E", // bronze edge
  D: "rgba(148,163,184,0.45)",
};

interface RankBadgeProps {
  rank: Rank;
  large?: boolean;
  showLabel?: boolean;
  /** @deprecated kept for API compat — Water Guild renders one consistent badge */
  friendly?: boolean;
}

export function RankBadge({ rank, large, showLabel = false }: RankBadgeProps) {
  const tone = RANK_COLOR_TOKEN[rank];
  const size = large ? 56 : 36;
  const letter = rank === "D" ? "—" : rank;
  const tier = RANK_TIER[rank];
  const fill = rank === "D" ? "transparent" : tone.fill;
  return (
    <span
      className="inline-flex items-center gap-2 align-middle"
      aria-label={`ランク ${rank} — ${tier}の太鼓判`}
    >
      <Hexagon
        size={size}
        fill={fill}
        stroke={STROKE[rank]}
        strokeWidth={2}
        label={letter}
        labelColor={tone.ink}
        ariaLabel={`ランク ${rank}`}
      />
      {showLabel && (
        <span className={`text-xs font-bold ${tone.text}`}>
          {tier}の太鼓判
        </span>
      )}
    </span>
  );
}
