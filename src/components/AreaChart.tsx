interface Props {
  data: number[];
  color?: string;
  fillColor?: string;
  height?: number;
  title?: string;
}

export function AreaChart({
  data,
  color = "#0E9F4F",
  fillColor = "rgba(14,159,79,0.15)",
  height = 60,
  title = "推移グラフ",
}: Props) {
  if (data.length < 2) return null;

  const W = 400;
  const H = height;
  const PAD = 2;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const toX = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const toY = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);

  const linePts = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaPath =
    `M ${toX(0).toFixed(1)},${H} ` +
    data.map((v, i) => `L ${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ") +
    ` L ${toX(data.length - 1).toFixed(1)},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={title}
      preserveAspectRatio="none"
    >
      <title>{title}</title>
      <path d={areaPath} fill={fillColor} />
      <polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
