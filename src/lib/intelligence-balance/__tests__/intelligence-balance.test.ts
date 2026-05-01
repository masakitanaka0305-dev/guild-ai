import { describe, it, expect } from "vitest";
import { predictRoyalty, aggregateRoyalty } from "@/lib/intelligence-balance";

describe("intelligence-balance: predictRoyalty", () => {
  it("orders predictions S > A > B > D at the same density / category", () => {
    const s = predictRoyalty({ rank: "S", density: 80, category: "ml-pipeline" });
    const a = predictRoyalty({ rank: "A", density: 80, category: "ml-pipeline" });
    const b = predictRoyalty({ rank: "B", density: 80, category: "ml-pipeline" });
    const d = predictRoyalty({ rank: "D", density: 80, category: "ml-pipeline" });
    expect(s.perMonthJpy).toBeGreaterThan(a.perMonthJpy);
    expect(a.perMonthJpy).toBeGreaterThan(b.perMonthJpy);
    expect(b.perMonthJpy).toBeGreaterThan(d.perMonthJpy);

    // Conservative ≤ central ≤ optimistic for every rank
    for (const r of [s, a, b, d]) {
      expect(r.conservativeJpy).toBeLessThanOrEqual(r.perMonthJpy);
      expect(r.perMonthJpy).toBeLessThanOrEqual(r.optimisticJpy);
    }
  });

  it("aggregateRoyalty sums per-MD predictions and rounds to ¥100", () => {
    const items = [
      { rank: "A" as const, density: 60 },
      { rank: "B" as const, density: 40, category: "infra-go" },
    ];
    const agg = aggregateRoyalty(items);
    expect(agg.perMonthJpy % 100).toBe(0);
    expect(agg.conservativeJpy % 100).toBe(0);
    expect(agg.optimisticJpy % 100).toBe(0);
    // Aggregate is at least the larger of the two contributions
    expect(agg.perMonthJpy).toBeGreaterThan(0);
  });

  it("density 0 vs 100 nudges central by ~50% at the same rank", () => {
    const low  = predictRoyalty({ rank: "A", density: 0 });
    const high = predictRoyalty({ rank: "A", density: 100 });
    expect(high.perMonthJpy).toBeGreaterThan(low.perMonthJpy);
    // 0.75 vs 1.25 → ratio ≈ 1.66
    const ratio = high.perMonthJpy / low.perMonthJpy;
    expect(ratio).toBeGreaterThan(1.4);
    expect(ratio).toBeLessThan(2.0);
  });
});
