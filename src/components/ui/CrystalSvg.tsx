// GUILD AI — Project Crystal (static SVG)
//
// Three overlapping hexagons in the role colors (Dev cyan, Design
// violet, PM yellow) — visual cue for "intelligence is cross-functional".
// The composition is fully static; reduced-motion CSS does nothing because
// we never animate it in the first place.

interface CrystalSvgProps {
  size?: number;
  className?: string;
}

const HEX = "50,4 92,27 92,73 50,96 8,73 8,27";

export function CrystalSvg({ size = 96, className }: CrystalSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="プロジェクト・クリスタル"
      data-testid="crystal-svg"
      className={className}
    >
      <g transform="translate(0,0) rotate(0 50 50)">
        <polygon points={HEX} fill="#6366F1" fillOpacity={0.30} stroke="#6366F1" strokeOpacity={0.80} strokeWidth={1.5} />
      </g>
      <g transform="translate(8,4) rotate(0 50 50)">
        <polygon points={HEX} fill="#A78BFA" fillOpacity={0.30} stroke="#A78BFA" strokeOpacity={0.80} strokeWidth={1.5} />
      </g>
      <g transform="translate(-6,6) rotate(0 50 50)">
        <polygon points={HEX} fill="#FBBF24" fillOpacity={0.25} stroke="#FBBF24" strokeOpacity={0.80} strokeWidth={1.5} />
      </g>
    </svg>
  );
}
