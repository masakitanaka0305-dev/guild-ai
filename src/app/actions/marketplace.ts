"use server";

// GUILD AI — Marketplace Server Action
// Lets "use client" /sell pages persist new listings without bundling Neon driver.

import type { Listing } from "@/types";
import { persistListing } from "@/lib/marketplace/db";

export async function persistListingAction(listing: Listing): Promise<{ ok: boolean; error?: string }> {
  try {
    await persistListing(listing);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "persist failed" };
  }
}
