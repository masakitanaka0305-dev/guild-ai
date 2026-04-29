// GUILD AI — Seed initial users referenced by existing data
// (creator-001..006 from MOCK_MARKETPLACE + demo-user used in purchaseAction).
// Idempotent: re-running is safe (onConflictDoNothing).
// Run with: npm run db:seed:users

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(?:"([^"]*)"|(.*))\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2] ?? m[3] ?? "";
}

async function main() {
  const { db } = await import("../src/db/client");
  const { users } = await import("../src/db/schema");
  const { hashPassword } = await import("../src/lib/auth");

  // Seed user records for creators of MOCK_MARKETPLACE listings + demo-user.
  // password = "demo-password" (only meaningful in dev — these accounts are
  // not for real authentication, only to satisfy FK constraints).
  const fixtures: Array<{ id: string; email: string; displayName: string }> = [
    { id: "creator-001", email: "creator-001@example.com", displayName: "AIコード補完エンジン作者" },
    { id: "creator-002", email: "creator-002@example.com", displayName: "自然言語SQLジェネレーター作者" },
    { id: "creator-003", email: "creator-003@example.com", displayName: "マルチモーダル検索SDK作者" },
    { id: "creator-004", email: "creator-004@example.com", displayName: "ドキュメント自動生成ツール作者" },
    { id: "creator-005", email: "creator-005@example.com", displayName: "データクリーニング作者" },
    { id: "creator-006", email: "creator-006@example.com", displayName: "CSV→JSONコンバーター作者" },
    { id: "demo-user",   email: "demo-user@example.com",   displayName: "デモユーザー" },
  ];

  console.log(`→ Seeding ${fixtures.length} users into Neon...`);
  const sharedHash = await hashPassword("demo-password");

  for (const fx of fixtures) {
    const inserted = await db
      .insert(users)
      .values({
        id: fx.id,
        email: fx.email,
        passwordHash: sharedHash,
        displayName: fx.displayName,
      })
      .onConflictDoNothing()
      .returning({ id: users.id });
    const status = inserted.length ? "INSERTED" : "skipped (exists)";
    console.log(`  ${status.padEnd(18)} ${fx.id} <${fx.email}>`);
  }

  console.log("\n✓ User seed complete");
}

main().catch((err) => {
  console.error("✗ User seed FAILED:", err);
  process.exit(1);
});
