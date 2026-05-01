import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getSRankLeaderboard, LEADERBOARD_S } from "@/lib/leaderboard";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("/leaderboard — Hall of Fame", () => {
  it("S-rank leaderboard has exactly 10 entries and only S ranks", () => {
    const entries = getSRankLeaderboard();
    expect(entries).toHaveLength(10);
    for (const e of entries) {
      expect(e.rank).toBe("S");
    }
    // Same source ledger as LEADERBOARD_S (no copy drift)
    expect(entries).toBe(LEADERBOARD_S);
  });

  it("entries are ordered by cumulativeJpy descending", () => {
    const entries = getSRankLeaderboard();
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].cumulativeJpy).toBeLessThanOrEqual(entries[i - 1].cumulativeJpy);
    }
  });

  it("page renders the 伝説の知能ギルド header and links each entry to /profile/[handle]", () => {
    const src = read("src/app/leaderboard/page.tsx");
    expect(src).toContain("伝説の知能ギルド");
    expect(src).toContain("Hall of Fame");
    expect(src).toContain('aria-label="S ランク保持者リスト"');
    expect(src).toMatch(/href=\{`\/profile\/\$\{e\.handle\}`\}/);
    // Cyan metric-prime cumulative number on each row
    expect(src).toContain("text-brand-primary metric-prime");
    // S-color hex pin (#FBBF24) on each row
    expect(src).toContain("#FBBF24");
  });

  it("AppShell exposes a 伝説 link to /leaderboard from the desktop footer band", () => {
    const src = read("src/components/AppShell.tsx");
    expect(src).toMatch(/href="\/leaderboard"/);
    expect(src).toContain('data-testid="legend-link"');
    expect(src).toContain("伝説 →");
  });
});
