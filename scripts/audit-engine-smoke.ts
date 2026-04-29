// GUILD AI — Audit Engine v1-v4 smoke test
// Run with: npx tsx scripts/audit-engine-smoke.ts

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(?:"([^"]*)"|(.*))\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2] ?? m[3] ?? "";
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

const HIGH_QUALITY_MD = `# Postgres lock 取得順序の罠

## 要約

複数の row を update する際、ロック取得順序が一致していないと
deadlock が発生する。本ノートでは 3 つの典型パターンと対処法を示す。

## 典型パターン

### パターン 1: 異なる order での update

\`\`\`sql
-- session A
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- session B (同時実行)
UPDATE accounts SET balance = balance - 100 WHERE id = 2;
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
\`\`\`

**症状**: \`ERROR: deadlock detected\`
**原因**: A が id=1 ロック、B が id=2 ロック → 互いに相手のロック待ち
**対処**: 常に id 昇順で update する。具体例:

\`\`\`sql
-- 正しい順序
UPDATE accounts SET balance = balance - 100 WHERE id = LEAST(1, 2);
UPDATE accounts SET balance = balance + 100 WHERE id = GREATEST(1, 2);
\`\`\`

実測: 1000 並列接続で deadlock 発生率 12% → 0% に。
出典: PR #456, commit 7a3f9d2

### パターン 2: SELECT FOR UPDATE と DML の競合

省略 (失敗ケース 5 件あり)

## 落とし穴

- 失敗例：同じ table を異なる WHERE 条件でロックすると、Postgres は
  どの順序で取るか保証しない
- 罠：ORM が SQL を再順序することがある（Drizzle の preserve order: false）

## 検証手順

1. \`pgbench -c 100 -T 60 -f deadlock-repro.sql\`
2. ログ確認: \`grep "deadlock detected" postgres.log\`
3. 期待結果: count >= 50 (修正前) / count == 0 (修正後)

## バージョン

PostgreSQL 16.2 で確認 (commit a1b2c3d)
`;

const LOW_QUALITY_MD = `# Database のベストプラクティス

データベースは重要です。設計が大切です。

## 一般的に

通常はインデックスを貼るのが良いとされています。
基本的にトランザクションを使うことが大切です。

## まとめ

データベースは重要です。設計が大切です。基本的に注意しましょう。
`;

