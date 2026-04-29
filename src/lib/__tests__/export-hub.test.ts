import { describe, it, expect, beforeEach } from "vitest";
import { resolvePrice, USD_PREMIUM, SAMPLE_INPUTS } from "@/lib/dynamic-pricing";
import { translateForAgent, TRANSLATION_DICT } from "@/lib/translator";
import {
  enableBlackbox,
  setVisibility,
  getVisibility,
  filterGetResponse,
  isBodyVisible,
  isExecutionAllowed,
  _resetBlackbox,
} from "@/lib/blackbox";
import { appendEdge, getLedger, _resetLedger } from "@/lib/dep-ledger";

// ─── dynamic-pricing ─────────────────────────────────────────────────────────

describe("dynamic-pricing", () => {
  it("Japan IP returns JPY with multiplier 1.0", () => {
    const result = resolvePrice({ ip: "122.20.1.1", authToken: "gld_abc", floorPriceJpy: 1000 });
    expect(result.currency).toBe("JPY");
    expect(result.multiplier).toBe(1.0);
    expect(result.floorPriceLocal).toBe(1000);
    expect(result.reasoning).toContain("JPY");
  });

  it("global IP returns USD with 1.2x premium", () => {
    const result = resolvePrice({ ip: "54.240.1.1", authToken: "gld_us_abc", floorPriceJpy: 1500 });
    expect(result.currency).toBe("USD");
    expect(result.multiplier).toBe(USD_PREMIUM);
    expect(result.multiplier).toBe(1.2);
    expect(result.floorPriceLocal).toBeCloseTo(12.0, 0);
  });

  it("all 4 SAMPLE_INPUTS return valid PricingResult", () => {
    for (const { input } of SAMPLE_INPUTS) {
      const result = resolvePrice(input);
      expect(["JPY", "USD"]).toContain(result.currency);
      expect(result.multiplier).toBeGreaterThan(0);
      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.floorPriceLocal).toBeGreaterThanOrEqual(0);
    }
    // Japan-auth token also resolves to JPY
    const japanAuth = resolvePrice({ ip: "8.8.8.8", authToken: "gld_JP_secret" });
    expect(japanAuth.currency).toBe("JPY");
  });
});

// ─── translator ──────────────────────────────────────────────────────────────

describe("translator", () => {
  it("is deterministic for the same input", () => {
    const md = "請求書の自動化。データ処理と分析。エラー対応。";
    const meta = { title: "テストノート", rank: "A" };
    const a = translateForAgent(md, meta);
    const b = translateForAgent(md, meta);
    expect(a.english).toBe(b.english);
    expect(a.summary60w).toBe(b.summary60w);
    expect(a.version).toBe("v1");
  });

  it("generates JSON Schema with input and output fields", () => {
    const md = "請求書の処理を自動化するスクリプト。JSON入力を受け取り結果を出力。";
    const { schema } = translateForAgent(md, { title: "Invoice Processor", rank: "B" });
    expect(schema.input).toBeDefined();
    expect(schema.output).toBeDefined();
    expect(typeof schema.input.type).toBe("string");
  });

  it("summary60w contains at most 60 words", () => {
    const longMd = "請求書の自動化。".repeat(20);
    const { summary60w } = translateForAgent(longMd, { title: "Long", rank: "A" });
    const words = summary60w.split(/\s+/).filter(Boolean);
    expect(words.length).toBeLessThanOrEqual(60);
    expect(TRANSLATION_DICT.length).toBeGreaterThanOrEqual(30);
  });
});

// ─── blackbox ────────────────────────────────────────────────────────────────

describe("blackbox", () => {
  beforeEach(() => {
    _resetBlackbox();
    _resetLedger();
  });

  it("GET response excludes mdBody and source in blackbox mode", () => {
    enableBlackbox("GUILD:TEST001");
    const data = {
      guildId: "GUILD:TEST001",
      title: "Secret Note",
      mdBody: "confidential content",
      source: "https://github.com/secret/repo",
      rank: "A",
    };
    const filtered = filterGetResponse("GUILD:TEST001", data);
    expect(filtered.guildId).toBe("GUILD:TEST001");
    expect(filtered.title).toBe("Secret Note");
    expect(filtered.rank).toBe("A");
    expect("mdBody" in filtered).toBe(false);
    expect("source" in filtered).toBe(false);
  });

  it("POST execution is always permitted regardless of visibility mode", () => {
    enableBlackbox("GUILD:TEST002");
    expect(isExecutionAllowed("GUILD:TEST002")).toBe(true);
    expect(isExecutionAllowed("GUILD:TEST003")).toBe(true); // open mode
  });

  it("visibility toggle: open → api-only → blackbox → open", () => {
    const id = "GUILD:TEST004";
    expect(getVisibility(id)).toBe("open");

    setVisibility(id, "api-only");
    expect(getVisibility(id)).toBe("api-only");
    expect(isBodyVisible(id)).toBe(false);

    setVisibility(id, "blackbox");
    expect(getVisibility(id)).toBe("blackbox");

    setVisibility(id, "open");
    expect(getVisibility(id)).toBe("open");
    expect(isBodyVisible(id)).toBe(true);
  });

  it("blackbox does not affect dep-ledger — lineage remains intact", () => {
    enableBlackbox("GUILD:TEST005");

    appendEdge({ child: "GUILD:TEST005", parent: "GUILD:PARENT", kind: "cite" });
    expect(getLedger().length).toBe(1);
    expect(getLedger()[0].child).toBe("GUILD:TEST005");

    // Blackbox is a separate store — lineage is untouched
    expect(getVisibility("GUILD:TEST005")).toBe("blackbox");
    expect(getLedger().length).toBe(1);
  });
});
