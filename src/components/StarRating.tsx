import type { Rank } from "@/types";

const RANK_TO_STARS: Record<Rank, 5 | 4 | 3> = { S: 5, A: 4, B: 3, D: 3 };

interface StarRatingProps {
  rank: Rank;
  size?: "sm" | "md";
}

export function StarRating({ rank, size = "md" }: StarRatingProps) {
  const filled = RANK_TO_STARS[rank];
  const total = 5;
  const label = `5つ星中${filled}つ`;

  return (
    <span
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-0.5 ${size === "sm" ? "text-xs" : "text-sm"}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={i < filled ? "text-kaki" : "text-kuroko/20"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function rankToStars(rank: Rank): number {
  return RANK_TO_STARS[rank];
}
