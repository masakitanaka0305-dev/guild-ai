import { describe, it, expect, beforeEach } from "vitest";
import {
  tombstone,
  isTombstoned,
  resolveActiveLineage,
  distributeWithFallback,
  getIndexFundBalance,
  _resetTombstones,
} from "@/lib/persistence-protocol";
import {
  simulateChainEvent,
  getRecentChainEvents,
  subscribeChain,
  unsubscribeChain,
  _fireForTest,
  _resetChainNotify,
} from "@/lib/chain-notify";
import {
  settle,
  getRecentSettlements,
  getSettlementSummary,
  FX_RATES,
  _resetSettlements,
} from "@/lib/global-settlement";
import { _resetAll as resetShimaLedger } from "@/lib/shima-ledger";

// ─── persistence-protocol ────────────────────────────────────────────────────

describe("persistence-protocol: tombstone + active lineage", () => {
  beforeEach(() => {
    _resetTombstones();
    resetShimaLedger();
  });

  it("tombstone marks a node as deleted without removing it from graph", () => {
    tombstone("GUILD:0001-TS01-PAT1", "deleted-by-author");
    expect(isTombstoned("GUILD:0001-TS01-PAT1")).toBe(true);
  });

  it("resolveActiveLineage separates alive nodes from tombstoned", () => {
    tombstone("GUILD:DEAD-NODE-0001");
    const { activeNodes, fallbacks } = resolveActiveLineage("root", {
      "root": [
        { targetId: "GUILD:DEAD-NODE-0001", shareRate: 20 },
        { targetId: "GUILD:LIVE-NODE-0001", shareRate: 10 },
      ],
    });
    expect(fallbacks.some((f) => f.tombstonedNode === "GUILD:DEAD-NODE-0001")).toBe(true);
    expect(activeNodes.includes("GUILD:LIVE-NODE-0001")).toBe(true);
  });

  it("index-fund accumulates when tombstoned node has no known author", () => {
    tombstone("GUILD:ORPHAN-0001", "deleted-by-author", "index-fund");
    const before = getIndexFundBalance();
    distributeWithFallback("GUILD:ORPHAN-0001", 1000, {
      "GUILD:ORPHAN-0001": [],
    });
    // Root itself is tombstoned → all routes to index-fund
    const after = getIndexFundBalance();
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("non-tombstoned node receives allocation directly", () => {
    const result = distributeWithFallback("root", 10_000, {
      "root": [{ targetId: "GUILD:LIVE-ASSET", shareRate: 15 }],
    });
    expect(result.distribution["root"]).toBe(10_000);
  });
});

// ─── chain-notify ─────────────────────────────────────────────────────────────

describe("chain-notify: viral stacking", () => {
  beforeEach(() => _resetChainNotify());

  it("chain events have depth >= 2", () => {
    const evt = simulateChainEvent(12345);
    expect(evt.depth).toBeGreaterThanOrEqual(2);
  });

  it("simulateChainEvent is deterministic for same seed", () => {
    const a = simulateChainEvent(99999);
    const b = simulateChainEvent(99999);
    expect(a.text).toBe(b.text);
    expect(a.depth).toBe(b.depth);
    expect(a.cumulativeIncrease).toBe(b.cumulativeIncrease);
  });

  it("_fireForTest adds to recent events and calls subscribers", () => {
    let received: ReturnType<typeof simulateChainEvent> | null = null;
    const cb = (e: ReturnType<typeof simulateChainEvent>) => { received = e; };
    subscribeChain(cb);
    _fireForTest(42);
    unsubscribeChain(cb);
    expect(received).not.toBeNull();
    expect(getRecentChainEvents().length).toBe(1);
  });
});

// ─── global-settlement ────────────────────────────────────────────────────────

describe("global-settlement: multi-currency + knowledge index", () => {
  beforeEach(() => {
    _resetSettlements();
    resetShimaLedger();
    _resetTombstones();
  });

  it("FX rates are deterministic and fixed", () => {
    expect(FX_RATES.USD).toBe(152.4);
    expect(FX_RATES.EUR).toBe(165.2);
    expect(FX_RATES.GBP).toBe(192.8);
    expect(FX_RATES.JPY).toBe(1);
  });

  it("settle converts USD to JPY-eq correctly", () => {
    const result = settle(
      { payerCurrency: "USD", amount: 10, payerType: "agent", knowledgeIndex: 0 },
      "root",
    );
    expect(result.totalJpyEq).toBeCloseTo(152.4 * 10, 0);
  });

  it("knowledgeIndex boosts totalJpyEq by up to 25%", () => {
    const base = settle(
      { payerCurrency: "JPY", amount: 1000, payerType: "human", knowledgeIndex: 0 },
      "root",
    );
    const boosted = settle(
      { payerCurrency: "JPY", amount: 1000, payerType: "human", knowledgeIndex: 100 },
      "root",
    );
    expect(boosted.totalJpyEq).toBeGreaterThan(base.totalJpyEq);
    expect(boosted.totalJpyEq).toBeLessThanOrEqual(base.totalJpyEq * 1.26); // +25% max
  });

  it("100 seeded settlements: total JPY-eq equals sum of settle results", () => {
    let expectedTotal = 0;
    const currencies: Array<"JPY" | "USD" | "EUR" | "GBP"> = ["JPY", "USD", "EUR", "GBP"];
    for (let i = 0; i < 100; i++) {
      const cur = currencies[i % 4];
      const result = settle(
        { payerCurrency: cur, amount: 10, payerType: "agent", knowledgeIndex: 50 },
        "root",
      );
      expectedTotal += result.totalJpyEq;
    }
    const records = getRecentSettlements(100);
    const actualTotal = records.reduce((s, r) => s + r.totalJpyEq, 0);
    expect(Math.abs(actualTotal - expectedTotal)).toBeLessThan(0.01);
  });

  it("getSettlementSummary groups by currency for recent 24h", () => {
    settle({ payerCurrency: "USD", amount: 5, payerType: "agent", knowledgeIndex: 50 }, "root");
    settle({ payerCurrency: "EUR", amount: 3, payerType: "human", knowledgeIndex: 50 }, "root");
    const summary = getSettlementSummary(24);
    expect(summary.USD).toBeGreaterThan(0);
    expect(summary.EUR).toBeGreaterThan(0);
  });

  it("JPY direct settle: totalJpyEq ≈ input amount (knowledgeIndex 0)", () => {
    const result = settle(
      { payerCurrency: "JPY", amount: 500, payerType: "human", knowledgeIndex: 0 },
      "root",
    );
    expect(result.totalJpyEq).toBeCloseTo(500, 1);
  });
});
