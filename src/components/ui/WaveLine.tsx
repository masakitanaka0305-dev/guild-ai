/**
 * Static wave line-art. A single sinuous SVG path drawn at low
 * opacity — enough to read as "depth, water, persistence" without
 * shouting. No animation.
 *
 * Used as a subtle separator under dashboard headings.
 */
export interface WaveLineProps {
  height?: number;
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  className?: string;
  ariaLabel?: string;
}

export function WaveLine({
  height = 24,
  color = "#4C1D95",
  opacity = 0.3,
  strokeWidth = 1.25,
  className,
  ariaLabel,
}: WaveLineProps) {
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={className}
    >
      <path
        d="M0 30 Q 25 10, 50 30 T 100 30"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
