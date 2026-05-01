// GUILD AI — Static hex-shaped rank badge.
//
// Tier colors (Cinematic Mint #128 — pulled from RANK_COLOR_TOKEN):
//   S #F59E0B (Legend, Electric Gold)
//   A #94A3B8 (Expert, Silver)
//   B #B45309 (Core,   Bronze)
//   D #94A3B8 (Seed,   Slate)
//
// Render stays static — no infinite-loop glows. The Cinematic Mint
// reveal layers a one-shot rank-aware glow *outside* this component
// (see CinematicMint.tsx → rankGlowShadow).

import type { Rank } from "@/types";
import { RANK_COLOR_TOKEN, RANK_SUB_LABEL, RANK_TIER } from "@/lib/grading";

interface HexRankBadgeProps {
  rank: Rank;
  /** Pixel size of the badge. */
  size?: number;
  /** When true, shows the sub-label caption beneath the hex. */
  showSubLabel?: boolean;
  /** When true (Cinematic Mint), the badge sits inside a rank-coordinated
   *  drop-shadow halo so the reveal radiates the medal's tier color. */
  glow?: boolean;
}

const GLOW_FILTER: Record<Rank, string> = {
  S: "drop-shadow(0 0 16px rgba(245,158,11,0.55))",
  A: "drop-shadow(0 0 12px rgba(148,163,184,0.45))",
  B: "drop-shadow(0 0 12px rgba(180,83,9,0.45))",
  D: "drop-shadow(0 0 8px rgba(148,163,184,0.35))",
};

export function HexRankBadge({ rank, size = 48, showSubLabel = false, glow = false }: HexRankBadgeProps) {
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
        data-glow={glow ? "on" : "off"}
        data-testid="hex-rank-badge"
        className="flex-shrink-0"
        style={glow ? { filter: GLOW_FILTER[rank] } : undefined}
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
