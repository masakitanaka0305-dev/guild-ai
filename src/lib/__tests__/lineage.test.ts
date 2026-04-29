import { describe, it, expect } from "vitest";
import { getLineage } from "@/lib/lineage";

describe("lineage", () => {
  it("getLineage is deterministic (same id → same output)", () => {
    const a = getLineage("listing-001");
    const b = getLineage("listing-001");
    expect(a.nodes.length).toBe(b.nodes.length);
    expect(a.links.length).toBe(b.links.length);
    expect(a.nodes.map((n) => n.id)).toEqual(b.nodes.map((n) => n.id));
    expect(a.links.map((l) => l.id)).toEqual(b.links.map((l) => l.id));
  });

  it("node count is between 5 and 20", () => {
    for (const id of ["listing-001", "listing-002", "GUILD:0001-TS01-PAT1"]) {
      const g = getLineage(id);
      expect(g.nodes.length).toBeGreaterThanOrEqual(5);
      expect(g.nodes.length).toBeLessThanOrEqual(20);
    }
  });
});
