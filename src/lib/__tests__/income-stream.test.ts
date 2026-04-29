import { describe, it, expect, vi } from "vitest";
import { incomeStream } from "@/lib/income-stream";
import type { IncomeEvent } from "@/lib/income-stream";

describe("income-stream", () => {
  it("subscribe adds a callback and fires events via _fireForTest", () => {
    const received: IncomeEvent[] = [];
    incomeStream.subscribe((e) => received.push(e));
    incomeStream._fireForTest();
    incomeStream.unsubscribe(received.push.bind(received)); // no-op unsubscribe
    expect(received.length).toBeGreaterThanOrEqual(1);
    // cleanup
    const cb = received.push.bind(received);
    incomeStream.unsubscribe(cb);
  });

  it("unsubscribe removes the callback so no more events are received", () => {
    const received: IncomeEvent[] = [];
    const cb = (e: IncomeEvent) => received.push(e);
    incomeStream.subscribe(cb);
    incomeStream._fireForTest();
    const beforeUnsubscribe = received.length;
    incomeStream.unsubscribe(cb);
    incomeStream._fireForTest();
    expect(received.length).toBe(beforeUnsubscribe);
  });

  it("emitted events have expected shape: recipeId, amountJpy, callerType, ts", () => {
    const events: IncomeEvent[] = [];
    const cb = (e: IncomeEvent) => events.push(e);
    incomeStream.subscribe(cb);
    incomeStream._fireForTest();
    incomeStream._fireForTest({ amountJpy: 0.07 });
    incomeStream._fireForTest({ amountJpy: 2.5 });
    incomeStream.unsubscribe(cb);

    expect(events.length).toBeGreaterThanOrEqual(3);
    for (const e of events) {
      expect(typeof e.recipeId).toBe("string");
      expect(typeof e.amountJpy).toBe("number");
      expect(e.amountJpy).toBeGreaterThan(0);
      expect(["agent", "human", "big-ai"]).toContain(e.callerType);
      expect(typeof e.ts).toBe("string");
      expect(new Date(e.ts).getTime()).not.toBeNaN();
    }
    // at least one sub-yen event
    expect(events.some((e) => e.amountJpy < 1)).toBe(true);
  });
});
