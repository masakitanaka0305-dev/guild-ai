import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();

// ─── 1. Friendly tokens in globals.css ────────────────────────────────────────

describe("friendly-bank.tokens", () => {
  const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

  it("globals.css defines stamp-pon animation", () => {
    expect(css).toContain("stamp-pon");
  });

  it("globals.css defines coin-fall animation", () => {
    expect(css).toContain("coin-fall");
  });

  it("globals.css defines shima-watch-pupil animation", () => {
    expect(css).toContain("shima-watch-pupil");
  });

  it("globals.css defines gold-glow animation for eligible jobs", () => {
    expect(css).toContain("job-gold-glow");
  });
});

// ─── 2. Shimaenaga watch mode ──────────────────────────────────────────────────

describe("friendly-bank.shimaenaga-watch", () => {
  const src = readFileSync(resolve(root, "src/components/Shimaenaga.tsx"), "utf8");

  it("Shimaenaga type includes watch mode", () => {
    expect(src).toContain('"watch"');
  });

  it("watch mode applies shima-watch-pupil class to pupils", () => {
    expect(src).toContain("shima-watch-pupil");
  });
});

// ─── 3. Sound: playStampChime + playPoyon ─────────────────────────────────────

describe("friendly-bank.sounds", () => {
  it("POYON_FREQ_RANGE exports [150, 250]", async () => {
    const { POYON_FREQ_RANGE } = await import("@/lib/sound");
    expect(POYON_FREQ_RANGE).toEqual([150, 250]);
  });

  it("playPoyon is exported as a function", async () => {
    const { playPoyon } = await import("@/lib/sound");
    expect(typeof playPoyon).toBe("function");
  });
});

// ─── 4. ShimaenagaGuide aria + context map ────────────────────────────────────

describe("friendly-bank.shimaenaga-guide", () => {
  const src = readFileSync(resolve(root, "src/components/ShimaenagaGuide.tsx"), "utf8");

  it("ShimaenagaGuide has role=status and aria-live=polite", () => {
    expect(src).toContain('role="status"');
    expect(src).toContain('aria-live="polite"');
  });

  it("ShimaenagaGuide has context copy for /bank", () => {
    expect(src).toContain("/bank");
    expect(src).toContain("ノートをここに");
  });

  it("ShimaenagaGuide has context copy for /jobs", () => {
    expect(src).toContain("/jobs");
    expect(src).toContain("金マーク");
  });

  it("ShimaenagaGuide has error copy with ごめんね", () => {
    expect(src).toContain("ごめんね");
  });

  it("ShimaenagaGuide has dismiss button with 5s return timeout", () => {
    expect(src).toContain("5000");
  });
});

// ─── 5. useTactile hook ───────────────────────────────────────────────────────

describe("friendly-bank.useTactile", () => {
  const src = readFileSync(resolve(root, "src/hooks/useTactile.ts"), "utf8");

  it("useTactile supports stamp context", () => {
    expect(src).toContain('"stamp"');
  });

  it("useTactile calls navigator.vibrate with pattern", () => {
    expect(src).toContain("navigator.vibrate");
  });

  it("useTactile respects prefers-reduced-motion for vibration", () => {
    expect(src).toContain("prefers-reduced-motion");
  });
});

// ─── 6. RankBadge friendly mode ───────────────────────────────────────────────

describe("friendly-bank.rank-badge-friendly", () => {
  const src = readFileSync(resolve(root, "src/components/RankBadge.tsx"), "utf8");

  it("RankBadge has friendly prop", () => {
    expect(src).toContain("friendly");
  });

  it("RankBadge friendly S renders 金 with すごい！", () => {
    expect(src).toContain("金");
    expect(src).toContain("すごい！");
  });

  it("RankBadge friendly A renders 銀 with いいかんじ", () => {
    expect(src).toContain("銀");
    expect(src).toContain("いいかんじ");
  });

  it("RankBadge friendly B renders 銅 with これから", () => {
    expect(src).toContain("銅");
    expect(src).toContain("これから");
  });

  it("RankBadge includes aria-label with badge name", () => {
    expect(src).toContain("バッジ");
  });
});

// ─── 7. Jobs hint bubble ─────────────────────────────────────────────────────

describe("friendly-bank.jobs-hint-bubble", () => {
  const src = readFileSync(resolve(root, "src/app/jobs/page.tsx"), "utf8");

  it("jobs page uses HintBubble component", () => {
    expect(src).toContain("HintBubble");
  });

  it("jobs page uses gold glow class for eligible cards", () => {
    expect(src).toContain("job-gold-glow");
  });

  it("jobs page button says えらんでもらう", () => {
    expect(src).toContain("えらんでもらう");
  });

  it("jobs page heading says おねがい（クエスト）", () => {
    expect(src).toContain("おねがい（クエスト）");
  });
});