async function main() {
  const { auditMd } = await import("../src/lib/ai-auditor/engine");
  const { db } = await import("../src/db/client");
  const { listings, users, authorReputation, auditResultsHistory } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const { hashPassword } = await import("../src/lib/auth");
  const v4 = await import("../src/lib/ai-auditor/v4-primitives");

  const HIGH_ID = "smoke-audit-high-" + Date.now();
  const LOW_ID = "smoke-audit-low-" + Date.now();
  const AUTHOR_ID = "smoke-author-" + Date.now();

  // Seed user fixture for FK (author_reputation references users)
  console.log("→ seed user fixture");
  await db.insert(users).values({
    id: AUTHOR_ID,
    email: `${AUTHOR_ID}@example.com`,
    passwordHash: await hashPassword("smoke-test"),
    displayName: "Smoke Author",
  }).onConflictDoNothing();

  // Seed listings (FK satisfaction)
  console.log("→ seed listing fixtures");
  for (const id of [HIGH_ID, LOW_ID]) {
    await db.insert(listings).values({
      id,
      ownerId: AUTHOR_ID,
      title: id,
      description: "audit smoke",
      ccaf: { intentSignals: [], thoughtDensity: 50, iterations: 1, authorId: AUTHOR_ID, createdAt: new Date().toISOString() },
      vercelUptimeDays: 0,
      basePrice: 1000,
      rank: "B",
      floorPrice: 1000,
    });
  }

  try {
    // 1. High-quality MD scores well
    console.log("→ [1] audit high-quality MD");
    const high = await auditMd({
      mdId: HIGH_ID,
      mdContent: HIGH_QUALITY_MD,
      authorId: AUTHOR_ID,
      trigger: "initial-static",
      postedAt: new Date(),
    });
    console.log(`    rank=${high.rank}, score=${high.score}, sub=[${high.subRanks.join(",")}]`);
    console.log(`    dimensions:`, Object.entries(high.dimensions).map(([k, v]) => `${k}:${v.score}`).join(", "));
    assert(high.rank === "S" || high.rank === "A", `expected S or A for high-quality, got ${high.rank}`);
    assert(high.dimensions.failure_coverage.score >= 50, "high-quality should have failure coverage");
    assert(high.dimensions.verifiability.score >= 50, "high-quality should have verifiability");

    // 2. Low-quality MD scores low
    console.log("→ [2] audit low-quality MD");
    const low = await auditMd({
      mdId: LOW_ID,
      mdContent: LOW_QUALITY_MD,
      authorId: AUTHOR_ID,
      trigger: "initial-static",
      postedAt: new Date(),
    });
    console.log(`    rank=${low.rank}, score=${low.score}`);
    console.log(`    dimensions:`, Object.entries(low.dimensions).map(([k, v]) => `${k}:${v.score}`).join(", "));
    assert(low.rank === "B" || low.rank === "C", `expected B or C for low-quality, got ${low.rank}`);
    assert(low.dimensions.originality.score < 50, "low-quality should have low originality");

    // 3. History recorded
    console.log("→ [3] audit history is persisted");
    const history = await db.select().from(auditResultsHistory).where(eq(auditResultsHistory.mdId, HIGH_ID));
    assert(history.length === 1, `expected 1 history row, got ${history.length}`);
    assert(history[0].rank === high.rank, "history rank matches");

    // 4. v4: equity tokens initialize
    console.log("→ [4] equity tokens init");
    await v4.initializeEquity(HIGH_ID, AUTHOR_ID);
    const holders = await v4.getEquityHolders(HIGH_ID);
    assert(holders.length === 2, "2 holders (author + reserve)");
    const author = holders.find((h) => h.holderId === AUTHOR_ID);
    assert(author?.shares === 700, "author has 700 shares");

    // 5. v4: stake placement
    console.log("→ [5] stake placement");
    const stakeId = await v4.placeStake({
      mdId: HIGH_ID, stakerId: "smoke-curator", position: "promote",
      predictedRank: "S", amountJpyc: 1000,
    });
    assert(stakeId.startsWith("stake-"), "stake id format");
    const stakes = await v4.getStakesByMd(HIGH_ID);
    assert(stakes.length === 1, "1 stake recorded");

    // 6. v4: stake resolution
    console.log("→ [6] stake resolution");
    const resolved = await v4.resolveStakes(HIGH_ID, "S");
    assert(resolved.winners + resolved.losers === 1, "1 stake resolved");

    // 7. v4: challenge creation
    console.log("→ [7] challenge");
    const chalId = await v4.createChallenge({
      mdId: LOW_ID, challengerId: "smoke-challenger",
      originalRank: low.rank, proposedRank: "S", bondJpyc: 5000,
      reason: "I think this is better than rated",
    });
    assert(chalId.startsWith("chal-"), "challenge id format");
    const open = await v4.getOpenChallenges(LOW_ID);
    assert(open.length === 1, "1 open challenge");

    // 8. v4: citations
    console.log("→ [8] citation graph");
    await v4.recordCitation(HIGH_ID, LOW_ID, 80, "author-declared");
    const cited = await v4.getCitedBy(LOW_ID);
    assert(cited.length === 1, "1 citation recorded");

    // 9. v4: negative flag
    console.log("→ [9] negative flag");
    const flagId = await v4.flagMd({
      mdId: LOW_ID, flaggerId: "smoke-flagger", flagType: "stale", bondJpyc: 500,
    });
    assert(flagId.startsWith("flag-"), "flag id format");

    // 10. v4: author reputation
    console.log("→ [10] author reputation");
    const repScore = await v4.upsertAuthorReputation(AUTHOR_ID, {
      historical_S_rate: 0.6, refund_rate: 0.05, update_continuity: 0.8,
      repeat_buyer_rate: 0.3, peer_endorsement: 0.4, report_rate: 0.02,
    });
    assert(repScore > 50 && repScore < 100, `rep score in range: ${repScore}`);

    console.log("\n✓ Audit Engine v1-v4 smoke PASSED — all 10 scenarios OK");
  } finally {
    console.log("\n→ cleanup");
    await db.delete(auditResultsHistory).where(eq(auditResultsHistory.mdId, HIGH_ID));
    await db.delete(auditResultsHistory).where(eq(auditResultsHistory.mdId, LOW_ID));
    for (const id of [HIGH_ID, LOW_ID]) {
      await db.delete(listings).where(eq(listings.id, id));
    }
    await db.delete(authorReputation).where(eq(authorReputation.userId, AUTHOR_ID));
    await db.delete(users).where(eq(users.id, AUTHOR_ID));
  }
}

main().catch((err) => {
  console.error("✗ Audit Engine smoke FAILED:", err);
  process.exit(1);
});
