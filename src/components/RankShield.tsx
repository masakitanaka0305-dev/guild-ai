interface Props {
  rank: "S" | "A" | "B";
  size?: 48 | 64;
}

const RANK_COLOR: Record<string, { stroke: string; fill: string; text: string }> = {
  S: { stroke: "#D4AF37", fill: "#1A1714", text: "#D4AF37" },
  A: { stroke: "#6366F1", fill: "#1A1714", text: "#6366F1" },
  B: { stroke: "#9890A8", fill: "#1A1714", text: "#9890A8" },
};

export function RankShield({ rank, size = 48 }: Props) {
  const { stroke, fill, text } = RANK_COLOR[rank] ?? RANK_COLOR["B"];
  const r = size / 2;
  const fontSize = size >= 64 ? 28 : 20;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`鑑定バッジ ${rank} ランク`}
    >
      <title>{rank} ランク 鑑定バッジ</title>
      <circle cx={r} cy={r} r={r - 2} fill={fill} stroke={stroke} strokeWidth={3} />
      <text
        x={r}
        y={r + fontSize * 0.38}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fill={text}
        fontFamily="system-ui, sans-serif"
        letterSpacing="1"
      >
        {rank}
      </text>
    </svg>
  );
}
