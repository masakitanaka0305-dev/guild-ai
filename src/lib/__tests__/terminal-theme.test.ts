import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();

// ─── 1. CSS token definitions ─────────────────────────────────────────────────

describe("terminal-theme.tokens", () => {
  const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

  it("globals.css defines [data-theme='pro'] selector (renamed from terminal)", () => {
    expect(css).toContain('[data-theme="pro"]');
  });

  it("globals.css defines --obsidian variable", () => {
    expect(css).toContain("--obsidian:");
  });

  it("globals.css defines --t-gold variable", () => {
    expect(css).toContain("--t-gold:");
  });

  it("globals.css defines gold-flash-bar animation", () => {
    expect(css).toContain("gold-flash");
  });

  it("globals.css caps terminal animations at 100ms", () => {
    expect(css).toContain("animation-duration: 100ms");
  });

  it("globals.css hides .kawaii-only in terminal", () => {
    expect(css).toContain("kawaii-only");
    expect(css).toContain("display: none");
  });
});

// ─── 2. Tailwind terminal palette ────────────────────────────────────────────

describe("terminal-theme.tailwind", () => {
  const cfg = readFileSync(resolve(root, "tailwind.config.ts"), "utf8");

  it("tailwind.config has obsidian color", () => {
    expect(cfg).toContain("obsidian");
  });

  it("tailwind.config has t-gold color", () => {
    expect(cfg).toContain("t-gold");
  });

  it("tailwind.config has positive/negative colors", () => {
    expect(cfg).toContain("positive");
    expect(cfg).toContain("negative");
  });

  it("tailwind.config has font-mono with JetBrains", () => {
    expect(cfg).toContain("JetBrains Mono");
  });
});

// ─── 3. RatingPlate SVG ───────────────────────────────────────────────────────

describe("terminal-theme.rating-plate", () => {
  const src = readFileSync(resolve(root, "src/components/RatingPlate.tsx"), "utf8");

  it("RatingPlate renders SVG with correct aria-label", () => {
    expect(src).toContain("aria-label");
    expect(src).toContain("Verified by GUILD AI");
  });

  it("RatingPlate has S rank dark gold background config", () => {
    expect(src).toContain('"S"');
    expect(src).toContain("#D4AF37");
  });

  it("RatingPlate has A and B rank configurations", () => {
    expect(src).toContain("A:");
    expect(src).toContain("B:");
  });

  it("RatingPlate has sm/md/lg sizes", () => {
    expect(src).toContain('"sm"');
    expect(src).toContain('"md"');
    expect(src).toContain('"lg"');
  });
});

// ─── 4. GoldenSeal SVG ────────────────────────────────────────────────────────

describe("terminal-theme.golden-seal", () => {
  const src = readFileSync(resolve(root, "src/components/GoldenSeal.tsx"), "utf8");

  it("GoldenSeal has size prop for 24/32/48", () => {
    expect(src).toContain("24");
    expect(src).toContain("32");
    expect(src).toContain("48");
  });

  it("GoldenSeal has aria-label with 鑑定済み証", () => {
    expect(src).toContain("鑑定済み証");
  });

  it("GoldenSeal uses double gold rings", () => {
    expect(src).toContain("outerR");
    expect(src).toContain("innerR");
  });

  it("GoldenSeal renders Shimaenaga abstract silhouette (eyeless)", () => {
    expect(src).toContain("ellipse");
    expect(src).toContain("eyeless");
  });
});

// ─── 5. Charts ────────────────────────────────────────────────────────────────

describe("terminal-theme.charts.ticker-strip", () => {
  const src = readFileSync(resolve(root, "src/components/charts/TickerStrip.tsx"), "utf8");

  it("TickerStrip has role=region and aria-label", () => {
    expect(src).toContain('role="region"');
    expect(src).toContain("aria-label");
  });

  it("TickerStrip renders yield as YLD label", () => {
    expect(src).toContain("YLD");
  });

  it("TickerStrip uses tabular-nums", () => {
    expect(src).toContain("tabular-nums");
  });
});

