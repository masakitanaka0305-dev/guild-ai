import { describe, it, expect, beforeEach } from "vitest";
import {
  requestSignedCommit,
  verifySignedCommit,
  requestHiddenFile,
  verifyHiddenFile,
  _resetChallenges,
} from "@/lib/ownership-verify";

const HAS_DB = !!process.env.DATABASE_URL;
const REPO_URL = "https://github.com/test/ownership-verify-test";
const REPO_URL_2 = "https://github.com/test/ownership-verify-test-2";

describe.skipIf(!HAS_DB)("ownership-verify (DB integration)", () => {
  beforeEach(async () => { await _resetChallenges(); });

  describe("requestSignedCommit", () => {
    it("returns challenge with token and expectedCommitMessage", async () => {
      const challenge = await requestSignedCommit(REPO_URL, "testuser");
      expect(typeof challenge.token).toBe("string");
      expect(challenge.token.length).toBeGreaterThan(0);
      expect(challenge.expectedCommitMessage).toContain("GUILD-CLAIM:");
      expect(challenge.expectedCommitMessage).toContain(challenge.token);
    });

    it("sets claimerHandle and repoUrl", async () => {
      const challenge = await requestSignedCommit(REPO_URL, "testuser");
      expect(challenge.claimerHandle).toBe("testuser");
      expect(challenge.repoUrl).toBe(REPO_URL);
    });
  });

  describe("verifySignedCommit", () => {
    it("succeeds with matching token and verified=true", async () => {
      const challenge = await requestSignedCommit(REPO_URL, "testuser");
      const result = await verifySignedCommit(REPO_URL, {
        message: `GUILD-CLAIM:${challenge.token}`,
        verified: true,
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.claimStatus).toBe("claimed");
    });

    it("fails with wrong token", async () => {
      await requestSignedCommit(REPO_URL, "testuser");
      const result = await verifySignedCommit(REPO_URL, {
        message: "GUILD-CLAIM:wrong-token-xyz",
        verified: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.reason).toBe("token_mismatch");
    });

    it("fails with verified=false even with correct token", async () => {
      const challenge = await requestSignedCommit(REPO_URL, "testuser");
      const result = await verifySignedCommit(REPO_URL, {
        message: `GUILD-CLAIM:${challenge.token}`,
        verified: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.reason).toBe("not_verified");
    });
  });

  describe("requestHiddenFile", () => {
    it("returns challenge with .guild/claim.json path", async () => {
      const challenge = await requestHiddenFile(REPO_URL_2, "testuser2");
      expect(challenge.expectedFilePath).toBe(".guild/claim.json");
      expect(typeof challenge.token).toBe("string");
      expect(challenge.expectedContents.token).toBe(challenge.token);
    });
  });

  describe("verifyHiddenFile", () => {
    it("succeeds with correct token in correct path", async () => {
      const challenge = await requestHiddenFile(REPO_URL_2, "testuser2");
      const result = await verifyHiddenFile(REPO_URL_2, {
        path: ".guild/claim.json",
        contents: { token: challenge.token, claimerHandle: "testuser2" },
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.claimStatus).toBe("claimed");
    });

    it("fails with wrong path", async () => {
      const challenge = await requestHiddenFile(REPO_URL_2, "testuser2");
      const result = await verifyHiddenFile(REPO_URL_2, {
        path: ".wrong/path.json",
        contents: { token: challenge.token },
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.reason).toBe("file_not_found");
    });

    it("fails with wrong token in correct path", async () => {
      await requestHiddenFile(REPO_URL_2, "testuser2");
      const result = await verifyHiddenFile(REPO_URL_2, {
        path: ".guild/claim.json",
        contents: { token: "wrong-token-xyz" },
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.reason).toBe("content_mismatch");
    });
  });
});
