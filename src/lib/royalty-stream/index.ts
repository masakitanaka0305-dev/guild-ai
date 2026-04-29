"use client";

import { useState, useEffect, useRef } from "react";

export interface RoyaltyEvent {
  id: string;
  amountJpy: number;
  apiCallId: string;
  at: string;
}

const ROYALTY_AMOUNTS = [0.4, 1.2, 0.8, 3.2, 2.1, 0.6, 5.0, 1.8, 0.3, 4.5];

let _counter = 0;
function nextRoyalty(): RoyaltyEvent {
  const idx = _counter % ROYALTY_AMOUNTS.length;
  _counter += 1;
  return {
    id: `royalty_${_counter}`,
    amountJpy: ROYALTY_AMOUNTS[idx],
    apiCallId: `api_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  };
}

/**
 * useRoyaltyStream — fires ~2 royalty events per minute (every ~30s).
 * Returns the running list of recent royalty events (latest first, max 20).
 */
export function useRoyaltyStream(enabled = true): RoyaltyEvent[] {
  const [events, setEvents] = useState<RoyaltyEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function scheduleNext() {
      const delay = 28_000 + Math.floor(Math.random() * 4_000); // 28–32s
      timerRef.current = setTimeout(() => {
        const evt = nextRoyalty();
        setEvents((prev) => [evt, ...prev].slice(0, 20));
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);

  return events;
}

/** How many royalty events fire per minute (used in tests) */
export const ROYALTY_EVENTS_PER_MINUTE = 2;
