// GUILD AI — Auth (password hashing + session tokens)
// Password: scrypt (Node built-in) with 16-byte salt, 64-byte derived key.
//   Format stored in DB: "scrypt:<saltHex>:<hashHex>"
// Session: opaque random token (32 bytes base64url) → row in `sessions` table.
//   Cookie set HttpOnly; expires after SESSION_TTL_DAYS.

import { eq, lt } from "drizzle-orm";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "@/db/client";
import { users, sessions } from "@/db/schema";
import type { UserRow } from "@/db/schema";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const SCHEME = "scrypt";
const KEY_LEN = 64;
const SALT_LEN = 16;
export const SESSION_TTL_DAYS = 30;
export const SESSION_COOKIE_NAME = "guild_session";

// ─── password ─────────────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const key = await scryptAsync(plain, salt, KEY_LEN);
  return `${SCHEME}:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== SCHEME || !saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(plain, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ─── sessions ─────────────────────────────────────────────────────────────────

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string | undefined): Promise<UserRow | null> {
  if (!token) return null;
  const [row] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }
  const [user] = await db.select().from(users).where(eq(users.id, row.userId));
  return user ?? null;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.token, token));
}

/** Periodic cleanup helper (call from a cron, not in hot path). */
export async function purgeExpiredSessions(): Promise<number> {
  const rows = await db.delete(sessions).where(lt(sessions.expiresAt, new Date())).returning({ token: sessions.token });
  return rows.length;
}

// ─── id generator ─────────────────────────────────────────────────────────────

export function generateUserId(): string {
  return "usr_" + randomBytes(8).toString("base64url");
}
