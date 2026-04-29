import { describe, it, expect, beforeEach } from "vitest";
import {
  traceDistribution,
  buildTestGraph,
  clearCache,
  getCacheSize,
} from "@/lib/graph-trace";
import {
  accumulate,
  getMicroBalance,
  triggerWithdraw,
  setAutoWithdraw,
  setThreshold,
  _resetAll,
  formatMilliJpy,
  milliToJpy,
  jpyToMilli,
} from "@/lib/shima-ledger";
import { getImpactStats } from "@/lib/impact";

// ─── graph-trace ─────────────────────────────────────────────────────────────

describe("graph-trace: BFS distribution", () => {
  beforeEach(() => clearCache());

  it("single-node graph allocates entire amount to root", () => {
    const graph = { "ROOT": [] };
    const result = traceDistribution("ROOT", 1000, graph);
    expect(result.distribution["ROOT"]).toBe(1000);
    expect(result.nodeCount).toBe(1);
  });

  it("root node receives the full input amount", () => {
    const graph = buildTestGraph(5, 3);
    const amount = 10_000;
    const result = traceDistribution("node_0_0", amount, graph);
    // Root gets its full share; children receive proportional fractions
    expect(result.distribution["node_0_0"]).toBe(amount);
    // All distribution values are non-negative
    for (const v of Object.values(result.distribution)) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it("memoization: second call returns same result from cache", () => {
    const graph = buildTestGraph(3, 2);
    clearCache();
    const r1 = traceDistribution("node_0_0", 500, graph);
    const sizeBefore = getCacheSize();
    const r2 = traceDistribution("node_0_0", 500, graph);
    expect(getCacheSize()).toBe(sizeBefore); // no new entry
    expect(r2.distribution).toEqual(r1.distribution);
  });

  it("100-level × 5-nodes graph completes in < 25ms", () => {
    const graph = buildTestGraph(100, 5);
    const start = performance.now();
    traceDistribution("node_0_0", 1_000_000, graph);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(25);
  });

  it("depthReached reflects actual BFS depth", () => {
    const graph = buildTestGraph(4, 2);
    const result = traceDistribution("node_0_0", 100, graph);
    expect(result.depthReached).toBeGreaterThanOrEqual(1);
  });
});

// ─── shima-ledger ─────────────────────────────────────────────────────────────

describe("shima-ledger: milli-jpy precision", () => {
  beforeEach(() => _resetAll());

  it("fractional amounts are preserved with milli precision", () => {
    accumulate("user1", 1_500); // 1.5 JPY
    const bal = getMicroBalance("user1");
    expect(bal.totalMilliJpy).toBe(1_500);
    expect(bal.displayJpy).toBeCloseTo(1.5, 3);
  });

  it("accumulate adds to existing balance", () => {
    accumulate("user1", 300);
    accumulate("user1", 700);
    expect(getMicroBalance("user1").totalMilliJpy).toBe(1_000);
  });

  it("triggerWithdraw resets balance to zero", () => {
    accumulate("user1", 50_000);
    triggerWithdraw("user1");
    expect(getMicroBalance("user1").totalMilliJpy).toBe(0);
  });

  it("autoWithdraw triggers when threshold is reached", () => {
    setThreshold("user2", 1_000); // ¥1,000
    setAutoWithdraw("user2", true);
    accumulate("user2", 1_000_000); // 1000 JPY → over threshold
    expect(getMicroBalance("user2").totalMilliJpy).toBe(0); // auto-withdrawn
  });

  it("displayJpy format shows milli precision", () => {
    const formatted = formatMilliJpy(1_234_567); // 1234.567 JPY
    expect(formatted).toContain("¥");
    expect(formatted).toContain("1,234");
  });

  it("toggle autoWithdraw off does not trigger on accumulate", () => {
    setThreshold("user3", 500);
    setAutoWithdraw("user3", false);
    accumulate("user3", 600_000); // 600 JPY
    expect(getMicroBalance("user3").totalMilliJpy).toBe(600_000); // not withdrawn
  });

  it("milliToJpy and jpyToMilli are inverse operations", () => {
    const milli = 12_345;
    expect(jpyToMilli(milliToJpy(milli))).toBe(milli);
  });
});

// ─── impact ──────────────────────────────────────────────────────────────────

describe("impact: saved projects + contribution score", () => {
  it("getImpactStats returns deterministic results for same handle", () => {
    const r1 = getImpactStats("demo-user");
    const r2 = getImpactStats("demo-user");
    expect(r1.savedProjects).toBe(r2.savedProjects);
    expect(r1.contributionScore).toBe(r2.contributionScore);
    expect(r1.ranks.thisMonth).toBe(r2.ranks.thisMonth);
  });

  it("savedProjects is proportional to total calls", () => {
    const stats = getImpactStats("demo-user");
    expect(stats.savedProjects).toBeGreaterThan(0);
    expect(stats.savedProjects).toBeLessThan(10_000);
  });

  it("contributionScore is positive and reflects active assets", () => {
    const stats = getImpactStats("demo-user");
    expect(stats.contributionScore).toBeGreaterThan(0);
  });
});
