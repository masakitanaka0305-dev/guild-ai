import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildHonestNotificationStack,
  makeWeeklySummary,
  makeRoyaltySettled,
  makeEnterpriseInterest,
  FOMO_BANNED_PHRASES,
} from "@/lib/notifications/honest-events";

const ROOT = process.cwd();

describe("Cinematic Mint (#128) — notification honesty", () => {
  it("buildHonestNotificationStack returns a deterministic 3-event stack", () => {
    const a = buildHonestNotificationStack("user-a");
    const b = buildHonestNotificationStack("user-a");
    expect(a).toHaveLength(3);
    expect(a[0].type).toBe("weekly_summary");
    expect(a[1].type).toBe("royalty_settled");
    expect(a[2].type).toBe("enterprise_interest");
    // Deterministic
    expect(a.map((n) => n.id)).toEqual(b.map((n) => n.id));
  });

  it("weekly summary references concrete past-week earnings", () => {
    const n = makeWeeklySummary("user-a", 3420, new Date("2026-04-27T09:00:00.000Z"));
    expect(n.message).toContain("先週、あなたの知恵は");
    expect(n.message).toContain("¥3,420");
    expect(n.attribution.amountJpy).toBe(3420);
    expect(n.type).toBe("weekly_summary");
  });

  it("royalty notification anchors to a tx id and the actual amount", () => {
    const n = makeRoyaltySettled("tx_demo_001", 84, "2026-04-30T11:24:00.000Z");
    expect(n.id).toBe("royalty_tx_demo_001");
    expect(n.message).toContain("¥84");
    expect(n.message).toContain("入金されました");
    expect(n.attribution.refId).toBe("tx_demo_001");
  });

  it("enterprise interest names a concrete counterparty + asset title", () => {
    const n = makeEnterpriseInterest(
      "user-a",
      "md_demo",
      "2026-05-01T08:10:00.000Z",
    );
    expect(n.message).toMatch(/.+があなたの『.+』に注目しています。/);
    expect(n.attribution.label.length).toBeGreaterThan(0);
  });

  it("none of the FOMO phrases appear in honest copy", () => {
    const stack = buildHonestNotificationStack("user-a");
    const blob = stack.map((n) => `${n.title}|${n.message}`).join("\n");
    for (const banned of FOMO_BANNED_PHRASES) {
      expect(blob).not.toContain(banned);
    }
  });

  it("UI sources never use 急騰 / 価値が N% 上昇 in user-facing copy", () => {
    function walk(dir: string, out: string[] = []): string[] {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name === "__tests__") continue;
          walk(full, out);
        } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
          out.push(full);
        }
      }
      return out;
    }
    const files = [
      ...walk(join(ROOT, "src/app")),
      ...walk(join(ROOT, "src/components")),
    ];
    const offenders: string[] = [];
    const re = /急騰|暴落|値動き|\d+\s*%\s*(?:上昇|急騰)/;
    for (const f of files) {
      const c = readFileSync(f, "utf-8");
      if (re.test(c)) offenders.push(f.split("src/")[1] ?? f);
    }
    expect(
      offenders,
      `FOMO copy detected in: ${offenders.join(", ")}`,
    ).toHaveLength(0);
  });
});
