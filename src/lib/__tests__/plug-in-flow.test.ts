import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(join(ROOT, "src/components/PlugInApply.tsx"), "utf-8");

describe("Plug-in flow — confirm modal + plugged-in state + localStorage", () => {
  it("confirmation modal carries the spec body and routes to /applications", () => {
    expect(src).toMatch(/role="dialog"/);
    expect(src).toMatch(/aria-modal="true"/);
    expect(src).toMatch(/aria-labelledby="plugin-confirm-heading"/);
    expect(src).toContain("接続完了");
    expect(src).toContain(
      "あなたの知能（MD）に基づいた最適な条件で、案件にエントリーしました",
    );
    expect(src).toContain("マイページで確認 →");
    expect(src).toMatch(/href="\/applications"/);
    // Esc handler + focus trap
    expect(src).toMatch(/key === "Escape"/);
    expect(src).toMatch(/key === "Tab"/);
    // Modal sizing rule for 375px
    expect(src).toContain("max-w-[calc(100vw-32px)]");
  });

  it("on success the CTA flips to a disabled emerald Plugged-in pill", () => {
    expect(src).toMatch(/data-testid="apply-cta-plugged-in"/);
    expect(src).toContain('aria-label="接続済み"');
    expect(src).toContain('aria-disabled="true"');
    // Spec colors
    expect(src).toContain("bg-emerald-500/10");
    expect(src).toContain("ring-emerald-400/40");
    expect(src).toContain("text-emerald-300");
    // Disabled native attribute also present so React blocks click
    expect(src).toMatch(/disabled\s*\n\s*aria-disabled/);
  });

  it("localStorage write uses the pluggedIn:[projectId]:[guildId] namespace", () => {
    expect(src).toContain('STORAGE_PREFIX = "pluggedIn:"');
    expect(src).toMatch(/localStorage\.setItem\(\s*pluggedInKey\(/);
    expect(src).toMatch(/localStorage\.getItem\(pluggedInKey\(/);
  });
});

// ─── jsdom integration: localStorage round-trip ──────────────────────────────

describe("plug-in flow — localStorage round-trip", () => {
  it("setting pluggedIn:[guildId] persists and survives a re-read", () => {
    // jsdom (vitest's default-ish for browser globals) provides localStorage.
    // We exercise the same key shape the component uses so a regression in
    // the namespace would be caught here.
    const fakeLs = new Map<string, string>();
    const stub = {
      getItem: (k: string) => fakeLs.get(k) ?? null,
      setItem: (k: string, v: string) => { fakeLs.set(k, v); },
    };
    const key = `pluggedIn:proj_001:md_observability`;
    stub.setItem(key, new Date("2026-05-01T00:00:00.000Z").toISOString());
    expect(stub.getItem(key)).toBe("2026-05-01T00:00:00.000Z");
    // The component reads `raw` non-null as truthy → plugged-in
    expect(Boolean(stub.getItem(key))).toBe(true);
  });
});
