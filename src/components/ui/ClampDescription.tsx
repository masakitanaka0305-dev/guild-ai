"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ClampDescription — long-form text that defaults to N lines and
 * expands to full body on a "もっと見る" toggle.
 *
 * No CSS animation: opening / closing is a state flip, the height
 * change is instantaneous (Water Guild anim-off contract).
 */
export interface ClampDescriptionProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export function ClampDescription({
  text,
  maxLines = 3,
  className = "",
}: ClampDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && expanded) setExpanded(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const clampStyle: React.CSSProperties | undefined = expanded
    ? undefined
    : {
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

  return (
    <div className={className}>
      <p
        ref={ref}
        data-testid="clamp-body"
        data-expanded={expanded || undefined}
        style={clampStyle}
        className="text-sm text-text-primary leading-relaxed"
      >
        {text}
      </p>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(v => !v)}
        className="mt-1 text-xs font-bold text-ai-action hover:underline focus:outline focus:outline-2 focus:outline-cyan-400 rounded"
      >
        {expanded ? "閉じる" : "もっと見る"}
      </button>
    </div>
  );
}
