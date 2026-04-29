// GUILD AI — Marketplace (DB writes)
// Persists newly-listed assets from the /sell flow to the listings table.
// Reads stay served by lib/marketplace/index.ts (MOCK_MARKETPLACE) for now —
// a future PR can switch consumers to getAllListingsFromDb when ready.

import { eq } from "drizzle-orm";
import type { Listing, MarketplaceListing, TrustScoreInput } from "@/types";
import { db } from "@/db/client";
import { listings } from "@/db/schema";
import { autoList } from "./index";

/**
 * persistListing — idempotent insert. If a row with this id already exists
 * (e.g., one of the seeded MOCK_MARKETPLACE entries), skip.
 */
export async function persistListing(listing: Listing): Promise<void> {
  await db
    .insert(listings)
    .values({
      id: listing.id,
      ownerId: listing.ownerId,
      title: listing.title,
      description: listing.description,
      ccaf: listing.ccaf,
      vercelUptimeDays: listing.vercelUptimeDays,
      basePrice: listing.basePrice,
      rank: listing.rank,
      floorPrice: listing.floorPrice,
      githubUrl: listing.githubUrl,
      remixedFrom: listing.remixedFrom,
      proofOfMakeNote: listing.proofOfMakeNote,
    })
    .onConflictDoNothing();
}

/** persistAutoList — compute via autoList AND persist in one step. */
export async function persistAutoList(
  input: Omit<Listing, "rank" | "floorPrice">,
  trustInput: TrustScoreInput,
  listedAt?: string
): Promise<MarketplaceListing> {
  const result = autoList(input, trustInput, listedAt);
  await persistListing(result.listing);
  return result;
}

/** getAllListingsFromDb — read every persisted listing. Caller can hydrate audit/trust at display time. */
export async function getAllListingsFromDb(): Promise<Listing[]> {
  const rows = await db.select().from(listings);
  return rows.map((r) => ({
    id: r.id,
    ownerId: r.ownerId,
    title: r.title,
    description: r.description,
    ccaf: r.ccaf,
    vercelUptimeDays: r.vercelUptimeDays,
    rank: r.rank,
    basePrice: r.basePrice,
    floorPrice: r.floorPrice,
    githubUrl: r.githubUrl ?? undefined,
    remixedFrom: r.remixedFrom ?? undefined,
    proofOfMakeNote: r.proofOfMakeNote ?? undefined,
  }));
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const [row] = await db.select().from(listings).where(eq(listings.id, id));
  if (!row) return undefined;
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    description: row.description,
    ccaf: row.ccaf,
    vercelUptimeDays: row.vercelUptimeDays,
    rank: row.rank,
    basePrice: row.basePrice,
    floorPrice: row.floorPrice,
    githubUrl: row.githubUrl ?? undefined,
    remixedFrom: row.remixedFrom ?? undefined,
    proofOfMakeNote: row.proofOfMakeNote ?? undefined,
  };
}
