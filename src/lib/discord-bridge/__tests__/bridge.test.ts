import { describe, it, expect, beforeEach } from "vitest";
import { DiscordBridge, DISCORD_WEIGHTS, DAILY_CAP, attributeAmbassadorReward } from "../index";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("DiscordBridge (DB integration)", () => {
  let bridge: DiscordBridge;

  beforeEach(async () => {
    bridge = new DiscordBridge();
    await bridge.reset(); // wipes shared DB state
  });

  it("awards weighted points per action kind", async () => {
    expect(
      await bridge.ingest({
        userId: "u1",
        kind: "share",
        listingId: "l1",
        occurredAt: "2026-04-01T10:00:00Z",
      })
    ).toBe(DISCORD_WEIGHTS.share);
    expect(await bridge.contributionFor("u1")).toBe(DISCORD_WEIGHTS.share);
  });

  it("enforces the 50pt daily cap per user", async () => {
    let total = 0;
    for (let i = 0; i < 11; i++) {
      total += await bridge.ingest({
        userId: "u2",
        kind: "share",
        listingId: "l1",
        occurredAt: `2026-04-01T10:0${i % 10}:00Z`,
      });
    }
    expect(total).toBe(DAILY_CAP);
  });

  it("resets the daily counter on a new date", async () => {
    for (let i = 0; i < 11; i++) {
      await bridge.ingest({
        userId: "u3",
        kind: "share",
        listingId: "l1",
        occurredAt: "2026-04-01T10:00:00Z",
      });
    }
    const awarded = await bridge.ingest({
      userId: "u3",
      kind: "share",
      listingId: "l1",
      occurredAt: "2026-04-02T10:00:00Z",
    });
    expect(awarded).toBe(DISCORD_WEIGHTS.share);
  });

  it("notifies listeners when contribution updates", async () => {
    const events: Array<[string, number]> = [];
    bridge.onContributionUpdate((u, c) => events.push([u, c]));
    await bridge.ingest({
      userId: "u4",
      kind: "endorse",
      listingId: "l1",
      occurredAt: "2026-04-01T10:00:00Z",
    });
    expect(events).toEqual([["u4", DISCORD_WEIGHTS.endorse]]);
  });

  it("clamps cumulative contribution at 100", async () => {
    // 4 days × DAILY_CAP (50) = 200 raw, clamped to 100. Reduced from 30 days for DB
    // round-trip cost; still proves the clamp activates after exceeding 100.
    const days = 4;
    for (let d = 0; d < days; d++) {
      const date = `2026-04-${String(d + 1).padStart(2, "0")}T10:00:00Z`;
      for (let i = 0; i < 11; i++) {
        await bridge.ingest({
          userId: "u5",
          kind: "share",
          listingId: "l1",
          occurredAt: date,
        });
      }
    }
    expect(await bridge.contributionFor("u5")).toBe(100);
  });
});

describe("attributeAmbassadorReward (pure)", () => {
  it("calculates 5% reward by default", () => {
    const result = attributeAmbassadorReward("ambassador_1", 10000);
    expect(result.rewardAmount).toBe(500);
    expect(result.share).toBe(0.05);
  });

  it("respects custom share parameter", () => {
    const result = attributeAmbassadorReward("ambassador_2", 10000, 0.10);
    expect(result.rewardAmount).toBe(1000);
    expect(result.share).toBe(0.10);
  });

  it("returns correct ambassador metadata", () => {
    const result = attributeAmbassadorReward("amb_x", 5000);
    expect(result.ambassadorId).toBe("amb_x");
    expect(result.saleAmount).toBe(5000);
    expect(result.awardedAt).toBeTruthy();
  });

  it("includes a mock smart-contract txHash starting with 0x", () => {
    const result = attributeAmbassadorReward("amb_tx", 3000);
    expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
