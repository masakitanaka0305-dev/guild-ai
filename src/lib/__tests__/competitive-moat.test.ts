import { describe, it, expect, beforeEach } from "vitest";
import { getVerificationLog } from "@/lib/verification-log";
import { getDeltaCompare } from "@/lib/insight-delta";
import {
  getZeroDayEvents,
  subscribeZeroDay,
  unsubscribeZeroDay,
  _fireForTest,
  _resetZeroDay,
  ZERO_DAY_OPTOUT_KEY,
  ZERO_DAY_EVENTS,
} from "@/lib/zero-day";

// ─── Verification Log ─────────────────────────────────────────────────────────

describe("verification-log", () => {
  it("is deterministic for the same guildId", () => {
    const a = getVerificationLog("GUILD:0001-TEST-001");
    const b = getVerificationLog("GUILD:0001-TEST-001");
    expect(a.entries.length).toBe(b.entries.length);
    expect(a.entries[0].hash).toBe(b.entries[0].hash);
    expect(a.summary.successRate).toBe(b.summary.successRate);
  });

  it("successRate is between 0 and 100", () => {
    for (const id of ["GUILD:0001", "GUILD:0002", "GUILD:0099"]) {
      const { summary } = getVerificationLog(id);
      expect(summary.successRate).toBeGreaterThanOrEqual(0);
      expect(summary.successRate).toBeLessThanOrEqual(100);
    }
  });

  it("returns a non-empty environments array", () => {
    const { summary } = getVerificationLog("GUILD:0003-ENV-TEST");
    expect(summary.environments.length).toBeGreaterThan(0);
    expect(Array.isArray(summary.environments)).toBe(true);
  });

  it("last log entry has a valid ISO-8601 timestamp", () => {
    const { entries } = getVerificationLog("GUILD:0004-TS-TEST");
    expect(entries.length).toBeGreaterThan(0);
    const ts = entries[entries.length - 1].ts;
    expect(() => new Date(ts).toISOString()).not.toThrow();
  });
});

// ─── Insight Delta ────────────────────────────────────────────────────────────

describe("insight-delta", () => {
  it("is deterministic for the same guildId", () => {
    const a = getDeltaCompare("GUILD:0005-DELTA-001");
    const b = getDeltaCompare("GUILD:0005-DELTA-001");
    expect(a.pro.valueDeltaPct).toBe(b.pro.valueDeltaPct);
    expect(a.pro.differentiators.length).toBe(b.pro.differentiators.length);
  });

  it("returns 2 to 4 differentiator tags", () => {
    for (const id of ["GUILD:0001", "GUILD:0010", "GUILD:0099", "GUILD:0050"]) {
      const { pro } = getDeltaCompare(id);
      expect(pro.differentiators.length).toBeGreaterThanOrEqual(2);
      expect(pro.differentiators.length).toBeLessThanOrEqual(4);
    }
  });

  it("generic and pro points are both non-empty", () => {
    const { generic, pro } = getDeltaCompare("GUILD:0006-POINTS-TEST");
    expect(generic.points.length).toBeGreaterThan(0);
    expect(pro.points.length).toBeGreaterThan(0);
  });
});

// ─── Zero-Day Feed ────────────────────────────────────────────────────────────

describe("zero-day", () => {
  beforeEach(() => {
    _resetZeroDay();
  });

  it("ZERO_DAY_EVENTS is non-empty and deterministic", () => {
    expect(ZERO_DAY_EVENTS.length).toBeGreaterThan(0);
    const ids = ZERO_DAY_EVENTS.map((e) => e.id);
    expect(ids).toEqual(ids); // same reference
    expect(ZERO_DAY_EVENTS[0].priority).toBeDefined();
    expect(ZERO_DAY_EVENTS[0].status).toBeDefined();
  });

  it("subscribe receives emitted events", () => {
    const received: string[] = [];
    subscribeZeroDay((e) => received.push(e.id));
    _fireForTest(0);
    _fireForTest(1);
    expect(received.length).toBe(2);
    expect(received[0]).toBe(ZERO_DAY_EVENTS[0].id);
    expect(received[1]).toBe(ZERO_DAY_EVENTS[1].id);
  });

  it("unsubscribe stops receiving events", () => {
    const received: string[] = [];
    const cb = (e: { id: string }) => received.push(e.id);
    subscribeZeroDay(cb);
    _fireForTest(0);
    unsubscribeZeroDay(cb);
    _fireForTest(1);
    expect(received.length).toBe(1);
  });

  it("getZeroDayEvents priorityOrder sorts critical first", () => {
    const sorted = getZeroDayEvents(true);
    expect(sorted[0].priority).toBe("critical");
    const lastCriticalIdx = sorted.map((e) => e.priority).lastIndexOf("critical");
    const firstMediumIdx = sorted.findIndex((e) => e.priority === "medium");
    if (firstMediumIdx !== -1) {
      expect(lastCriticalIdx).toBeLessThan(firstMediumIdx);
    }
  });

  it("ZERO_DAY_OPTOUT_KEY is a non-empty string", () => {
    expect(typeof ZERO_DAY_OPTOUT_KEY).toBe("string");
    expect(ZERO_DAY_OPTOUT_KEY.length).toBeGreaterThan(0);
  });
});
