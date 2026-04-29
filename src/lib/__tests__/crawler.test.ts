import { describe, it, expect, beforeEach } from "vitest";
import {
  crawlPublicSources,
  crawlPublicSourcesWithStatus,
  updateClaimStatus,
  getClaimStatus,
  _resetClaims,
} from "@/lib/crawler";

const HAS_DB = !!process.env.DATABASE_URL;

describe("crawler (sync MOCK_REPOS)", () => {
  it("crawlPublicSources() returns exactly 10 items", () => {
    const repos = crawlPublicSources();
    expect(repos).toHaveLength(10);
  });

  it("all items have claimStatus unclaimed initially (no DB layer)", () => {
    const repos = crawlPublicSources();
    for (const repo of repos) {
      expect(repo.claimStatus).toBe("unclaimed");
    }
  });

  it("each item has required fields", () => {
    const repos = crawlPublicSources();
    for (const repo of repos) {
      expect(repo.source).toBe("github");
      expect(typeof repo.repoUrl).toBe("string");
      expect(typeof repo.defaultBranch).toBe("string");
      expect(Array.isArray(repo.topics)).toBe(true);
      expect(typeof repo.summaryFromReadme).toBe("string");
      expect(typeof repo.lastCommitSha).toBe("string");
      expect(typeof repo.signals.stars).toBe("number");
      expect(typeof repo.signals.forks).toBe("number");
      expect(typeof repo.signals.recentCommits).toBe("number");
    }
  });
});

describe.skipIf(!HAS_DB)("crawler (DB-backed claim status)", () => {
  beforeEach(async () => { await _resetClaims(); });

  it("updateClaimStatus persists and getClaimStatus reads back", async () => {
    const url = "https://github.com/example/auto-tagger";
    await updateClaimStatus(url, "claimed");
    expect(await getClaimStatus(url)).toBe("claimed");
  });

  it("getClaimStatus returns unclaimed for unknown repo", async () => {
    expect(await getClaimStatus("https://github.com/unknown/repo")).toBe("unclaimed");
  });

  it("crawlPublicSourcesWithStatus merges DB status with seed data", async () => {
    const url = "https://github.com/example/invoice-ocr";
    await updateClaimStatus(url, "verifying");
    const repos = await crawlPublicSourcesWithStatus();
    const target = repos.find((r) => r.repoUrl === url);
    expect(target?.claimStatus).toBe("verifying");
  });

  it("updateClaimStatus is upsert (second call overwrites)", async () => {
    const url = "https://github.com/example/csv-cleaner";
    await updateClaimStatus(url, "verifying");
    await updateClaimStatus(url, "claimed");
    expect(await getClaimStatus(url)).toBe("claimed");
  });
});
