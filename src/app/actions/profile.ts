"use server";

// GUILD AI — Profile Server Actions
// Onboarding flow: save minimal user input + bootstrap profile row.
// GitHub auto-analysis is kicked off non-awaited so the user can move on to /projects.

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { users, profiles } from "@/db/schema";
import { authOptions } from "@/lib/next-auth";
import { generateUserId } from "@/lib/auth";
import { runProfileAnalyzer } from "@/lib/profile-analyzer";

export interface SaveProfileInput {
  lastName: string;
  firstName: string;
  prefecture: string;
  birthYear: number;
}

export type SaveProfileResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

const OAUTH_PASSWORD_SENTINEL = "oauth:no-password";

export async function saveProfileAction(input: SaveProfileInput): Promise<SaveProfileResult> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return { ok: false, error: "セッションが見つかりません。再ログインしてください。" };

  if (!input.lastName.trim() || !input.firstName.trim()) {
    return { ok: false, error: "姓・名を入力してください" };
  }
  if (!input.prefecture) return { ok: false, error: "都道府県を選択してください" };
  if (!input.birthYear || input.birthYear < 1900 || input.birthYear > new Date().getFullYear()) {
    return { ok: false, error: "生年が不正です" };
  }

  // Find or create user by email.
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  let userId = existing?.id;
  if (!userId) {
    userId = generateUserId();
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash: OAUTH_PASSWORD_SENTINEL,
      displayName: session?.user?.name ?? `${input.lastName} ${input.firstName}`,
    });
  }

  // Upsert profile row (status starts at "provisional").
  await db
    .insert(profiles)
    .values({
      userId,
      lastName: input.lastName.trim(),
      firstName: input.firstName.trim(),
      prefecture: input.prefecture,
      birthYear: input.birthYear,
      status: "provisional",
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        lastName: input.lastName.trim(),
        firstName: input.firstName.trim(),
        prefecture: input.prefecture,
        birthYear: input.birthYear,
        updatedAt: new Date(),
      },
    });

  // Fire-and-forget analyzer if GitHub-linked. We don't await — user redirects to /projects.
  const sessTyped = session as typeof session & { accessToken?: string; githubLogin?: string; provider?: string };
  if (sessTyped.provider === "github" && sessTyped.accessToken && sessTyped.githubLogin) {
    runProfileAnalyzer({
      userId,
      githubLogin: sessTyped.githubLogin,
      accessToken: sessTyped.accessToken,
    }).catch((err) => {
      console.error("[profile-analyzer] background failure", err);
    });
  }

  return { ok: true, userId };
}
