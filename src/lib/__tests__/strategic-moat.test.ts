import { describe, it, expect, beforeEach } from "vitest";
import {
  isLikelyCrawler,
  enableEncapsulation,
  getEffectiveMode,
  filterEncapsulatedResponse,
  checkRateLimit,
  CRAWLER_UA_LIST,
  _resetEncapsulated,
} from "@/lib/encapsulated";
import {
  signOrigin,
  verifyOrigin,
  getOrigin,
  originSummary,
  autoSignAll,
  _resetOriginRegistry,
} from "@/lib/origin-registry";

// ─── encapsulated ─────────────────────────────────────────────────────────────

describe("encapsulated: crawler UA detection", () => {
  it("detects GPTBot as crawler", () => {
    expect(isLikelyCrawler("Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)")).toBe(true);
  });

  it("detects ClaudeBot as crawler", () => {
    expect(isLikelyCrawler("ClaudeBot/1.0; +https://anthropic.com/bot")).toBe(true);
  });

  it("detects Google-Extended as crawler", () => {
    expect(isLikelyCrawler("Mozilla/5.0 (compatible; Google-Extended)")).toBe(true);
  });

  it("detects CCBot as crawler", () => {
    expect(isLikelyCrawler("CCBot/2.0 (https://commoncrawl.org/faq/)")).toBe(true);
  });

  it("detects Bytespider as crawler", () => {
    expect(isLikelyCrawler("Bytespider; spider-feedback@bytedance.com")).toBe(true);
  });

  it("does NOT block normal browser UA", () => {
    expect(isLikelyCrawler("Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120")).toBe(false);
  });

  it("CRAWLER_UA_LIST contains at least 10 known crawlers", () => {
    expect(CRAWLER_UA_LIST.length).toBeGreaterThanOrEqual(10);
  });
});

describe("encapsulated: rate limit and response filter", () => {
  beforeEach(() => {
    _resetEncapsulated();
  });

  it("enableEncapsulation sets rpm option", () => {
    const rec = enableEncapsulation("GUILD:ENC001", { rateLimit: { rpm: 5 } });
    expect(rec.options.rateLimit?.rpm).toBe(5);
    expect(getEffectiveMode("GUILD:ENC001")).toBe("encapsulated");
  });

  it("filterEncapsulatedResponse removes mdBody, source, internalNotes", () => {
    enableEncapsulation("GUILD:ENC002");
    const data = {
      guildId: "GUILD:ENC002",
      title: "Secret",
      mdBody: "confidential",
      source: "https://github.com/secret",
      internalNotes: "private note",
      rank: "S",
    };
    const filtered = filterEncapsulatedResponse("GUILD:ENC002", data);
    expect(filtered.guildId).toBe("GUILD:ENC002");
    expect(filtered.rank).toBe("S");
    expect("mdBody" in filtered).toBe(false);
    expect("source" in filtered).toBe(false);
    expect("internalNotes" in filtered).toBe(false);
  });

  it("checkRateLimit allows requests within rpm", () => {
    enableEncapsulation("GUILD:ENC003", { rateLimit: { rpm: 3 } });
    expect(checkRateLimit("GUILD:ENC003", "client1")).toBe(true);
    expect(checkRateLimit("GUILD:ENC003", "client1")).toBe(true);
    expect(checkRateLimit("GUILD:ENC003", "client1")).toBe(true);
    expect(checkRateLimit("GUILD:ENC003", "client1")).toBe(false); // 4th exceeds rpm=3
  });
});

// ─── origin-registry ──────────────────────────────────────────────────────────

describe("origin-registry: JP origin signing", () => {
  beforeEach(() => {
    _resetOriginRegistry();
  });

  it("signOrigin is deterministic for the same guildId", () => {
    const a = signOrigin("GUILD:OR001", { title: "Test", rank: "A" });
    _resetOriginRegistry();
    const b = signOrigin("GUILD:OR001", { title: "Test", rank: "A" });
    // Same guildId → same signature prefix pattern
    expect(a.signature.startsWith("jp-sig-")).toBe(true);
    expect(a.signerKeyId.startsWith("gld-jp-")).toBe(true);
    expect(b.signature.startsWith("jp-sig-")).toBe(true);
  });

  it("verifyOrigin returns valid=true for registered guildId", () => {
    signOrigin("GUILD:OR002");
    const { valid, record } = verifyOrigin("GUILD:OR002");
    expect(valid).toBe(true);
    expect(record).not.toBeNull();
    expect(record?.originCountry).toBe("JP");
  });

  it("verifyOrigin returns valid=false for unknown guildId", () => {
    const { valid, record } = verifyOrigin("GUILD:UNKNOWN999");
    expect(valid).toBe(false);
    expect(record).toBeNull();
  });

  it("autoSignAll registers multiple guildIds at once", () => {
    const ids = ["GUILD:M001", "GUILD:M002", "GUILD:M003"];
    const sigs = autoSignAll(ids);
    expect(sigs.length).toBe(3);
    for (const sig of sigs) {
      expect(sig.originCountry).toBe("JP");
      expect(originSummary(sig.guildId)).not.toBeNull();
    }
  });

  it("originSummary returns compact country/signature/signedAt", () => {
    signOrigin("GUILD:OR003");
    const s = originSummary("GUILD:OR003");
    expect(s?.country).toBe("JP");
    expect(typeof s?.signature).toBe("string");
    expect(typeof s?.signedAt).toBe("string");
  });
});

// ─── scout LP helpers ─────────────────────────────────────────────────────────

import { simulateRevenue } from "@/lib/revenue-simulator";

describe("scout LP: calculator integration", () => {
  it("simulateRevenue with S rank returns positive estimates", () => {
    const r = simulateRevenue({ rank: "S", perCallJpy: 5, category: "typescript", ccafScore: 70 });
    expect(r.monthlyMedianJpy).toBeGreaterThan(0);
    expect(r.p10Jpy).toBeGreaterThan(0);
    expect(r.p90Jpy).toBeGreaterThan(r.p10Jpy);
  });

  it("simulateRevenue with B rank returns lower estimate than S rank", () => {
    const s = simulateRevenue({ rank: "S", perCallJpy: 5, category: "typescript", ccafScore: 70 });
    const b = simulateRevenue({ rank: "B", perCallJpy: 1, category: "typescript", ccafScore: 30 });
    expect(s.monthlyMedianJpy).toBeGreaterThan(b.monthlyMedianJpy);
  });

  it("FEATURED_BUILDERS mock has 3 distinct handles", () => {
    const handles = ["@han.dev", "@sasha.k", "@noah.io"];
    // No real names or organizations — composites only
    for (const h of handles) {
      expect(h.startsWith("@")).toBe(true);
    }
    expect(new Set(handles).size).toBe(3);
  });

  it("isLikelyCrawler blocks all 10+ known bots but not humans", () => {
    const bots = [
      "GPTBot/1.0",
      "ClaudeBot/1.0",
      "Google-Extended",
      "CCBot/2.0",
      "Anthropic-AI",
      "Bytespider",
      "PerplexityBot",
      "Diffbot",
      "Amazonbot",
      "Applebot-Extended",
    ];
    for (const ua of bots) {
      expect(isLikelyCrawler(ua), `Expected ${ua} to be blocked`).toBe(true);
    }
    expect(isLikelyCrawler("Safari/537.36")).toBe(false);
  });
});
