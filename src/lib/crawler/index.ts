// GUILD AI — Crawler
// MOCK_REPOS is static seed data (sync). Claim status mutations are persisted to
// the crawl_claims table and exposed via async functions. crawlPublicSources()
// stays sync for callers that don't need live status; crawlPublicSourcesWithStatus()
// is the DB-aware variant.

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { crawlClaims } from "@/db/schema";

export type ClaimStatus = "unclaimed" | "verifying" | "claimed";

export interface CrawledRepo {
  source: "github";
  repoUrl: string;
  defaultBranch: string;
  topics: string[];
  summaryFromReadme: string;
  lastCommitSha: string;
  signals: { stars: number; forks: number; recentCommits: number };
  claimStatus: ClaimStatus;
}

const MOCK_REPOS: CrawledRepo[] = [
  { source: "github", repoUrl: "https://github.com/example/auto-tagger", defaultBranch: "main", topics: ["ai", "nlp", "automation"], summaryFromReadme: "Automatic tag generator for blog posts using NLP models.", lastCommitSha: "a1b2c3d4", signals: { stars: 142, forks: 23, recentCommits: 8 }, claimStatus: "unclaimed" },
  { source: "github", repoUrl: "https://github.com/example/invoice-ocr", defaultBranch: "main", topics: ["ocr", "finance", "python"], summaryFromReadme: "Extract structured data from invoice images using OCR.", lastCommitSha: "e5f6a7b8", signals: { stars: 89, forks: 12, recentCommits: 3 }, claimStatus: "unclaimed" },
  { source: "github", repoUrl: "https://github.com/example/slack-digest", defaultBranch: "main", topics: ["slack", "productivity", "bot"], summaryFromReadme: "Daily digest bot that summarizes Slack channel activity.", lastCommitSha: "c9d0e1f2", signals: { stars: 234, forks: 41, recentCommits: 15 }, claimStatus: "unclaimed" },
  { source: "github", repoUrl: "https://github.com/example/csv-cleaner", defaultBranch: "main", topics: ["data", "csv", "cleaning"], summaryFromReadme: "Smart CSV cleaning and normalization tool.", lastCommitSha: "a3b4c5d6", signals: { stars: 67, forks: 9, recentCommits: 2 }, claimStatus: "unclaimed" },
  { source: "github", repoUrl: "https://github.com/example/meeting-notes-ai", defaultBranch: "main", topics: ["meetings", "ai", "productivity"], summaryFromReadme: "AI-powered meeting notes summarizer and action item extractor.", lastCommitSha: "e7f8g9h0", signals: { stars: 312, forks: 58, recentCommits: 22 }, claimStatus: "unclaimed" },
  { source: "github", repoUrl: "https://github.com/example/pr-reviewer", defaultBranch: "main", topics: ["github", "code-review", "ai"], summaryFromReadme: "Automated PR review assistant that suggests improvements.", lastCommitSha: "i1j2k3l4", signals: { stars: 445, forks: 87, recentCommits: 31 }, claimStatus: "unclaimed" },
  { source: "github", repoUrl: "https://github.com/example/db-migrator", defaultBranch: "main", topics: ["database", "migration", "sql"], summaryFromReadme: "Zero-downtime database migration framework for PostgreSQL.", lastCommitSha: "m5n6o7p8", signals: { stars: 178, forks: 34, recentCommits: 6 }, claimStatus: "unclaimed" },
  { source: "github", repoUrl: "https://github.com/example/ui-accessibility-check", defaultBranch: "main", topics: ["accessibility", "a11y", "testing"], summaryFromReadme: "CLI tool for automated accessibility checks in React components.", lastCommitSha: "q9r0s1t2", signals: { stars: 93, forks: 18, recentCommits: 4 }, claimStatus: "unclaimed" },
  { source: "github", repoUrl: "https://github.com/example/email-classifier", defaultBranch: "main", topics: ["email", "classification", "ml"], summaryFromReadme: "Machine learning email classifier for customer support routing.", lastCommitSha: "u3v4w5x6", signals: { stars: 156, forks: 27, recentCommits: 9 }, claimStatus: "unclaimed" },
  { source: "github", repoUrl: "https://github.com/example/perf-profiler", defaultBranch: "main", topics: ["performance", "profiling", "node"], summaryFromReadme: "Node.js performance profiler with flame graph visualization.", lastCommitSha: "y7z8a9b0", signals: { stars: 521, forks: 103, recentCommits: 45 }, claimStatus: "unclaimed" },
];

/** Sync — returns the static seed data with default 'unclaimed' status. */
export function crawlPublicSources(): CrawledRepo[] {
  return MOCK_REPOS.map((r) => ({ ...r }));
}

/** Async — returns seed data merged with persisted claim status from DB. */
export async function crawlPublicSourcesWithStatus(): Promise<CrawledRepo[]> {
  const rows = await db.select().from(crawlClaims);
  const statusMap = new Map(rows.map((r) => [r.repoUrl, r.status]));
  return MOCK_REPOS.map((r) => ({
    ...r,
    claimStatus: statusMap.get(r.repoUrl) ?? r.claimStatus,
  }));
}

export async function markUnclaimed(repoUrl: string): Promise<void> {
  await db
    .insert(crawlClaims)
    .values({ repoUrl, status: "unclaimed" })
    .onConflictDoNothing();
}

export async function updateClaimStatus(repoUrl: string, status: ClaimStatus): Promise<void> {
  await db
    .insert(crawlClaims)
    .values({ repoUrl, status, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: crawlClaims.repoUrl,
      set: { status, updatedAt: new Date() },
    });
}

export async function getClaimStatus(repoUrl: string): Promise<ClaimStatus> {
  const [row] = await db.select().from(crawlClaims).where(eq(crawlClaims.repoUrl, repoUrl));
  return row?.status ?? "unclaimed";
}

// Test-only.
export async function _resetClaims(): Promise<void> {
  await db.delete(crawlClaims);
}
