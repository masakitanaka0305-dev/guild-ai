"use server";

// GUILD AI — Auth Server Actions
// Registration, login, logout flows. Sessions are HttpOnly cookies tied to
// rows in the `sessions` table.

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  generateUserId,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  lastNameKanji?: string;
  firstNameKanji?: string;
  lastNameKana?: string;
  firstNameKana?: string;
  birthDate?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  phone?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  agreedToTerms: boolean;
}

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

function basicEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function registerAction(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!basicEmail(email)) return { ok: false, error: "メールアドレスの形式が正しくありません" };
  if (input.password.length < 8) return { ok: false, error: "パスワードは8文字以上で設定してください" };
  if (!input.displayName.trim()) return { ok: false, error: "表示名を入力してください" };
  if (!input.agreedToTerms) return { ok: false, error: "利用規約への同意が必要です" };

  // Check email uniqueness
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return { ok: false, error: "このメールアドレスは既に登録されています" };

  const userId = generateUserId();
  const passwordHash = await hashPassword(input.password);

  try {
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      displayName: input.displayName.trim(),
      lastNameKanji: input.lastNameKanji?.trim() || null,
      firstNameKanji: input.firstNameKanji?.trim() || null,
      lastNameKana: input.lastNameKana?.trim() || null,
      firstNameKana: input.firstNameKana?.trim() || null,
      birthDate: input.birthDate || null,
      gender: input.gender || null,
      phone: input.phone?.trim() || null,
      postalCode: input.postalCode?.trim() || null,
      prefecture: input.prefecture?.trim() || null,
      city: input.city?.trim() || null,
      addressLine1: input.addressLine1?.trim() || null,
      addressLine2: input.addressLine2?.trim() || null,
      agreedToTermsAt: new Date(),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "登録に失敗しました" };
  }

  // Auto-login: create session + set cookie
  const session = await createSession(userId);
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: session.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });

  return { ok: true, userId };
}

export async function loginAction(input: { email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return { ok: false, error: "メールアドレスまたはパスワードが違います" };

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) return { ok: false, error: "メールアドレスまたはパスワードが違います" };

  const session = await createSession(user.id);
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: session.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });

  return { ok: true, userId: user.id };
}

export async function logoutAction(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  await deleteSession(token);
  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/");
}

/**
 * Same as logoutAction but does NOT redirect. Caller (a "use client" component)
 * is expected to do `window.location.href = "/"` after this returns to force a
 * full reload — that's the only way to evict the AuthProvider's cached user
 * state on the client.
 */
export async function performLogoutAction(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  await deleteSession(token);
  cookies().delete(SESSION_COOKIE_NAME);
}

export interface SessionUserSummary {
  id: string;
  email: string;
  displayName: string;
}

/** Reads the current session cookie and returns a minimal user summary, or null. */
export async function getSessionUserAction(): Promise<SessionUserSummary | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const { getUserBySessionToken } = await import("@/lib/auth");
  const user = await getUserBySessionToken(token);
  if (!user) return null;
  return { id: user.id, email: user.email, displayName: user.displayName };
}
