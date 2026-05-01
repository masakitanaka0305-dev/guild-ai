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
    // Mercari Lightness (#126): body text softens to #212121, plus a
    // secondary text-soft token at #424242.
    expect(css).toMatch(/--color-text-primary:\s*#212121/i);
    expect(css).toMatch(/--color-text-soft:\s*#424242/i);
    expect(css).toMatch(/--color-text-muted:\s*#475569/i);
    expect(css).toMatch(/--color-text-on-primary:\s*#FFFFFF/i);
    // Action / status (#128 Cinematic Mint — primary moves to Deep Purple).
    expect(css).toMatch(/--color-action-primary:\s*#4C1D95/i);
    expect(css).toMatch(/--color-ai-action:\s*var\(--color-action-primary\)/i);
    expect(css).toMatch(/--color-ai-flow:\s*#7C3AED/i);
    expect(css).toMatch(/--color-ai-success:\s*#059669/i);
    expect(css).toMatch(/--color-ai-warn:\s*#D97706/i);
    expect(css).toMatch(/--color-ai-negative:\s*#DC2626/i);
    // Borders — #133 Visual Hierarchy moved to ink-on-white rgba so
    // light borders sit at L3-subtle (6% slate) / L3-strong (12% slate).
    expect(css).toMatch(/--color-border-subtle:\s*rgba\(15,\s*23,\s*42,\s*0\.06\)/);
    expect(css).toMatch(/--color-border-strong:\s*rgba\(15,\s*23,\s*42,\s*0\.12\)/);
  });

  it("Midnight Logic values dive to abyss-black under [data-theme=\"midnight\"] (#128)", () => {
    const css = read("src/app/globals.css");
    const block = css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";
    // Cinematic Mint (#128): dark surface dives to abyss-black, primary
    // becomes Deep Purple, link adopts violet-300.
    expect(block).toMatch(/--color-bg-base:\s*#020617/i);
    expect(block).toMatch(/--color-action-primary:\s*#4C1D95/i);
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
