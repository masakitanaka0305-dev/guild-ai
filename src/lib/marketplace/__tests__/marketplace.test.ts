import { describe, it, expect } from "vitest";
import { autoList, sortListings, filterListings, MOCK_MARKETPLACE } from "../index";

const S_MD = `
async function process(input: string) { }
function validate(data: unknown) { }
class Engine { }
// test example: output: { result: 42 }
`;

const SAMPLE: Parameters<typeof autoList>[0] = {
  id: "test-001",
  ownerId: "creator-test",
  title: "Test Asset",
  description: "Test description",
  ccaf: {
    intentSignals: ["design review", "author-statement", "manual-edit"],
    thoughtDensity: 85,
    iterations: 10,
    authorId: "creator-test",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  vercelUptimeDays: 45,
  basePrice: 10000,
  mdContent: S_MD,
};

describe("autoList", () => {
  it("assigns S rank and boosts floorPrice for a high-quality asset", () => {
    const item = autoList(SAMPLE, { qualityHistory: 80, discordContribution: 70, xAmplification: 60 });
    expect(item.listing.rank).toBe("S");
    expect(item.listing.floorPrice).toBeGreaterThan(SAMPLE.basePrice);
    expect(item.auditResult.rank).toBe("S");
  });

  it("produces a complete MarketplaceListing", () => {
    const item = autoList(SAMPLE, { qualityHistory: 50, discordContribution: 40, xAmplification: 30 });
    expect(item.listing.id).toBe("test-001");
    expect(item.trustScore.score).toBeGreaterThan(0);
    expect(item.listedAt).toBeTruthy();
  });

  it("uses the provided listedAt timestamp", () => {
    const ts = "2025-06-01T12:00:00.000Z";
    const item = autoList(SAMPLE, { qualityHistory: 70, discordContribution: 60, xAmplification: 50 }, ts);
    expect(item.listedAt).toBe(ts);
  });
});

describe("sortListings", () => {
  it("sorts by Trust Score descending", () => {
    const sorted = sortListings(MOCK_MARKETPLACE, "trust");
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].trustScore.score).toBeGreaterThanOrEqual(sorted[i + 1].trustScore.score);
    }
  });

  it("sorts by Floor Price ascending", () => {
    const sorted = sortListings(MOCK_MARKETPLACE, "price");
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].listing.floorPrice).toBeLessThanOrEqual(sorted[i + 1].listing.floorPrice);
    }
  });

  it("sorts by CCAF score descending", () => {
    const sorted = sortListings(MOCK_MARKETPLACE, "ccaf");
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].auditResult.score).toBeGreaterThanOrEqual(sorted[i + 1].auditResult.score);
    }
  });
});

describe("filterListings", () => {
  it("filters to S rank only", () => {
    const sOnly = filterListings(MOCK_MARKETPLACE, { ranks: ["S"], minTrustScore: 0 });
    expect(sOnly.length).toBeGreaterThan(0);
    expect(sOnly.every((item) => item.listing.rank === "S")).toBe(true);
  });

  it("filters by minimum Trust Score", () => {
    const highTrust = filterListings(MOCK_MARKETPLACE, { ranks: ["S", "A", "B"], minTrustScore: 700 });
    expect(highTrust.every((item) => item.trustScore.score >= 700)).toBe(true);
  });

  it("returns empty when no items match", () => {
    const none = filterListings(MOCK_MARKETPLACE, { ranks: ["S"], minTrustScore: 999 });
    expect(none.length).toBe(0);
  });
});

describe("MOCK_MARKETPLACE", () => {
  it("contains 6 mock listings", () => {
    expect(MOCK_MARKETPLACE.length).toBe(6);
  });

  it("has at least one S and one B ranked asset", () => {
    const ranks = MOCK_MARKETPLACE.map((m) => m.listing.rank);
    expect(ranks).toContain("S");
    expect(ranks).toContain("B");
  });
});
