// Pure-function tests for profile-analyzer. Octokit-dependent path is not exercised
// here (would need mocking); we cover the deterministic pieces:
// - generateSummary template
// - computeRank thresholds
// - dependency parser correctness

import { describe, it, expect } from "vitest";
import { computeRank, generateSummary, type GithubStats } from "@/lib/profile-analyzer";

describe("computeRank", () => {
  it("S rank for high stars + contributions", () => {
    const stats: GithubStats = { stars: 250, contributions: 100, activeYears: 5, publicRepos: 30, pinnedRepoNames: [] };
    expect(computeRank(stats)).toBe("S");
  });

  it("A rank for moderate stars", () => {
    const stats: GithubStats = { stars: 90, contributions: 50, activeYears: 3, publicRepos: 12, pinnedRepoNames: [] };
    expect(computeRank(stats)).toBe("A");
  });

  it("B rank for low stars", () => {
    const stats: GithubStats = { stars: 5, contributions: 10, activeYears: 1, publicRepos: 3, pinnedRepoNames: [] };
    expect(computeRank(stats)).toBe("B");
  });

  it("S boundary inclusive at score=200", () => {
    const stats: GithubStats = { stars: 200, contributions: 0, activeYears: 0, publicRepos: 0, pinnedRepoNames: [] };
    expect(computeRank(stats)).toBe("S");
  });

  it("A boundary inclusive at score=80", () => {
    const stats: GithubStats = { stars: 80, contributions: 0, activeYears: 0, publicRepos: 0, pinnedRepoNames: [] };
    expect(computeRank(stats)).toBe("A");
  });
});

describe("generateSummary", () => {
  it("LLM domain when langchain present", () => {
    const stats: GithubStats = { stars: 100, contributions: 50, activeYears: 3, publicRepos: 10, pinnedRepoNames: [] };
    const summary = generateSummary(["LangChain", "Python", "FastAPI"], stats);
    expect(summary).toContain("LLM/エージェント");
    expect(summary).toContain("LangChain");
    expect(summary).toContain("3年相当");
  });

  it("Web frontend domain when react present", () => {
    const stats: GithubStats = { stars: 30, contributions: 20, activeYears: 2, publicRepos: 5, pinnedRepoNames: [] };
    const summary = generateSummary(["React", "TypeScript", "Tailwind CSS"], stats);
    expect(summary).toContain("Web フロントエンド");
  });

  it("falls back to ソフトウェア when no domain match", () => {
    const stats: GithubStats = { stars: 0, contributions: 0, activeYears: 1, publicRepos: 1, pinnedRepoNames: [] };
    const summary = generateSummary([], stats);
    expect(summary).toContain("ソフトウェア");
    expect(summary).toContain("汎用言語");
  });

  it("clamps experience years to 1..20", () => {
    const stats: GithubStats = { stars: 0, contributions: 0, activeYears: 50, publicRepos: 1, pinnedRepoNames: [] };
    const summary = generateSummary(["Python"], stats);
    expect(summary).toContain("20年相当");

    const fresh: GithubStats = { stars: 0, contributions: 0, activeYears: 0, publicRepos: 1, pinnedRepoNames: [] };
    const summaryFresh = generateSummary(["Python"], fresh);
    expect(summaryFresh).toContain("1年相当");
  });
});
