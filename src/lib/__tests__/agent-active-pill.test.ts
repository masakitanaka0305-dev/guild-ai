import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(join(ROOT, "src/app/applications/page.tsx"), "utf-8");

describe("/applications — 「AI が代わりに働いています」 pill (Friendly Tone)", () => {
  it("renders the pill with the friendly aria-label, label and tooltip", () => {
    expect(src).toContain('data-testid="agent-active-pill"');
    expect(src).toContain('aria-label="AI が代わりに働いています"');
    expect(src).toContain("bg-emerald-500/15");
    expect(src).toContain("text-emerald-300");
    expect(src).toContain("ring-emerald-400/30");
    // Friendly label inside the pill body
    expect(src).toMatch(/<span[^>]*aria-hidden[^>]*\/>\s*\n\s*AI が代わりに働いています/);
    // HelpCircle tooltip carrying the friendly explanation
    expect(src).toContain("あなたの参加前から、AI が知恵を活かして動いています");
    expect(src).toMatch(/<HelpCircle\b/);
  });

  it("each application row shows the pill alongside its StatusChip", () => {
    const wraps = src.match(/<StatusChip[^/]*\/>\s*\n\s*<AgentActivePill\b/g) ?? [];
    expect(wraps.length).toBeGreaterThanOrEqual(2);
  });

  it("page-level banner reads 「AI が代わりに働いています：あなたの知恵はすでに動いています。」", () => {
    expect(src).toContain('data-testid="agent-active-banner"');
    expect(src).toContain(
      "AI が代わりに働いています：あなたの知恵はすでに動いています。",
    );
  });
});

describe("/applications — friendly status & headings", () => {
  it("h1 reads 「参加状況」", () => {
    expect(src).toContain("参加状況");
    expect(src).toContain('data-testid="applications-h1"');
  });

  it("STATUS_STEPS adopts 受付中 / 働いてます / お礼まち", () => {
    expect(src).toContain('"受付中"');
    expect(src).toContain('"働いてます"');
    expect(src).toContain('"お礼まち"');
  });

  it("Cancel modal copy uses 参加 vocabulary", () => {
    expect(src).toContain("参加を取り消しますか？");
    expect(src).toContain("いつでもまた参加できます");
  });
});
