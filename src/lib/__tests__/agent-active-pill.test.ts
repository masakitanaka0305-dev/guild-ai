import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(join(ROOT, "src/app/applications/page.tsx"), "utf-8");

describe("/applications — Agent Active pill alongside status", () => {
  it("renders an Agent Active pill component with the spec colors + tooltip", () => {
    expect(src).toContain('data-testid="agent-active-pill"');
    expect(src).toContain('aria-label="AI エージェントが接続中"');
    expect(src).toContain("bg-emerald-500/15");
    expect(src).toContain("text-emerald-300");
    expect(src).toContain("ring-emerald-400/30");
    expect(src).toContain("Agent Active");
    // HelpCircle tooltip carrying the spec text
    expect(src).toContain("人間の参画前から、AI レイヤでデプロイ済みです");
    expect(src).toMatch(/<HelpCircle\b/);
  });

  it("each application row shows the pill alongside its StatusChip", () => {
    // Both surfaces (mobile cards + desktop table) wrap StatusChip and
    // AgentActivePill in a flex container with gap-2.
    const wraps = src.match(/<StatusChip[^/]*\/>\s*\n\s*<AgentActivePill\b/g) ?? [];
    expect(wraps.length).toBeGreaterThanOrEqual(2);
  });

  it("page-level banner reads 「Agent Active：あなたの知能はすでに動いています。」", () => {
    expect(src).toContain('data-testid="agent-active-banner"');
    expect(src).toContain("Agent Active：あなたの知能はすでに動いています。");
  });
});
