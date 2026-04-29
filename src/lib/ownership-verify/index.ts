// GUILD AI — Ownership Verify (Postgres-backed)
// Stores cryptographic challenges in the verification_challenges table.
// Keys: "commit:<repoUrl>" or "file:<repoUrl>" (a repo can have one of each).

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { verificationChallenges } from "@/db/schema";

function randomHex(n: number): string {
  // Deterministic "random" using current timestamp truncated — mock only
  return Array.from({ length: n }, (_, i) => ((Date.now() >> i) & 0xf).toString(16)).join("");
}

export interface CommitChallenge {
  token: string;
  expectedCommitMessage: string;
  repoUrl: string;
  claimerHandle: string;
}

export interface HiddenFileChallenge {
  token: string;
  expectedFilePath: string;
  expectedContents: { token: string; claimerHandle: string; timestamp: number };
  repoUrl: string;
}

export type VerifyResult =
  | { success: true; claimStatus: "claimed" }
  | { success: false; reason: "token_mismatch" | "not_verified" | "file_not_found" | "content_mismatch" };

async function upsertChallenge(
  key: string,
  type: "commit" | "file",
  repoUrl: string,
  token: string,
  claimerHandle: string,
  payload: CommitChallenge | HiddenFileChallenge
): Promise<void> {
  await db
    .insert(verificationChallenges)
    .values({ key, type, repoUrl, token, claimerHandle, payload })
    .onConflictDoUpdate({
      target: verificationChallenges.key,
      set: { type, repoUrl, token, claimerHandle, payload, createdAt: new Date() },
    });
}

export async function requestSignedCommit(
  repoUrl: string,
  claimerHandle: string
): Promise<CommitChallenge> {
  const token = randomHex(32);
  const challenge: CommitChallenge = {
    token,
    expectedCommitMessage: `GUILD-CLAIM:${token}`,
    repoUrl,
    claimerHandle,
  };
  await upsertChallenge(`commit:${repoUrl}`, "commit", repoUrl, token, claimerHandle, challenge);
  return challenge;
}

export async function verifySignedCommit(
  repoUrl: string,
  latestCommit: { message: string; verified: boolean }
): Promise<VerifyResult> {
  const [row] = await db
    .select()
    .from(verificationChallenges)
    .where(eq(verificationChallenges.key, `commit:${repoUrl}`));

  const challenge = row?.payload as CommitChallenge | undefined;
  if (!challenge) return { success: false, reason: "token_mismatch" };
  if (!latestCommit.message.includes(challenge.token)) return { success: false, reason: "token_mismatch" };
  if (!latestCommit.verified) return { success: false, reason: "not_verified" };
  return { success: true, claimStatus: "claimed" };
}

export async function requestHiddenFile(
  repoUrl: string,
  claimerHandle: string
): Promise<HiddenFileChallenge> {
  const token = randomHex(32);
  const challenge: HiddenFileChallenge = {
    token,
    expectedFilePath: ".guild/claim.json",
    expectedContents: { token, claimerHandle, timestamp: Date.now() },
    repoUrl,
  };
  await upsertChallenge(`file:${repoUrl}`, "file", repoUrl, token, claimerHandle, challenge);
  return challenge;
}

export async function verifyHiddenFile(
  repoUrl: string,
  file: { path: string; contents: Record<string, unknown> }
): Promise<VerifyResult> {
  const [row] = await db
    .select()
    .from(verificationChallenges)
    .where(eq(verificationChallenges.key, `file:${repoUrl}`));

  const challenge = row?.payload as HiddenFileChallenge | undefined;
  if (!challenge) return { success: false, reason: "file_not_found" };
  if (file.path !== challenge.expectedFilePath) return { success: false, reason: "file_not_found" };
  if (file.contents.token !== challenge.token) return { success: false, reason: "content_mismatch" };
  return { success: true, claimStatus: "claimed" };
}

// Test-only.
export async function _resetChallenges(): Promise<void> {
  await db.delete(verificationChallenges);
}
