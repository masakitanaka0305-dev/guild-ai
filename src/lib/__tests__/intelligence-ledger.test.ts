import { describe, it, expect, beforeEach } from "vitest";
import * as depLedgerModule from "@/lib/dep-ledger";
import {
  appendEdge,
  getLedger,
  verifyChain,
  getDescendants,
  getAncestors,
  shortHash,
  _resetLedger,
} from "@/lib/dep-ledger";
import {
  payoutOnApiCall,
  weightForDepth,
  totalWeightUpToDepth,
  getPayoutHistory,
  _resetPayoutHistory,
  type ParentMap,
} from "@/lib/recursive-payout";
import { _resetAll as resetShima } from "@/lib/shima-ledger";

// ─── dep-ledger ───────────────────────────────────────────────────────────────

describe("dep-ledger: append-only edges", () => {
  beforeEach(() => {
    _resetLedger();
  });

  it("appendEdge is append-only — removeEdge is not exported", () => {
    expect((depLedgerModule as Record<string, unknown>).removeEdge).toBeUndefined();

    const edge = appendEdge({ child: "GUILD:C001", parent: "GUILD:P001", kind: "cite" });
    expect(getLedger().length).toBe(1);
    expect(edge.id).toBe("edge_0");
    expect(edge.child).toBe("GUILD:C001");
    expect(edge.parent).toBe("GUILD:P001");
  });

  it("verifyChain detects tampered merkleHash", () => {
    appendEdge({ child: "GUILD:C001", parent: "GUILD:P001", kind: "cite", ts: "2026-01-01T00:00:00Z" });
    appendEdge({ child: "GUILD:C002", parent: "GUILD:C001", kind: "fork", ts: "2026-01-02T00:00:00Z" });

    expect(verifyChain().valid).toBe(true);

    // Tamper: mutate the first entry's merkleHash
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getLedger() as any)[0].merkleHash = "deadbeef";
    const result = verifyChain();
    expect(result.valid).toBe(false);
    expect(result.firstBrokenIndex).toBe(0);
  });

  it("getAncestors returns all ancestors (multi-hop BFS)", () => {
    appendEdge({ child: "GUILD:C001", parent: "GUILD:P001", kind: "cite" });
    appendEdge({ child: "GUILD:C001", parent: "GUILD:P002", kind: "cite" });
    appendEdge({ child: "GUILD:P001", parent: "GUILD:GPA1", kind: "fork" });

    const ancestors = getAncestors("GUILD:C001");
    expect(ancestors).toContain("GUILD:P001");
    expect(ancestors).toContain("GUILD:P002");
    expect(ancestors).toContain("GUILD:GPA1");
    expect(ancestors).not.toContain("GUILD:C001");

    // shortHash is deterministic
    expect(shortHash("GUILD:C001")).toBe(shortHash("GUILD:C001"));
    expect(shortHash("GUILD:C001").length).toBe(8);
  });

  it("getDescendants returns all descendants (multi-hop BFS)", () => {
    appendEdge({ child: "GUILD:C001", parent: "GUILD:ROOT", kind: "cite" });
    appendEdge({ child: "GUILD:C002", parent: "GUILD:ROOT", kind: "fork" });
    appendEdge({ child: "GUILD:C003", parent: "GUILD:C001", kind: "cite" });
    appendEdge({ child: "GUILD:C004", parent: "GUILD:C003", kind: "cite" });

    const descendants = getDescendants("GUILD:ROOT");
    expect(descendants).toContain("GUILD:C001");
    expect(descendants).toContain("GUILD:C002");
    expect(descendants).toContain("GUILD:C003");
    expect(descendants).toContain("GUILD:C004"); // transitive
    expect(descendants).not.toContain("GUILD:ROOT");
  });
});

// ─── recursive-payout ────────────────────────────────────────────────────────

describe("recursive-payout", () => {
  beforeEach(() => {
    _resetPayoutHistory();
    resetShima();
    _resetLedger();
  });

  it("100-depth linear chain completes in < 10ms", () => {
    const parentMap: ParentMap = {};
    const DEPTH = 100;
    const leafId = "chain_leaf";
    parentMap[leafId] = ["chain_99"];
    for (let d = 99; d >= 1; d--) {
      parentMap[`chain_${d}`] = [`chain_${d - 1}`];
    }

    const start = Date.now();
    const record = payoutOnApiCall(leafId, 10_000, parentMap);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10);
    // MAX_DEPTH is 20, so at most 20 layers get paid
    expect(record.recipients.length).toBeLessThanOrEqual(20);
  });

  it("weight sum for depths 1–20 is >= 99.9% and <= 100%", () => {
    const sum = totalWeightUpToDepth(20);
    expect(sum).toBeGreaterThanOrEqual(0.999);
    expect(sum).toBeLessThanOrEqual(1.0);

    // Individual weights
    expect(weightForDepth(1)).toBeCloseTo(0.5);
    expect(weightForDepth(2)).toBeCloseTo(0.25);
    expect(weightForDepth(3)).toBeCloseTo(0.125);
  });

  it("amounts are integer milli-JPY (0.001¥ granularity, displayable at 0.01¥)", () => {
    const parentMap: ParentMap = {
      LEAF: ["PAR1", "PAR2"],
      PAR1: ["GPA1"],
      PAR2: ["GPA1"],
    };
    const record = payoutOnApiCall("LEAF", 10_000, parentMap);
    for (const r of record.recipients) {
      expect(Number.isInteger(r.amountMilliJpy)).toBe(true);
      expect(r.amountMilliJpy).toBeGreaterThan(0);
    }
    const totalOut = record.recipients.reduce((s, r) => s + r.amountMilliJpy, 0);
    expect(totalOut).toBeLessThanOrEqual(10_000);
  });

  it("payout history records each call with correct metadata", () => {
    const parentMap: ParentMap = { LEAF: ["A", "B", "C"] };
    payoutOnApiCall("LEAF", 5_000, parentMap);
    const hist = getPayoutHistory("LEAF");
    expect(hist.length).toBe(1);
    expect(hist[0].leafGuildId).toBe("LEAF");
    expect(hist[0].totalMilliJpy).toBe(5_000);
    const depth1 = hist[0].recipients.filter((r) => r.depth === 1);
    expect(depth1.length).toBe(3);
    // Each depth-1 recipient gets floor(5000 * 0.5 / 3) = 833
    for (const r of depth1) {
      expect(r.amountMilliJpy).toBeGreaterThan(0);
    }
  });
});
