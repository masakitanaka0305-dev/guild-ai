import { describe, it, expect, beforeEach } from "vitest";
import { recordUnclaimedUsage, getValuePool, releaseRetroactive, _resetPools } from "@/lib/value-pool";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("value-pool (DB integration)", () => {
  beforeEach(async () => { await _resetPools(); });

  it("recordUnclaimedUsage accumulates amounts", async () => {
    await recordUnclaimedUsage("vp-test-001", 500);
    await recordUnclaimedUsage("vp-test-001", 300);
    const pool = await getValuePool("vp-test-001");
    expect(pool).not.toBeNull();
    expect(pool!.totalPooledJpy).toBe(800);
    expect(pool!.perUseHistory).toHaveLength(2);
  });

  it("getValuePool returns correct total", async () => {
    await recordUnclaimedUsage("vp-test-002", 1000);
    const pool = await getValuePool("vp-test-002");
    expect(pool).not.toBeNull();
    expect(pool!.totalPooledJpy).toBe(1000);
  });

  it("getValuePool returns null if no pool exists", async () => {
    expect(await getValuePool("vp-nonexistent-xyz")).toBeNull();
  });

  it("releaseRetroactive sets distributedYet=true and returns releasedJpy", async () => {
    await recordUnclaimedUsage("vp-test-003", 750);
    const result = await releaseRetroactive("vp-test-003", "claimer-001");
    expect(result).toEqual({ releasedJpy: 750 });
    const pool = await getValuePool("vp-test-003");
    expect(pool!.distributedYet).toBe(true);
    expect(pool!.claimerId).toBe("claimer-001");
  });

  it("releaseRetroactive returns error if already distributed", async () => {
    await recordUnclaimedUsage("vp-test-004", 500);
    await releaseRetroactive("vp-test-004", "claimer-002");
    const result = await releaseRetroactive("vp-test-004", "claimer-002");
    expect(result).toEqual({ error: "already_distributed" });
  });

  it("releaseRetroactive returns error if no pool exists", async () => {
    const result = await releaseRetroactive("vp-nonexistent-abc", "claimer");
    expect(result).toEqual({ error: "no_pool" });
  });
});
