import type { Rank } from "@/types";
import { Hexagon } from "@/components/ui/Hexagon";

// ─── Water Guild — Hexagonal Rank Badge ─────────────────────────────
// Geometry as authority: the rank is encoded in fill / stroke / text
// inside a static regular hexagon. No icons, no character art.
//
// S — solid cyan fill, deep-sea ink letter      (お墨付き)
// A — surface fill,   cyan stroke, cyan letter  (高評価)
// B — surface fill,   muted stroke, muted letter (標準)
// D — divider stroke, muted letter              (非公開)

const RANK_STYLE: Record<
  Rank,
  { fill: string; stroke: string; labelColor: string; sublabel: string }
> = {
  S: {
    fill: "#22D3EE",
    stroke: "#22D3EE",
    labelColor: "#0B1121",
    sublabel: "お墨付き",
  },
  A: {
    fill: "#162035",
    stroke: "#22D3EE",
    labelColor: "#22D3EE",
    sublabel: "高評価",
  },
  B: {
    fill: "#162035",
    stroke: "#475569",
    labelColor: "#94A3B8",
    sublabel: "標準",
  },
  D: {
    fill: "transparent",
    stroke: "rgba(148,163,184,0.45)",
    labelColor: "#94A3B8",
    sublabel: "非公開",
  },
};

interface RankBadgeProps {
  rank: Rank;
  large?: boolean;
  showLabel?: boolean;
  /** @deprecated kept for API compat — Water Guild renders one consistent badge */
  friendly?: boolean;
}

export function RankBadge({ rank, large, showLabel = false }: RankBadgeProps) {
  const style = RANK_STYLE[rank];
  const size = large ? 56 : 36;
  const letter = rank === "D" ? "—" : rank;
  return (
    <span
      className="inline-flex items-center gap-2 align-middle"
      aria-label={`ランク ${rank} — ${style.sublabel}`}
    >
      <Hexagon
        size={size}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={2}
        label={letter}
        labelColor={style.labelColor}
        ariaLabel={`ランク ${rank}`}
      />
      {showLabel && (
        <span
          className="text-xs font-bold"
          style={{ color: style.labelColor }}
        >
          {style.sublabel}
        </span>
      )}
    </span>
  );
}
