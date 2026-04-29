import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();

// ─── 1. note-endpoint lib ─────────────────────────────────────────────────────

describe("note-endpoint: getEndpointStats", () => {
  it("returns callsTotal24h = 0 for a fresh guildId", async () => {
    const { getEndpointStats } = await import("@/lib/note-endpoint");
    const stats = getEndpointStats("fresh-guild-zzz");
    expect(stats.callsTotal24h).toBe(0);
    expect(stats.perCallJpy).toBeGreaterThan(0);
    expect(stats.endpointUrl).toContain("fresh-guild-zzz");
  });

  it("recordCall increments callsTotal24h", async () => {
    const { recordCall, getEndpointStats } = await import("@/lib/note-endpoint");
    const id = `test-${Date.now()}`;
    recordCall(id);
    recordCall(id);
    const stats = getEndpointStats(id);
    expect(stats.callsTotal24h).toBe(2);
  });

  it("formatEndpointUrl returns URL containing the guildId", async () => {
    const { formatEndpointUrl } = await import("@/lib/note-endpoint");
    const url = formatEndpointUrl("GUILD:0042");
    expect(url).toContain("GUILD:0042");
    expect(url).toMatch(/^https?:\/\//);
  });
});

// ─── 2. royalty-protocol distribution ────────────────────────────────────────

describe("royalty-protocol: distribute", () => {
  it("distributes 70 / 25 / 5 correctly for 1.0 JPY", async () => {
    const { distribute } = await import("@/lib/royalty-protocol");
    const d = distribute(1.0);
    expect(d.author).toBeCloseTo(0.70, 5);
    expect(d.platform).toBeCloseTo(0.25, 5);
    expect(d.indexFund).toBeCloseTo(0.05, 5);
  });

  it("distribute totals equal perCallJpy", async () => {
    const { distribute } = await import("@/lib/royalty-protocol");
    for (const amount of [0.4, 1.2, 5.0, 10.0]) {
      const { author, platform, indexFund } = distribute(amount);
      expect(author + platform + indexFund).toBeCloseTo(amount, 2);
    }
  });
});

// ─── 3. API route source assertions ──────────────────────────────────────────

describe("api/note route: source structure", () => {
  const src = readFileSync(
    resolve(root, "src/app/api/note/[guildId]/route.ts"),
    "utf8",
  );

  it("GET handler exists and returns JSON with callsTotal24h", () => {
    expect(src).toContain("export async function GET");
    expect(src).toContain("getEndpointStats");
    expect(src).toContain("NextResponse.json");
    expect(src).toContain("Cache-Control");
  });

  it("POST handler exists and calls recordCall", () => {
    expect(src).toContain("export async function POST");
    expect(src).toContain("recordCall");
    expect(src).toContain("ok: true");
  });
});

// ─── 4. Earnings dashboard DOM presence ──────────────────────────────────────

describe("earnings-dashboard: いまの推定時給 card", () => {
  const src = readFileSync(resolve(root, "src/app/guild/page.tsx"), "utf8");

  it("guild page contains いまの推定時給", () => {
    expect(src).toContain("いまの推定時給");
  });

  it("guild page hourly rate element has aria-live=polite", () => {
    expect(src).toContain('aria-live="polite"');
  });
});