describe("terminal-theme.charts.sparkline", () => {
  const src = readFileSync(resolve(root, "src/components/charts/Sparkline.tsx"), "utf8");

  it("Sparkline renders SVG polyline", () => {
    expect(src).toContain("polyline");
  });

  it("Sparkline has aria-label and title", () => {
    expect(src).toContain("aria-label");
    expect(src).toContain("<title>");
  });
});

describe("terminal-theme.charts.orderbook-lite", () => {
  const src = readFileSync(resolve(root, "src/components/charts/OrderBookLite.tsx"), "utf8");

  it("OrderBookLite has role=region", () => {
    expect(src).toContain('role="region"');
  });

  it("OrderBookLite renders Buy and Sell sides", () => {
    expect(src).toContain("Ask");
    expect(src).toContain("Bid");
  });
});

describe("terminal-theme.charts.stream-feed", () => {
  const src = readFileSync(resolve(root, "src/components/charts/StreamFeed.tsx"), "utf8");

  it("StreamFeed has role=log and aria-live=polite", () => {
    expect(src).toContain('role="log"');
    expect(src).toContain('aria-live="polite"');
  });

  it("StreamFeed row height is 22px", () => {
    expect(src).toContain("22");
  });
});

// ─── 6. ThemeToggle: 3-state + default ───────────────────────────────────────

describe("terminal-theme.theme-toggle", () => {
  const src = readFileSync(resolve(root, "src/components/ThemeToggle.tsx"), "utf8");

  it("ThemeToggle has nameraka as default theme (renamed from terminal)", () => {
    expect(src).toContain('"nameraka"');
    expect(src).toContain("nameraka");
  });

  it("ThemeToggle has 3 states: nameraka, pro, kawaii", () => {
    expect(src).toContain('"nameraka"');
    expect(src).toContain('"pro"');
    expect(src).toContain('"kawaii"');
  });

  it("ThemeToggle has role=radiogroup", () => {
    expect(src).toContain('role="radiogroup"');
  });

  it("ThemeToggle persists to localStorage", () => {
    expect(src).toContain("localStorage");
    expect(src).toContain("guild_theme");
  });

  it("ThemeInitScript prevents FOUC with inline script", () => {
    expect(src).toContain("ThemeInitScript");
    expect(src).toContain("dangerouslySetInnerHTML");
  });
});

// ─── 7. Jargon lint ──────────────────────────────────────────────────────────

describe("terminal-theme.jargon-lint", () => {
  const bankTerminal = readFileSync(resolve(root, "src/app/bank/page.tsx"), "utf8");
  const jobsTerminal = readFileSync(resolve(root, "src/app/jobs/page.tsx"), "utf8");

  it("bank page terminal layout uses CCAF terminology", () => {
    expect(bankTerminal).toContain("CCAF");
  });

  it("jobs page terminal layout uses Yield terminology", () => {
    expect(jobsTerminal).toContain("Yield");
  });

  it("guild page uses AUM and MoM terminology", () => {
    const guildSrc = readFileSync(resolve(root, "src/app/guild/page.tsx"), "utf8");
    expect(guildSrc).toContain("AUM");
    expect(guildSrc).toContain("MoM");
  });

  it("terminal-data lib exports getTickerSnapshot, getStreamFeed, getDeployStatus", async () => {
    const { getTickerSnapshot, getStreamFeed, getDeployStatus } = await import("@/lib/terminal-data");
    expect(typeof getTickerSnapshot).toBe("function");
    expect(typeof getStreamFeed).toBe("function");
    expect(typeof getDeployStatus).toBe("function");
  });

  it("getTickerSnapshot returns items with yield and delta", async () => {
    const { getTickerSnapshot } = await import("@/lib/terminal-data");
    const items = getTickerSnapshot();
    expect(items.length).toBeGreaterThan(0);
    expect(typeof items[0].yield).toBe("number");
    expect(typeof items[0].delta).toBe("number");
  });
});
