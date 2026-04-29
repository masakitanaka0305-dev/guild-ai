// GUILD AI — Drizzle DB client
// Default driver: @neondatabase/serverless (HTTP). Works in Node + Edge runtimes
// and matches Vercel's Neon-marketplace recommendation.
// To swap to a non-Neon Postgres (RDS, Supabase direct, local docker), replace
// neon/neon-http with drizzle-orm/node-postgres + pg.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazily initialize so module import doesn't throw at build time.
// DATABASE_URL must be set in runtime env; throws on first db access if missing.
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (dev) or Vercel project env (prod)."
    );
  }
  return drizzle(neon(url), { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type DB = ReturnType<typeof createDb>;
export { schema };
