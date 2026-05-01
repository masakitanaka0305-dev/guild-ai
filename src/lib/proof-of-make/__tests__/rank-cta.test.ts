import { describe, it, expect } from "vitest";
import { rankCardCta, condense, prettifyAuditReason } from "@/lib/proof-of-make";

describe("rankCardCta — Mercari Lightness (#126)", () => {
  it("returns the rank-aware 「金/銀/銅/みならい カードにする」 CTA", () => {
    expect(rankCardCta("S")).toBe("金の太鼓判カードにする");
    expect(rankCardCta("A")).toBe("銀の太鼓判カードにする");
    expect(rankCardCta("B")).toBe("銅の太鼓判カードにする");
    expect(rankCardCta("D")).toBe("みならいカードにする");
  });
});

describe("condense — sentence-aware halving", () => {
  it("returns the original when shorter than the limit", () => {
    expect(condense("短い本文。", 0.5)).toBe("短い本文。");
  });

  it("trims to a sentence boundary within the cap", () => {
    const md = "ここがポイントです。次の段落は長い説明が続きます。さらにもう一文。";
    const out = condense(md, 0.5);
    expect(out.length).toBeLessThan(md.length);
    expect(out.endsWith("。") || out.endsWith("…")).toBe(true);
  });

  it("falls back to ellipsis when no sentence boundary fits", () => {
    const md = "あいうえおかきくけこさしすせそたちつてとなにぬねの";
    const out = condense(md, 0.3);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("prettifyAuditReason — friendly translations for ai-auditor strings", () => {
  it("rewrites well-known reason strings to plain language", () => {
    expect(prettifyAuditReason("思考密度: 80")).toBe("プロの技術が詰まっています");
    expect(prettifyAuditReason("uptime 30 days")).toBe("安定して動き続けています");
    expect(prettifyAuditReason("intent signals: 3")).toBe("実装の意図が明確です");
    expect(prettifyAuditReason("実稼働コード不足")).toBe("実際に動くコードが入っています");
    expect(prettifyAuditReason("テスト証跡あり")).toBe("テストや検証の跡が残っています");
  });

  it("passes unrecognised reasons through verbatim", () => {
    expect(prettifyAuditReason("謎の理由")).toBe("謎の理由");
  });
});
