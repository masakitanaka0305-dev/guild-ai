import type { Rank } from "@/types";
import { CrownIcon, StarIcon, LeafIcon } from "@/components/icons";

const RANK_META: Record<Rank, {
  label: string;
  bg: string;
  Icon: typeof CrownIcon;
}> = {
  S: {
    label: "お墨付き",
    bg: "bg-kaki text-white border border-amber-400/60",
    Icon: CrownIcon,
  },
  A: {
    label: "高評価",
    bg: "bg-zinc-300 text-kuroko border border-zinc-400/40",
    Icon: StarIcon,
  },
  B: {
    label: "標準",
    bg: "bg-amber-700 text-white border border-amber-800/40",
    Icon: LeafIcon,
  },
  D: {
    label: "非公開",
    bg: "bg-gray-400 text-white border border-gray-500/40",
    Icon: LeafIcon,
  },
};

// Friendly mode: gold / silver / bronze with kawaii labels
const FRIENDLY_META: Record<Rank, {
  label: string;
  sublabel: string;
  bg: string;
  textColor: string;
  Icon: typeof CrownIcon;
}> = {
  S: {
    label: "金",
    sublabel: "すごい！",
    bg: "bg-gradient-to-br from-[#F2DFA0] to-[#D4A437]",
    textColor: "text-[#7A5000]",
    Icon: CrownIcon,
  },
  A: {
    label: "銀",
    sublabel: "いいかんじ",
    bg: "bg-gradient-to-br from-[#E8E8E8] to-[#ABABAB]",
    textColor: "text-[#3A3A3A]",
    Icon: StarIcon,
  },
  B: {
    label: "銅",
    sublabel: "これから",
    bg: "bg-gradient-to-br from-[#F0C890] to-[#B87333]",
    textColor: "text-[#5A2D00]",
    Icon: LeafIcon,
  },
  D: {
    label: "—",
    sublabel: "非公開",
    bg: "bg-gray-300",
    textColor: "text-gray-600",
    Icon: LeafIcon,
  },
};

interface RankBadgeProps {
  rank: Rank;
  large?: boolean;
  showLabel?: boolean;
  friendly?: boolean;
}

export function RankBadge({ rank, large, showLabel = false, friendly = false }: RankBadgeProps) {
  if (friendly) {
    const meta = FRIENDLY_META[rank];
    const { Icon } = meta;
    return (
      <span
        className={`inline-flex flex-col items-center gap-0.5 rounded-2xl border-2 border-white/60 shadow-md font-bold ${large ? "px-5 py-3 text-2xl" : "px-3 py-1.5 text-base"} ${meta.bg} ${meta.textColor}`}
        aria-label={`${meta.label}バッジ — ${meta.sublabel}`}
      >
        <span className="flex items-center gap-1">
          <Icon size={large ? 18 : 14} aria-hidden />
          <span>{meta.label}</span>
        </span>
        <span className={`font-normal ${large ? "text-sm" : "text-xs"} opacity-80`}>{meta.sublabel}</span>
      </span>
    );
  }

  const meta = RANK_META[rank];
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${large ? "px-4 py-1 text-base" : "px-2.5 py-0.5 text-sm"} ${meta.bg}`}
      aria-label={`ランク ${rank} — ${meta.label}`}
    >
      <Icon size={large ? 14 : 12} aria-hidden />
      <span>{rank}</span>
      {showLabel && (
        <span className="text-xs font-normal opacity-90 ml-0.5">{meta.label}</span>
      )}
    </span>
  );
}
