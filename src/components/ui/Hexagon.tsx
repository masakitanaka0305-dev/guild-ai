import type { ReactNode } from "react";

/**
 * Static regular hexagon (flat-top). 6 vertices, no animation.
 *
 * The shell — geometry only. The Water Guild design language uses the
 * hexagon as a structural motif: bordered cards, rank badges, avatar
 * frames. Never a logo, never a character.
 */
export interface HexagonProps {
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  label?: string;
  labelColor?: string;
  ariaLabel?: string;
  className?: string;
  children?: ReactNode;
}

const HEX_POINTS = [
  [50, 4],   // top
  [92, 27],  // upper-right
  [92, 73],  // lower-right
  [50, 96],  // bottom
  [8, 73],   // lower-left
  [8, 27],   // upper-left
] as const;

export const HEXAGON_POLYGON_POINTS = HEX_POINTS.map(([x, y]) => `${x},${y}`).join(" ");

export function Hexagon({
  size = 64,
  fill = "transparent",
  stroke = "#4C1D95",
  strokeWidth = 2,
  label,
  labelColor = "#E2E8F0",
  ariaLabel,
  className,
  children,
}: HexagonProps) {
  const role = ariaLabel ? "img" : undefined;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={role}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={className}
    >
      <polygon
        points={HEXAGON_POLYGON_POINTS}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {label !== undefined && (
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="inherit"
          fontWeight={900}
          fontSize={label.length > 1 ? 28 : 42}
          fill={labelColor}
        >
          {label}
        </text>
      )}
      {children}
    </svg>
  );
}
