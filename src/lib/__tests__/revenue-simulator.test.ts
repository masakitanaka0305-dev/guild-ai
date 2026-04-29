import { describe, it, expect } from "vitest";
import { simulateRevenue } from "@/lib/revenue-simulator";

describe("revenue-simulator", () => {
  const input = { rank: "A" as const, perCallJpy: 1.5, category: "typescript", ccafScore: 72 };

  it("simulateRevenue is deterministic (same input → same output)", () => {
    const a = simulateRevenue(input);
    const b = simulateRevenue(input);
    expect(a.monthlyMedianJpy).toBe(b.monthlyMedianJpy);
    expect(a.p10Jpy).toBe(b.p10Jpy);
    expect(a.p90Jpy).toBe(b.p90Jpy);
    expect(a.distributionByDay).toEqual(b.distributionByDay);
  });

  it("satisfies p10 ≤ median ≤ p90", () => {
    for (const rank of ["S", "A", "B"] as const) {
      const r = simulateRevenue({ ...input, rank });
      expect(r.p10Jpy).toBeLessThanOrEqual(r.monthlyMedianJpy);
      expect(r.monthlyMedianJpy).toBeLessThanOrEqual(r.p90Jpy);
    }
  });

  it("distributionByDay has length 30 and sum near monthlyMedianJpy (±5%)", () => {
    const r = simulateRevenue(input);
    expect(r.distributionByDay).toHaveLength(30);
    const sum = r.distributionByDay.reduce((s, v) => s + v, 0);
    const tolerance = Math.ceil(r.monthlyMedianJpy * 0.05) + 30; // rounding slack
    expect(Math.abs(sum - r.monthlyMedianJpy)).toBeLessThanOrEqual(tolerance);
  });
});
