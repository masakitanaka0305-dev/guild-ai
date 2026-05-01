// GUILD AI — Static hex-shaped rank badge.
//
// Tier colors (Intelligence Proof spec):
//   S #FDE047 (Legend) / A #22D3EE (Expert) / B #34D399 (Core) / D #94A3B8 (Seed)
//
// Render is intentionally static: no animation, no glow loops. The shell
// is the single source of truth for the hex contour.

import type { Rank } from "@/types";
import { RANK_COLOR_TOKEN, RANK_SUB_LABEL, RANK_TIER } from "@/lib/grading";

interface HexRankBadgeProps {
  rank: Rank;
  /** Pixel size of the badge. */
  size?: number;
  /** When true, shows the sub-label caption beneath the hex. */
  showSubLabel?: boolean;
}

export function HexRankBadge({ rank, size = 48, showSubLabel = false }: HexRankBadgeProps) {
  const tone = RANK_COLOR_TOKEN[rank];
  const ariaLabel = `${rank}ランク ${RANK_SUB_LABEL[rank]}`;
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={ariaLabel}
        data-rank={rank}
        data-testid="hex-rank-badge"
        className="flex-shrink-0"
      >
        <polygon
          points="50,4 92,27 92,73 50,96 8,73 8,27"
          fill={tone.fill}
          stroke={tone.fill}
          strokeWidth="3"
        />
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontFamily="inherit"
          fontWeight={900}
          fontSize="38"
          fill={tone.ink}
        >
          {rank}
        </text>
      </svg>
      {showSubLabel && (
        <>
          <p className={`text-xs font-bold tracking-widest uppercase ${tone.text}`}>
            {RANK_TIER[rank]}
          </p>
          <p className="text-text-muted text-xs leading-snug max-w-[16ch] text-center">
            {RANK_SUB_LABEL[rank]}
          </p>
        </>
      )}
    </div>
  );
}
