import { describe, it, expect } from "vitest";
import {
  computeStreaks,
  buildStreakDemoStack,
  makeConsecutiveRoyaltyDays,
  makePeakWeeklyAdoption,
  makeConsecutiveCallsMilestone,
  makeRoyaltyTotalMilestone,
  ROYALTY_DAY_THRESHOLDS,
  CALLS_24H_THRESHOLDS,
  ROYALTY_TOTAL_THRESHOLDS_JPY,
} from "@/lib/streak-events";

const AT = "2026-05-01T09:00:00.000Z";

describe("Streak / milestone events (#129) — threshold logic", () => {
  it("consecutive royalty days fires only at the highest threshold cleared (3 / 7 / 14 / 30)", () => {
    expect(makeConsecutiveRoyaltyDays("u", 2, AT)).toBeNull();
    expect(makeConsecutiveRoyaltyDays("u", 3, AT)?.attribution.value).toBe(3);
    expect(makeConsecutiveRoyaltyDays("u", 6, AT)?.attribution.value).toBe(3);
    expect(makeConsecutiveRoyaltyDays("u", 7, AT)?.attribution.value).toBe(7);
    expect(makeConsecutiveRoyaltyDays("u", 100, AT)?.attribution.value).toBe(30);
    // The message references the actual streak count.
    expect(makeConsecutiveRoyaltyDays("u", 7, AT)?.message).toBe(
      "7 日連続で印税が届いています。",
    );
    // No FOMO copy.
    expect(makeConsecutiveRoyaltyDays("u", 7, AT)?.message).not.toMatch(/急騰|暴落|％/);
  });

  it("peak weekly adoption fires *only* when the current week strictly beats the previous max", () => {
    // Equal — no notification.
    expect(makePeakWeeklyAdoption("u", 5, 5, AT)).toBeNull();
    // Below — no notification.
    expect(makePeakWeeklyAdoption("u", 3, 5, AT)).toBeNull();
    // Above — fires with the actual count, never an extrapolated %.
    const n = makePeakWeeklyAdoption("u", 6, 5, AT);
    expect(n).not.toBeNull();
    expect(n!.message).toContain("過去最多");
    expect(n!.attribution.value).toBe(6);
    expect(n!.message).not.toMatch(/急騰|％|％/);
  });

  it("calls + royalty-total milestones use anchored thresholds (no extrapolation)", () => {
    expect(makeConsecutiveCallsMilestone("u", 49, AT)?.attribution.value).toBe(10);
    expect(makeConsecutiveCallsMilestone("u", 100, AT)?.attribution.value).toBe(100);
    expect(makeConsecutiveCallsMilestone("u", 999, AT)?.attribution.value).toBe(500);
    expect(makeConsecutiveCallsMilestone("u", 5_000, AT)?.attribution.value).toBe(1_000);

    expect(makeRoyaltyTotalMilestone("u", 999, AT)).toBeNull();
    expect(makeRoyaltyTotalMilestone("u", 1_000, AT)?.attribution.value).toBe(1_000);
    expect(makeRoyaltyTotalMilestone("u", 25_000, AT)?.attribution.value).toBe(10_000);
    // Threshold tables are exported for docs to reference.
    expect(ROYALTY_DAY_THRESHOLDS).toEqual([3, 7, 14, 30]);
    expect(CALLS_24H_THRESHOLDS).toEqual([10, 50, 100, 500, 1000]);
    expect(ROYALTY_TOTAL_THRESHOLDS_JPY).toEqual([1_000, 10_000, 100_000, 1_000_000]);
  });
});

describe("computeStreaks — dedupe + aggregate", () => {
  it("emits one notification per type when thresholds are crossed", () => {
    const out = computeStreaks("user-a", {
      consecutiveRoyaltyDays: 7,
      weeklyAdoptions: 6,
      previousPeakWeeklyAdoptions: 4,
      callsLast24h: 100,
      royaltyTotalJpy: 10_000,
      auditedAt: AT,
    });
    expect(out.map((n) => n.type)).toEqual([
      "consecutive_royalty_days",
      "peak_weekly_adoption",
      "consecutive_calls_milestone",
      "royalty_total_milestone",
    ]);
  });

  it("skips events whose id already fired in the last 24h (dedupe)", () => {
    const first = computeStreaks("user-a", {
      consecutiveRoyaltyDays: 7,
      weeklyAdoptions: 4,
      previousPeakWeeklyAdoptions: 4,
      callsLast24h: 100,
      royaltyTotalJpy: 10_000,
      auditedAt: AT,
    });
    const recent = new Set(first.map((n) => n.id));
    const second = computeStreaks("user-a", {
      consecutiveRoyaltyDays: 7,
      weeklyAdoptions: 4,
      previousPeakWeeklyAdoptions: 4,
      callsLast24h: 100,
      royaltyTotalJpy: 10_000,
      auditedAt: AT,
      recentEventIds: recent,
    });
    expect(second).toHaveLength(0);
  });

  it("buildStreakDemoStack returns a deterministic 4-event seed with no FOMO copy", () => {
    const a = buildStreakDemoStack("user-a");
    const b = buildStreakDemoStack("user-a");
    expect(a).toHaveLength(4);
    expect(a.map((n) => n.id)).toEqual(b.map((n) => n.id));
    const blob = a.map((n) => `${n.title}|${n.message}`).join("\n");
    expect(blob).not.toMatch(/急騰|暴落|値動き|％\s*上昇|% 上昇/);
    // Sanity: every message is anchored to a number we can verify.
    expect(blob).toContain("3 日連続");
    expect(blob).toContain("過去最多");
    expect(blob).toContain("100 回");
    expect(blob).toContain("¥10,000");
  });
});
