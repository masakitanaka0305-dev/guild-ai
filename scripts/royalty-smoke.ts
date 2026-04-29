// GUILD AI — Royalty persistence smoke test
// Run with: npx tsx scripts/royalty-smoke.ts

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(?:"([^"]*)"|(.*))\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2] ?? m[3] ?? "";
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  const { db } = await import("../src/db/client");
  const { listings, royaltyPayouts, royaltyDistributions } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const { distributeRoyalty } = await import("../src/lib/royalty");
  const { persistRoyaltyPayout, getRoyaltyHistoryForAsset, getRoyaltyEarningsForCreator } = await import("../src/lib/royalty/db");

  const ASSET_ID = "smoke-royalty-" + Date.now();

  console.log("→ seed listing fixture");
  await db.insert(listings).values({
    id: ASSET_ID,
    ownerId: "smoke-creator",
    title: "Smoke Royalty Asset",
    description: "fixture",
    ccaf: { intentSignals: ["seed"], thoughtDensity: 50, iterations: 1, authorId: "smoke-creator", createdAt: new Date().toISOString() },
    vercelUptimeDays: 0,
    basePrice: 100000,
    rank: "B",
    floorPrice: 100000,
  });

  try {
    // 1. persist a 3-gen royalty payout (15+7+3 = 25%)
    console.log("→ [1] persist 3-gen payout");
    const result = distributeRoyalty(100000, [
      { creatorId: "smoke-c1", name: "曾祖父" },
      { creatorId: "smoke-c2", name: "祖父" },
      { creatorId: "smoke-c3", name: "親" },
    ]);
    const persisted = await persistRoyaltyPayout(ASSET_ID, result);
    assert(persisted.totalRoyaltyPaid === 25000, `expected 25000, got ${persisted.totalRoyaltyPaid}`);
    assert(persisted.sellerNet === 75000, `expected 75000, got ${persisted.sellerNet}`);
    assert(persisted.distributionIds.length === 3, "3 distributions persisted");

    // 2. history for asset returns row
    console.log("→ [2] getRoyaltyHistoryForAsset");
    const history = await getRoyaltyHistoryForAsset(ASSET_ID);
    assert(history.length === 1, `expected 1 history row, got ${history.length}`);
    assert(history[0].saleAmount === 100000, "saleAmount stored correctly");

    // 3. creator earnings aggregate
    console.log("→ [3] getRoyaltyEarningsForCreator (parent gets 15%)");
    const parentEarnings = await getRoyaltyEarningsForCreator("smoke-c3");
    assert(parentEarnings === 15000, `parent should earn 15000, got ${parentEarnings}`);

    const grandpaEarnings = await getRoyaltyEarningsForCreator("smoke-c2");
    assert(grandpaEarnings === 7000, "grandpa earns 7000");

    const greatGrandpaEarnings = await getRoyaltyEarningsForCreator("smoke-c1");
    assert(greatGrandpaEarnings === 3000, "great-grandpa earns 3000");

    // 4. multiple sales accumulate
    console.log("→ [4] multiple sales accumulate per creator");
    await persistRoyaltyPayout(
      ASSET_ID,
      distributeRoyalty(50000, [{ creatorId: "smoke-c3", name: "親" }])
    );
    const updatedParentEarnings = await getRoyaltyEarningsForCreator("smoke-c3");
    assert(updatedParentEarnings === 15000 + 7500, `parent should now have 22500, got ${updatedParentEarnings}`);

    // 5. cascade delete: removing parent payout removes children
    console.log("→ [5] cascade delete on parent payout");
    await db.delete(royaltyPayouts).where(eq(royaltyPayouts.id, persisted.id));
    const remainingDists = await db
      .select()
      .from(royaltyDistributions)
      .where(eq(royaltyDistributions.payoutId, persisted.id));
    assert(remainingDists.length === 0, "child distributions cascade-deleted");

    console.log("\n✓ Royalty persistence smoke PASSED — 5 scenarios OK");
  } finally {
    console.log("\n→ cleanup");
    await db.delete(royaltyPayouts).where(eq(royaltyPayouts.saleAssetId, ASSET_ID));
    await db.delete(listings).where(eq(listings.id, ASSET_ID));
  }
}

main().catch((err) => {
  console.error("✗ Royalty smoke FAILED:", err);
  process.exit(1);
});
