// GUILD AI — Admin / Applications data layer
// Lists engineer profiles for company-side review. Implements privacy gating:
// real name + email are hidden until an escrow_reserves row tied to this
// engineer has progressed past "pending" (= match established).

import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles, users, escrowReserves } from "@/db/schema";
import type { ProfileRow } from "@/db/schema";

export interface ApplicationCard {
  userId:               string;
  // Anonymized representation
  displayHandle:        string;          // 「佐藤 K.」
  ageBucket:            string | null;   // 「30代前半」
  prefecture:           string | null;
  primarySkills:        string[];
  rank:                 "S" | "A" | "B" | null;
  aiGeneratedSummary:   string | null;
  lastActiveLabel:      string;          // 「3時間前」「1日前」「未連携」
  status:               "provisional" | "official";
  // Revealed only when match established
  identityRevealed:     boolean;
  fullName?:            string;
  email?:               string;
}

export function ageBucketFromBirthYear(birthYear: number | null): string | null {
  if (!birthYear) return null;
  const age = new Date().getFullYear() - birthYear;
  if (age < 20) return "10代";
  const decade = Math.floor(age / 10) * 10;
  const half = age % 10 < 5 ? "前半" : "後半";
  if (decade >= 50) return "50代以上";
  return `${decade}代${half}`;
}

export function lastActiveLabel(lastActiveAt: Date | null): string {
  if (!lastActiveAt) return "未連携";
  const ms = Date.now() - lastActiveAt.getTime();
  const hours = Math.floor(ms / (3600 * 1000));
  if (hours < 1) return "1時間以内";
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  const months = Math.floor(days / 30);
  return `${months}ヶ月前`;
}

export function anonymizedHandle(profile: ProfileRow): string {
  const last = profile.lastName ?? "匿名";
  const first = profile.firstName ?? "";
  if (!first) return last;
  // Latin name: uppercase first letter (e.g. "Kenta" → "K"). Japanese: first char as-is (健太 → 健).
  const initial = /^[A-Za-z]/.test(first) ? first[0].toUpperCase() : first[0];
  return `${last} ${initial}.`;
}

/**
 * Returns true if the user has an active escrow reserve (status past "pending"),
 * i.e. a match has been established and identity should be revealed.
 *
 * Matched by user email = applicantHandle. (Engineers may also use GitHub login
 * as their applicantHandle; that case is captured via the same email field
 * lookup since handles in /projects are seeded with email-shaped strings today.)
 */
async function hasActiveMatch(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const matchedUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.id, userIds));

  const handles = matchedUsers.map((u) => u.email);
  if (handles.length === 0) return new Set();

  const reserves = await db
    .select({ applicantHandle: escrowReserves.applicantHandle })
    .from(escrowReserves)
    .where(and(
      inArray(escrowReserves.applicantHandle, handles),
      ne(escrowReserves.status, "pending"),
    ));

  const matchedHandles = new Set(reserves.map((r) => r.applicantHandle));
  return new Set(matchedUsers.filter((u) => matchedHandles.has(u.email)).map((u) => u.id));
}

export async function listApplicationCards(): Promise<ApplicationCard[]> {
  const rows = await db
    .select({
      profile: profiles,
      user:    users,
    })
    .from(profiles)
    .leftJoin(users, eq(profiles.userId, users.id))
    .orderBy(sql`${profiles.lastActiveAt} DESC NULLS LAST`);

  const userIds = rows.map((r) => r.profile.userId);
  const revealedSet = await hasActiveMatch(userIds);

  return rows.map(({ profile, user }) => {
    const revealed = revealedSet.has(profile.userId);
    const card: ApplicationCard = {
      userId:             profile.userId,
      displayHandle:      anonymizedHandle(profile),
      ageBucket:          ageBucketFromBirthYear(profile.birthYear),
      prefecture:         profile.prefecture,
      primarySkills:      profile.primarySkills ?? [],
      rank:               profile.rank as "S" | "A" | "B" | null,
      aiGeneratedSummary: profile.aiGeneratedSummary,
      lastActiveLabel:    lastActiveLabel(profile.lastActiveAt),
      status:             profile.status as "provisional" | "official",
      identityRevealed:   revealed,
    };
    if (revealed && profile.lastName && profile.firstName) {
      card.fullName = `${profile.lastName} ${profile.firstName}`;
    }
    if (revealed && user?.email) {
      card.email = user.email;
    }
    return card;
  });
}
