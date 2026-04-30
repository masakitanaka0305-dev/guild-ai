"use client";
import { useState, useEffect, useRef } from "react";

interface ActivityPulseProps {
  assetId: string;
  className?: string;
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fluctuate(base: number, seed: number): number {
  const pct = ((seed % 21) - 10) / 100; // ±10%
  return Math.max(1, Math.round(base * (1 + pct)));
}

export function ActivityPulse({ assetId, className = "" }: ActivityPulseProps) {
  const baseRps = (djb2(assetId) % 30) + 1;
  const [rps, setRps] = useState(baseRps);
  const tickRef = useRef(0);
  const ariaValueRef = useRef(baseRps);
  const [ariaRps, setAriaRps] = useState(baseRps);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      const newRps = fluctuate(baseRps, djb2(assetId + tickRef.current));
      setRps(newRps);
      // Update aria-live every 10 ticks (every 30 seconds)
      if (tickRef.current % 10 === 0) {
        ariaValueRef.current = newRps;
        setAriaRps(newRps);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [assetId, baseRps]);

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const heartbeatPath = "M 0 10 L 10 10 L 15 2 L 20 18 L 25 10 L 60 10";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG heartbeat line */}
      <svg
        width="62"
        height="20"
        viewBox="0 0 62 20"
        aria-hidden
        className="text-kaki shrink-0"
      >
        <path
          d={heartbeatPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  animation: "pulse-line 1.2s ease-in-out infinite",
                }
          }
        />
        <style>{`
          @keyframes pulse-line {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </svg>

      {/* aria-live region — only updates every 30s */}
      <span aria-live="polite" className="sr-only">
        今この瞬間 {ariaRps} 回 / 分
      </span>

      {/* Visual display — updates every 3s but not announced */}
      <span className="text-xs font-semibold tabular-nums text-[#E2E8F0]" aria-hidden>
        今この瞬間{" "}
        <span className="text-kaki font-bold">{rps}</span>
        {" "}回 / 分
      </span>
    </div>
  );
}
