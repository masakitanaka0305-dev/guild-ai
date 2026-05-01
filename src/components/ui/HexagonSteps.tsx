import { Hexagon } from "@/components/ui/Hexagon";

/**
 * Static hexagon strip — replaces a vertical step list with a
 * horizontal row of regular hexagons.
 *
 * Three states encoded as fill / stroke / center label:
 *
 *   complete: fill #22D3EE, stroke #22D3EE, center "✓" on #0B1121 ink
 *   active:   fill #1E293B, stroke #22D3EE, center step number in #22D3EE
 *   pending:  fill #162035, stroke #94A3B8, center number in #94A3B8
 */
export interface HexagonStepsProps {
  total: number;
  /** Index of the current step (0-based). */
  currentIdx: number;
  /** Optional labels rendered under each hex. */
  labels?: string[];
  size?: number;
}

export function HexagonSteps({
  total,
  currentIdx,
  labels,
  size = 48,
}: HexagonStepsProps) {
  return (
    <ol
      data-testid="hex-steps"
      className="flex items-start gap-2 sm:gap-3 overflow-x-auto pb-2"
      role="list"
    >
      {Array.from({ length: total }, (_, idx) => {
        const state =
          idx < currentIdx ? "complete"
          : idx === currentIdx ? "active"
          : "pending";

        const fill =
          state === "complete" ? "#22D3EE"
          : state === "active"   ? "#1E293B"
          : "#162035";
        const stroke =
          state === "complete" ? "#22D3EE"
          : state === "active"   ? "#22D3EE"
          : "#94A3B8";
        const labelColor =
          state === "complete" ? "#0B1121"
          : state === "active"   ? "#22D3EE"
          : "#94A3B8";
        const center =
          state === "complete" ? "✓" : String(idx + 1);

        const ariaCurrent = state === "active" ? "step" : undefined;
        const ariaLabel =
          state === "complete" ? `ステップ ${idx + 1} 完了`
          : state === "active"   ? `ステップ ${idx + 1} 進行中`
          : `ステップ ${idx + 1} 未着手`;

        return (
          <li
            key={idx}
            data-state={state}
            aria-current={ariaCurrent}
            className="flex flex-col items-center min-w-[64px] shrink-0"
          >
            <Hexagon
              size={size}
              fill={fill}
              stroke={stroke}
              strokeWidth={2}
              label={center}
              labelColor={labelColor}
              ariaLabel={ariaLabel}
            />
            {labels?.[idx] && (
              <span className="mt-1 text-[10px] font-bold text-text-primary text-center max-w-[68px] leading-tight">
                {labels[idx]}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
