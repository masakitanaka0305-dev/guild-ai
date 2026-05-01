// GUILD AI — Pipeline Stepper (#125)
//
// Three-state horizontal stepper for AI model operations:
//   学習 → 評価 → デプロイ ／ 観測 → 検知 → 対応 など
//
// Each step has one of three states: done / active / todo.
// Render is fully static — no animation. Royal Blue (Logic White) for
// active + done, slate-200 for todo.

import { Check } from "lucide-react";

export interface PipelineStep {
  /** Friendly label shown beneath the dot. */
  label: string;
  /** Optional hint shown in slate-600. */
  hint?: string;
  done?: boolean;
  active?: boolean;
  todo?: boolean;
}

interface PipelineStepperProps {
  /** Ordered list of steps. */
  steps: ReadonlyArray<PipelineStep>;
  /** Optional aria-label for the whole control. */
  ariaLabel?: string;
  className?: string;
}

function stateOf(s: PipelineStep): "done" | "active" | "todo" {
  if (s.done) return "done";
  if (s.active) return "active";
  return "todo";
}

export function PipelineStepper({
  steps,
  ariaLabel = "進捗ステッパー",
  className = "",
}: PipelineStepperProps) {
  return (
    <ol
      data-testid="pipeline-stepper"
      aria-label={ariaLabel}
      className={`flex items-start gap-2 sm:gap-4 overflow-x-auto py-2 ${className}`.trim()}
    >
      {steps.map((step, idx) => {
        const state = stateOf(step);
        const isLast = idx === steps.length - 1;
        return (
          <li
            key={`${idx}-${step.label}`}
            data-testid={`pipeline-step-${idx}`}
            data-state={state}
            aria-current={state === "active" ? "step" : undefined}
            className="flex items-center gap-2 sm:gap-4 shrink-0"
          >
            <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <span
                aria-hidden
                className={[
                  "w-8 h-8 rounded-xl inline-flex items-center justify-center text-sm font-semibold ring-1",
                  state === "done"
                    ? "bg-[var(--color-ai-action)] text-white ring-[var(--color-ai-action)]"
                    : state === "active"
                    ? "bg-white text-[var(--color-ai-action)] ring-[var(--color-ai-action)]"
                    : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] ring-[var(--color-border-subtle)]",
                ].join(" ")}
              >
                {state === "done" ? (
                  <Check aria-hidden className="w-4 h-4" />
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className={[
                  "text-xs font-semibold whitespace-nowrap",
                  state === "todo"
                    ? "text-[var(--color-text-muted)]"
                    : "text-[var(--color-text-primary)]",
                ].join(" ")}
              >
                {step.label}
              </span>
              {step.hint && (
                <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                  {step.hint}
                </span>
              )}
            </div>
            {!isLast && (
              <span
                aria-hidden
                className={[
                  "h-0.5 w-12 sm:w-20 mt-4 rounded-full",
                  state === "done" || state === "active"
                    ? "bg-[var(--color-ai-action)]"
                    : "bg-[var(--color-border-subtle)]",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
