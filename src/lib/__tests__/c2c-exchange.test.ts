import { describe, it, expect, beforeEach } from "vitest";
import { getQuote, recommendPlan, TIERS } from "@/lib/individual-tier";
import { compose, runComposite, PIPELINE_STEPS, getCompositeNodeTitles } from "@/lib/composite";
import { getCitationGraph, addRespect, getRespectCount, _resetRespect } from "@/lib/citation-network";
import { computeMasterScore, getMasterStats, getRecommendedNotes } from "@/lib/master-reputation";

// ─── individual-tier ─────────────────────────────────────────────────────────

describe("individual-tier", () => {
  it("getQuote: pro-indie 10k calls → base fee only, no overage", () => {
    const q = getQuote("pro-indie", 10_000);
    expect(q.totalJpy).toBe(TIERS["pro-indie"].monthlyJpy);
    expect(q.overageCalls).toBe(0);
    expect(q.recordedFraction).toBe(1.0);
  });

  it("recommendPlan: low-volume individual → hobby", () => {
    expect(recommendPlan(500, "individual")).toBe("hobby");
    expect(recommendPlan(1_001, "individual")).toBe("pro-indie");
    expect(recommendPlan(100_000, "individual")).toBe("enterprise");
  });

  it("hobby tier: overage charges ¥1.5 per call over 1000", () => {
    const q = getQuote("hobby", 1_100);
    expect(q.overageCalls).toBe(100);
    expect(q.overageJpy).toBeCloseTo(150, 0);
  });

  it("enterprise: purely per-call, zero calls → ¥0 total", () => {
    const q = getQuote("enterprise", 0);
    expect(q.totalJpy).toBe(0);
    expect(q.included).toBe(-1);
    expect(q.recordedFraction).toBe(1.0);
  });
});

// ─── composite ───────────────────────────────────────────────────────────────

describe("composite", () => {
  const IDS = ["GUILD:0001-INVOICE", "GUILD:0007-NORMALIZE", "GUILD:0011-SUMMARY"];

  it("runComposite: same IDs produce identical output (deterministic)", () => {
    const r1 = runComposite(IDS, { pdf: "test.pdf" });
    const r2 = runComposite(IDS, { pdf: "test.pdf" });
    expect(r1.output).toBe(r2.output);
    expect(r1.nodeCount).toBe(3);
  });

  it("PIPELINE_STEPS has exactly 5 entries", () => {
    expect(PIPELINE_STEPS).toHaveLength(5);
    expect(PIPELINE_STEPS[PIPELINE_STEPS.length - 1]).toBe("Done");
  });

  it("compose returns handle with run() method", () => {
    const handle = compose(IDS);
    expect(typeof handle.run).toBe("function");
    expect(handle.ids).toEqual(IDS);
  });

  it("getCompositeNodeTitles returns one title per ID", () => {
    const titles = getCompositeNodeTitles(IDS);
    expect(titles).toHaveLength(IDS.length);
    titles.forEach((t) => expect(typeof t).toBe("string"));
  });
});

// ─── citation-network ────────────────────────────────────────────────────────

describe("citation-network", () => {
  it("getCitationGraph is deterministic across calls", () => {
    const g1 = getCitationGraph("demo-user");
    const g2 = getCitationGraph("demo-user");
    expect(g1.nodes.length).toBe(g2.nodes.length);
    expect(g1.edges.length).toBe(g2.edges.length);
    expect(g1.nodes[0].handle).toBe(g2.nodes[0].handle);
  });

  it("top nodes by citationCount all have count > 0", () => {
    const { nodes } = getCitationGraph();
    const top3 = [...nodes].sort((a, b) => b.citationCount - a.citationCount).slice(0, 3);
    top3.forEach((n) => expect(n.citationCount).toBeGreaterThan(0));
  });

  it("addRespect increments count; _resetRespect clears it", () => {
    _resetRespect();
    const before = getRespectCount("alice");
    addRespect("demo-user", "alice");
    addRespect("carol", "alice");
    expect(getRespectCount("alice")).toBe(before + 2);
    _resetRespect();
    expect(getRespectCount("alice")).toBe(0);
  });
});

// ─── master-reputation ───────────────────────────────────────────────────────

describe("master-reputation", () => {
  it("computeMasterScore is deterministic and within 0–1000", () => {
    const s1 = computeMasterScore("alice");
    const s2 = computeMasterScore("alice");
    expect(s1).toBe(s2);
    expect(s1).toBeGreaterThanOrEqual(0);
    expect(s1).toBeLessThanOrEqual(1000);
  });

  it("getMasterStats returns non-negative discipleCount and collectiveScore", () => {
    const stats = getMasterStats("bob");
    expect(stats.discipleCount).toBeGreaterThanOrEqual(0);
    expect(stats.collectiveScore).toBeGreaterThanOrEqual(0);
    expect(["マスター", "シニア", "メンター", "コントリビューター"]).toContain(stats.label);
  });

  it("getRecommendedNotes returns exactly 3 notes with valid GUILD-IDs", () => {
    const notes = getRecommendedNotes("carol");
    expect(notes).toHaveLength(3);
    notes.forEach((n) => {
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.guildId).toMatch(/^GUILD:/);
    });
    // Different handles get different (or same) sets — but always 3
    const notes2 = getRecommendedNotes("dave");
    expect(notes2).toHaveLength(3);
  });
});
