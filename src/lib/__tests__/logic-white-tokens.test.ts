import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Logic White (#125) — default light tokens", () => {
  it("globals.css :root carries the Logic White semantic values", () => {
    const css = read("src/app/globals.css");
    // Backgrounds
    expect(css).toMatch(/--color-bg-base:\s*#F8FAFC/i);
    expect(css).toMatch(/--color-bg-surface:\s*#FFFFFF/i);
    expect(css).toMatch(/--color-bg-elevated:\s*#F1F5F9/i);
    // Text
    expect(css).toMatch(/--color-text-primary:\s*#0F172A/i);
    expect(css).toMatch(/--color-text-muted:\s*#475569/i);
    expect(css).toMatch(/--color-text-on-primary:\s*#FFFFFF/i);
    // Action / status
    expect(css).toMatch(/--color-ai-action:\s*#4F46E5/i);
    expect(css).toMatch(/--color-ai-flow:\s*#7C3AED/i);
    expect(css).toMatch(/--color-ai-success:\s*#059669/i);
    expect(css).toMatch(/--color-ai-warn:\s*#D97706/i);
    expect(css).toMatch(/--color-ai-negative:\s*#DC2626/i);
    // Borders
    expect(css).toMatch(/--color-border-subtle:\s*#E2E8F0/i);
    expect(css).toMatch(/--color-border-strong:\s*#CBD5E1/i);
  });

  it("Midnight Logic values stay verbatim under [data-theme=\"midnight\"]", () => {
    const css = read("src/app/globals.css");
    // Extract the actual selector block (skip the prose comment that
    // mentions the same string).
    const block = css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";
    expect(block).toMatch(/--color-bg-base:\s*#0F172A/i);
    expect(block).toMatch(/--color-ai-action:\s*#06B6D4/i);
    expect(block).toMatch(/--color-text-primary:\s*#F8FAFC/i);
  });

  it("tailwind midnight / ai / text utilities resolve through CSS variables", () => {
    const tw = read("tailwind.config.ts");
    expect(tw).toMatch(/midnight:\s*\{[^}]*base:\s*"var\(--color-bg-base\)"/);
    expect(tw).toMatch(/ai:\s*\{[^}]*action:\s*"var\(--color-ai-action\)"/);
    expect(tw).toMatch(/text:\s*\{[^}]*primary:\s*"var\(--color-text-primary\)"/);
  });

  it("layout opens on data-theme=\"logic-white\" and ThemeSwitch is mounted in MainHeader", () => {
    const layout = read("src/app/layout.tsx");
    const header = read("src/components/MainHeader.tsx");
    expect(layout).toMatch(/data-theme="logic-white"/);
    expect(header).toContain('import { ThemeSwitch } from "@/components/ui/ThemeSwitch"');
    expect(header).toMatch(/<ThemeSwitch\b/);
  });

  it("ThemeSwitch component persists guild_theme + flips html data-theme", () => {
    const src = read("src/components/ui/ThemeSwitch.tsx");
    expect(src).toContain('data-testid="theme-switch"');
    expect(src).toContain('"guild_theme"');
    expect(src).toMatch(/document\.documentElement\.setAttribute\("data-theme",/);
    expect(src).toMatch(/lucide-react/);
  });
});
