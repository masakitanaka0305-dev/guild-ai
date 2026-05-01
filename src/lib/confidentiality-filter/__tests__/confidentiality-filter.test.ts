import { describe, it, expect } from "vitest";
import { maskForEnterprise, REDACTION_TOKEN } from "@/lib/confidentiality-filter";

describe("confidentiality-filter: maskForEnterprise", () => {
  it("masks emails, phones, Japanese full names, and dictionary entries", () => {
    const md =
      "問い合わせ: foo.bar@example.co.jp / 03-1234-5678 / +81 90-1111-2222\n" +
      "担当: 田中 雅基 (Acme Robotics 社)\n";
    const r = maskForEnterprise(md, { companies: ["Acme Robotics"] });
    expect(r.text).not.toContain("foo.bar@example.co.jp");
    expect(r.text).not.toContain("03-1234-5678");
    expect(r.text).not.toContain("田中 雅基");
    expect(r.text).not.toContain("Acme Robotics");
    expect(r.text).toContain(REDACTION_TOKEN);
    // At least 4 redactions: email, two phones, name, company
    expect(r.redactionCount).toBeGreaterThanOrEqual(4);
  });

  it("preserves non-sensitive content (titles, plain text, code blocks)", () => {
    const md =
      "# 設計ノート\n本文の中身。\n```ts\nfunction hello() { return 1; }\n```\n";
    const r = maskForEnterprise(md);
    expect(r.text).toContain("# 設計ノート");
    expect(r.text).toContain("本文の中身。");
    expect(r.text).toContain("function hello()");
    expect(r.redactionCount).toBe(0);
  });
});
