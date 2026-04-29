import { describe, it, expect } from "vitest";
import { generateSchemas, toOpenApiSpec } from "@/lib/schema-generator";
import { getBacktestStats, formatSamples } from "@/lib/backtest";
import { proSearch, DEFAULT_FILTERS } from "@/lib/pro-search";

// ─── schema-generator ────────────────────────────────────────────────────────

describe("schema-generator", () => {
  it("PDF keyword → input has file property with base64 encoding", () => {
    const { input } = generateSchemas("PDFを処理するスクリプト", { title: "PDF Tool", rank: "A" });
    expect(input.properties?.file?.contentEncoding).toBe("base64");
    expect(input.properties?.file?.contentMediaType).toBe("application/pdf");
  });

  it("URL keyword → input has url property with uri format", () => {
    const { input } = generateSchemas("URLから情報を抽出する", { title: "URL Extractor", rank: "B" });
    expect(input.properties?.url?.format).toBe("uri");
  });

  it("JSON keyword → output has fields array and data object", () => {
    const { output } = generateSchemas("JSONを解析して構造化", { title: "JSON Parser", rank: "S" });
    expect(output.properties?.fields?.type).toBe("array");
    expect(output.properties?.data?.type).toBe("object");
  });

  it("default (no keywords) → query input + result output + 2 deterministic examples", () => {
    const schemas = generateSchemas("汎用スクリプト", { title: "Generic", rank: "B" });
    expect(schemas.input.properties?.query).toBeDefined();
    expect(schemas.output.properties?.result).toBeDefined();
    expect(schemas.examples).toHaveLength(2);
    // Determinism
    const schemas2 = generateSchemas("汎用スクリプト", { title: "Generic", rank: "B" });
    expect(schemas.examples[0].input).toEqual(schemas2.examples[0].input);
  });
});

// ─── backtest ────────────────────────────────────────────────────────────────

describe("backtest", () => {
  it("getBacktestStats is deterministic for the same guildId", () => {
    const s1 = getBacktestStats("listing_001");
    const s2 = getBacktestStats("listing_001");
    expect(s1.accuracyPct).toBe(s2.accuracyPct);
    expect(s1.avgLatencyMs).toBe(s2.avgLatencyMs);
  });

  it("monthlyTrend has exactly 12 values all within 70–100", () => {
    const { monthlyTrend } = getBacktestStats("listing_002");
    expect(monthlyTrend).toHaveLength(12);
    monthlyTrend.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(70);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it("all stats are within expected ranges", () => {
    const s = getBacktestStats("listing_003");
    expect(s.accuracyPct).toBeGreaterThanOrEqual(82);
    expect(s.accuracyPct).toBeLessThanOrEqual(99.5);
    expect(s.errorRatePct).toBeGreaterThanOrEqual(0);
    expect(s.errorRatePct).toBeLessThan(5);
    expect(s.p95LatencyMs).toBeGreaterThan(s.avgLatencyMs);
  });
});

// ─── pro-search ──────────────────────────────────────────────────────────────

describe("pro-search", () => {
  it("empty query with no filters returns up to 5 results", () => {
    const results = proSearch("", DEFAULT_FILTERS, "accuracy");
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it("results are deterministic for the same query+filters", () => {
    const r1 = proSearch("PDF 請求書", DEFAULT_FILTERS, "accuracy");
    const r2 = proSearch("PDF 請求書", DEFAULT_FILTERS, "accuracy");
    expect(r1.map((r) => r.assetId)).toEqual(r2.map((r) => r.assetId));
  });

  it("accuracy sort: first result has highest accuracyPct", () => {
    const results = proSearch("", DEFAULT_FILTERS, "accuracy");
    if (results.length < 2) return;
    expect(results[0].accuracyPct).toBeGreaterThanOrEqual(results[1].accuracyPct);
  });

  it("latency sort: first result has lowest avgLatencyMs", () => {
    const results = proSearch("", DEFAULT_FILTERS, "latency");
    if (results.length < 2) return;
    expect(results[0].avgLatencyMs).toBeLessThanOrEqual(results[1].avgLatencyMs);
  });

  it("cost sort: first result has lowest floorPrice", () => {
    const results = proSearch("", DEFAULT_FILTERS, "cost");
    if (results.length < 2) return;
    expect(results[0].floorPrice).toBeLessThanOrEqual(results[1].floorPrice);
  });
});
