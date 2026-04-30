import { describe, it, expect, beforeEach } from "vitest";
import {
  scanRepo,
  validateGithubUrl,
} from "@/lib/repo-scanner";
import {
  evaluateDepth,
  audit,
} from "@/lib/ai-auditor";
import {
  computeSimilarity,
  screenSubmission,
  freezeAccount,
  isAccountFrozen,
  redirectFutureRoyalty,
  getRoyaltyRedirect,
  _resetOriginalityWatch,
} from "@/lib/originality-watch";

// ─── repo-scanner ─────────────────────────────────────────────────────────────

describe("repo-scanner", () => {
  it("scanRepo is deterministic for same URL", () => {
    const a = scanRepo("https://github.com/user/my-repo");
    const b = scanRepo("https://github.com/user/my-repo");
    expect(a.summary.totalFiles).toBe(b.summary.totalFiles);
    expect(a.suggestedAssets.length).toBe(b.suggestedAssets.length);
    expect(a.suggestedAssets[0]?.title).toBe(b.suggestedAssets[0]?.title);
  });

  it("scanRepo extracts MD files including README", () => {
    const result = scanRepo("https://github.com/handev/toolkit");
    expect(result.summary.readmeFound).toBe(true);
    const readme = result.files.find((f) => f.path === "README.md");
    expect(readme).toBeDefined();
    expect(readme?.type).toBe("md");
    expect(readme?.mdScore).toBeGreaterThanOrEqual(85);
  });

  it("scanRepo returns 5–12 total files", () => {
    for (const url of [
      "https://github.com/alice/project-a",
      "https://github.com/bob/service-b",
      "https://github.com/carol/lib-c",
    ]) {
      const result = scanRepo(url);
      expect(result.summary.totalFiles).toBeGreaterThanOrEqual(5);
      expect(result.summary.totalFiles).toBeLessThanOrEqual(12);
    }
  });

  it("validateGithubUrl accepts valid URLs and rejects invalid", () => {
    expect(validateGithubUrl("https://github.com/user/repo")).toBe(true);
    expect(validateGithubUrl("https://github.com/user/my-cool.repo")).toBe(true);
    expect(validateGithubUrl("https://not-github.com/user/repo")).toBe(false);
    expect(validateGithubUrl("github.com/user/repo")).toBe(false);
  });
});

// ─── quality-gate ─────────────────────────────────────────────────────────────

describe("quality-gate: S rank conditions", () => {
  const baseCcaf = {
    thoughtDensity: 75,
    iterations: 10,
    intentSignals: ["voice", "manual-edit", "retry"],
    authorId: "test-author",
    createdAt: "2026-01-01T00:00:00Z",
  };
  const fullMd = `
# My Tool — Implementation Guide

なぜこの実装か（why）: 非同期処理が必要なため。
制約 constraint: TypeScript 5.0+、Node.js 18+。
落とし穴 gotcha: null チェックを忘れると実行時エラー。
パフォーマンス performance latency: O(n) で処理。
テスト test example: expect(result).toBe(42). output: { result: 42 }
フォールバック fallback: catch(e) で retry と error handling。

\`\`\`typescript
async function processData(input: string) {
  class Transformer { }
  function transform(data: unknown) { }
  async function verify(x: unknown) { }
  return data;
}
\`\`\`
  `;

  it("all 4 S conditions satisfied → S rank", () => {
    const result = audit({
      ccaf: baseCcaf,
      vercelUptimeDays: 35,
      mdContent: fullMd,
    });
    expect(result.rank).toBe("S");
    expect(result.reasons.some((r) => r.includes("✓"))).toBe(true);
  });

  it("missing hasRunningCode → D rank (non-public, anti-spam gate)", () => {
    const result = audit({
      ccaf: baseCcaf,
      vercelUptimeDays: 35,
      mdContent: "# Simple doc\ntest example output: x",
    });
    expect(result.rank).toBe("D");
    expect(result.reasons.some((r) => r.includes("実稼働コード不足"))).toBe(true);
    expect(result.feedback).toBeDefined();
  });

  it("evaluateDepth detects running code patterns", () => {
    const md = "async function foo() {} class Bar {} def run() fn process() function main() {}";
    const { hasRunningCode } = evaluateDepth(md);
    expect(hasRunningCode).toBe(true);
  });

  it("evaluateDepth returns false for plain text without code", () => {
    const { hasRunningCode } = evaluateDepth("This is just a description with no code.");
    expect(hasRunningCode).toBe(false);
  });

  it("intentSignals < 3 caps at A rank even with all other conditions met", () => {
    const result = audit({
      ccaf: { ...baseCcaf, intentSignals: ["voice"], authorId: "test-author", createdAt: "2026-01-01T00:00:00Z" }, // only 1 signal
      vercelUptimeDays: 35,
      mdContent: fullMd,
    });
    expect(result.rank).not.toBe("S");
  });
});

// ─── originality-watch ────────────────────────────────────────────────────────

describe("originality-watch", () => {
  beforeEach(() => {
    _resetOriginalityWatch();
  });

  it("computeSimilarity is deterministic", () => {
    const a = computeSimilarity("hello world", "hello world");
    const b = computeSimilarity("hello world", "hello world");
    expect(a).toBe(b);
    // Identical strings → high similarity (> 0.9)
    expect(a).toBeGreaterThan(0.9);
  });

  it("computeSimilarity is lower for different strings", () => {
    const same = computeSimilarity("foo bar baz", "foo bar baz");
    const diff = computeSimilarity("foo bar baz", "completely different text here");
    expect(same).toBeGreaterThan(diff);
  });

  it("screenSubmission returns plagiarism for identical MD", () => {
    const md = "This is my original content about processing invoices.";
    const pool = [{ guildId: "GUILD:ORIG001", title: "Invoice Tool", mdContent: md }];
    const result = screenSubmission(md, pool);
    expect(result.verdict).toBe("plagiarism");
    expect(result.flagged).toBe(true);
    expect(result.topMatches[0].similarity).toBeGreaterThanOrEqual(0.85);
  });

  it("screenSubmission returns ok for unique content", () => {
    const pool = [
      { guildId: "GUILD:O002", title: "Data Tool", mdContent: "Processes CSV files with pandas." },
    ];
    const result = screenSubmission("A completely different automation script for invoices.", pool);
    expect(result.verdict).toBe("ok");
    expect(result.flagged).toBe(false);
  });

  it("freezeAccount marks account as frozen", () => {
    freezeAccount("alice", "plagiarism detected");
    expect(isAccountFrozen("alice")).toBe(true);
    expect(isAccountFrozen("bob")).toBe(false);
  });

  it("redirectFutureRoyalty stores redirect record", () => {
    redirectFutureRoyalty("GUILD:FAKE001", "true_author");
    const rec = getRoyaltyRedirect("GUILD:FAKE001");
    expect(rec?.fromGuildId).toBe("GUILD:FAKE001");
    expect(rec?.toCreatorHandle).toBe("true_author");
  });
});
