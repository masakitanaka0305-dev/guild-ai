// GUILD AI — Marketplace persist smoke test
// Run with: npx tsx scripts/marketplace-smoke.ts

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
  const { listings } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const { persistListing, persistAutoList, getListingById } = await import("../src/lib/marketplace/db");

  const ID = "smoke-mkt-" + Date.now();

  try {
    // 1. persistAutoList computes + persists
    console.log("→ [1] persistAutoList writes to DB");
    const result = await persistAutoList(
      {
        id: ID,
        ownerId: "smoke-creator",
        title: "Smoke Marketplace Asset",
        description: "for marketplace smoke",
        ccaf: { intentSignals: ["smoke"], thoughtDensity: 88, iterations: 5, authorId: "smoke-creator", createdAt: new Date().toISOString() },
        vercelUptimeDays: 35,
        basePrice: 10000,
      },
      { qualityHistory: 80, discordContribution: 60, xAmplification: 50 },
      new Date().toISOString()
    );
    assert(result.listing.id === ID, "id preserved");
    assert(result.listing.rank === "S", `rank should be S, got ${result.listing.rank}`);
    assert(result.listing.floorPrice >= result.listing.basePrice, "floorPrice >= basePrice");

    // 2. getListingById returns persisted row
    console.log("→ [2] getListingById fetches persisted row");
    const fetched = await getListingById(ID);
    assert(fetched?.id === ID, "id matches");
    assert(fetched?.title === "Smoke Marketplace Asset", "title matches");
    assert(fetched?.rank === result.listing.rank, "rank persisted");
    assert(fetched?.floorPrice === result.listing.floorPrice, "floorPrice persisted");

    // 3. persistListing is idempotent (onConflictDoNothing)
    console.log("→ [3] persistListing is idempotent");
    await persistListing(result.listing); // re-insert same id — should not throw
    const refetched = await getListingById(ID);
    assert(refetched?.title === "Smoke Marketplace Asset", "still there after re-insert");

    // 4. getListingById returns undefined for missing
    console.log("→ [4] getListingById returns undefined for missing");
    assert((await getListingById("does-not-exist")) === undefined, "missing → undefined");

    console.log("\n✓ Marketplace persist smoke PASSED — 4 scenarios OK");
  } finally {
    console.log("\n→ cleanup");
    await db.delete(listings).where(eq(listings.id, ID));
  }
}

main().catch((err) => {
  console.error("✗ Marketplace smoke FAILED:", err);
  process.exit(1);
});
