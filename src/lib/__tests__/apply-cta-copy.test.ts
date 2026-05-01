import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Apply CTA — 知恵を貸す（参加する） — Friendly Tone", () => {
  const src = readFileSync(
    join(ROOT, "src/components/PlugInApply.tsx"),
    "utf-8",
  );

  it("primary CTA reads 「この知恵を貸す（参加する）」 with the matching aria-label", () => {
    expect(src).toContain('aria-label="この知恵を貸す"');
    expect(src).toContain("この知恵を貸す（参加する）");
    expect(src).toContain('"参加中..."');
  });

  it("retires the previous-iteration aria-label CTAs", () => {
    expect(src).not.toMatch(/aria-label="知能をプラグインする"/);
    expect(src).not.toMatch(/aria-label="案件に参画する"/);
    expect(src).not.toMatch(/aria-label="エージェントをデプロイ"/);
    expect(src).not.toMatch(/aria-label="この案件に応募する"/);
  });

  it("Plugged-in state reads 「貸出中（参加中）」 with CheckCircle2", () => {
    expect(src).toContain("貸出中（参加中）");
    expect(src).toContain('aria-label="貸出中"');
    expect(src).toMatch(/<CheckCircle2\b/);
  });

  it("uses the lucide Plug icon (and CheckCircle2 in the lent state)", () => {
    expect(src).toContain('import { Plug, CheckCircle2 } from "lucide-react"');
    expect(src).toMatch(/<Plug\b/);
  });

  it("MD pre-select label reads 「この知恵で参加します」 and the picker stays read-only", () => {
    expect(src).toContain("この知恵で参加します");
    expect(src).toContain('data-testid="apply-readonly-md"');
    expect(src).not.toMatch(/<select\b/);
  });

  it("subcaption beneath the CTA reads the friendly help line", () => {
    expect(src).toContain("あなたの知恵が、企業のお困りごとを助けます");
  });

  it("modal heading and body use the friendly tone", () => {
    expect(src).toContain("選ばれました！");
    expect(src).toContain(
      "あなたの知恵のカードを、お困りごとに貸し出しました",
    );
    expect(src).toContain("使われた分だけお礼が届きます");
    expect(src).toContain("参加状況を見る");
  });
});
