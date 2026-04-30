// GUILD AI — Seed MOCK_MARKETPLACE into listings table
// Idempotent: re-running is safe (onConflictDoNothing).
// Run with: npm run db:seed

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(?:"([^"]*)"|(.*))\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2] ?? m[3] ?? "";
}

async function main() {
  const { db } = await import("../src/db/client");
  const { listings } = await import("../src/db/schema");
  const { MOCK_MARKETPLACE } = await import("../src/lib/marketplace");

  console.log(`→ Seeding ${MOCK_MARKETPLACE.length} listings into Neon...`);

  for (const item of MOCK_MARKETPLACE) {
    const l = item.listing;
    const inserted = await db
      .insert(listings)
      .values({
        id: l.id,
        ownerId: l.ownerId,
        title: l.title,
        description: l.description,
        ccaf: l.ccaf,
        vercelUptimeDays: l.vercelUptimeDays,
        basePrice: l.basePrice,
        rank: l.rank as "S" | "A" | "B",
        floorPrice: l.floorPrice,
        githubUrl: l.githubUrl,
        remixedFrom: l.remixedFrom,
        proofOfMakeNote: l.proofOfMakeNote,
      })
      .onConflictDoNothing()
      .returning({ id: listings.id });

    const status = inserted.length ? "INSERTED" : "skipped (exists)";
    console.log(`  ${status.padEnd(18)} ${l.id} [${l.rank}] ${l.title}`);
  }

  console.log("\n✓ Seed complete");
}

main().catch((err) => {
  console.error("✗ Seed FAILED:", err);
  process.exit(1);
});
