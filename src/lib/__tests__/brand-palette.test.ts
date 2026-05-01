import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { BRAND_PALETTE_PAIRS, contrastRatioRounded } from "@/lib/contrast";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Final Polish (#127) — Brand Palette tokens", () => {
  it("globals.css :root carries Mercari Purple #6366F1 + お礼 Gold #FBBF24", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/--color-action-primary:\s*#6366F1/i);
    expect(css).toMatch(/--color-action-secondary:\s*#FBBF24/i);
    expect(css).toMatch(/--color-action-primary-hover:\s*#4F46E5/i);
    expect(css).toMatch(/--color-action-primary-soft:\s*#E0E7FF/i);
    expect(css).toMatch(/--color-action-secondary-soft:\s*#FEF3C7/i);
  });

  it("Midnight theme keeps the same purple/gold and links via #A5B4FC (no cyan)", () => {
    const css = read("src/app/globals.css");
    const block = css.match(/\[data-theme="midnight"\]\s*\{[\s\S]*?\n\s{2}\}/)?.[0] ?? "";
    expect(block).toMatch(/--color-action-primary:\s*#6366F1/i);
    expect(block).toMatch(/--color-action-secondary:\s*#FBBF24/i);
    expect(block).toMatch(/--color-link:\s*#A5B4FC/i);
  });

  it("tailwind.config.ts exposes brand.primary / brand.secondary / brand.cyan-helper", () => {
    const tw = read("tailwind.config.ts");
    expect(tw).toMatch(/brand:\s*\{/);
    expect(tw).toMatch(/primary:\s*"var\(--color-action-primary\)"/);
    expect(tw).toMatch(/secondary:\s*"var\(--color-action-secondary\)"/);
    expect(tw).toMatch(/"cyan-helper":\s*"var\(--color-cyan-helper\)"/);
  });
});

describe("Final Polish (#127) — Cyan restricted to warn/helper only", () => {
  // Walk every UI .tsx under src/app + src/components and assert that
  // no `bg-cyan-*` / `text-cyan-*` / `border-cyan-*` utility class shows
  // up in production code. Exceptions allowed only in test files
  // (which describe-document the legacy palette).
  function walk(dir: string, out: string[] = []): string[] {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "__tests__") continue;
        walk(full, out);
      } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
        out.push(full);
      }
    }
    return out;
  }

  it("UI source has zero text-cyan-/bg-cyan-/border-cyan-/stroke-cyan- classes", () => {
    const files = [
      ...walk(join(ROOT, "src/app")),
      ...walk(join(ROOT, "src/components")),
    ];
    const offenders: string[] = [];
    const re = /\b(text|bg|border|border-[lrtbxy]|stroke|ring|fill|from|to|via|outline|caret|decoration|placeholder|divide|accent|shadow)-cyan-(300|400|500|600|700|800|900)\b/;
    for (const f of files) {
      const c = readFileSync(f, "utf-8");
      if (re.test(c)) {
        offenders.push(f.split("src/")[1] ?? f);
      }
    }
    expect(
      offenders,
      `Cyan utility classes still present in: ${offenders.join(", ")}`,
    ).toHaveLength(0);
  });

  it("UI source has zero hard-coded #22D3EE / #06B6D4 / #4DD0E1 hex literals", () => {
    const files = [
      ...walk(join(ROOT, "src/app")),
      ...walk(join(ROOT, "src/components")),
    ];
    const offenders: string[] = [];
    const re = /#22D3EE|#06B6D4|#4DD0E1/i;
    for (const f of files) {
      const c = readFileSync(f, "utf-8");
      if (re.test(c)) {
        offenders.push(f.split("src/")[1] ?? f);
      }
    }
    expect(
      offenders,
      `Cyan hex literals still present in: ${offenders.join(", ")}`,
    ).toHaveLength(0);
  });
});

describe("Final Polish (#127) — Brand Palette WCAG AA pairs", () => {
  it("BRAND_PALETTE_PAIRS lists the 6 spec combinations", () => {
    expect(BRAND_PALETTE_PAIRS).toHaveLength(6);
  });

  it("Every brand palette pair clears AA (≥ 4.5) for body text", () => {
    for (const p of BRAND_PALETTE_PAIRS) {
      const r = contrastRatioRounded(p.fg, p.bg);
      expect(
        r,
        `${p.name} measured ${r} on ${p.fg}/${p.bg}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("Final Polish (#127) — UI surfaces", () => {
  it("/projects mobile card 想定お礼 ¥ uses 1.4× sizing + brand gold", () => {
    const src = read("src/app/projects/page.tsx");
    expect(src).toContain('data-testid="project-card-yen-mark"');
    expect(src).toMatch(/text-\[1\.4em\]/);
    expect(src).toMatch(/text-\[#FBBF24\]/);
  });

  it("/projects mobile card help button is bg-brand-primary + white text", () => {
    const src = read("src/app/projects/page.tsx");
    expect(src).toMatch(/bg-brand-primary[^"]*text-white/);
    expect(src).toContain("この困りごとを助ける");
  });

  it("/guild value chart strokes through #6366F1", () => {
    const owned = read("src/components/ui/OwnedAssetsSection.tsx");
    expect(owned).toContain('stroke="#6366F1"');
    expect(owned).toContain('data-testid="value-chart"');
  });

  it("/guild 合計売上 uses metric-hero (1.5×) with the 1.4× ¥ mark", () => {
    const guild = read("src/app/guild/page.tsx");
    expect(guild).toMatch(/className="metric-hero[^"]*"/);
    expect(guild).toContain('data-testid="guild-total-sales-yen"');
    expect(guild).toContain("metric-hero-yen");
  });

  it("/guild status pill switches from お貸出し中 → お仕事中 (more active)", () => {
    const owned = read("src/components/ui/OwnedAssetsSection.tsx");
    expect(owned).toContain('"Deployed":        "お仕事中"');
    expect(owned).not.toMatch(/"Deployed":\s*"お貸出し中"/);
  });

  it("/guild value chart heading reads 「あなたの知恵の価値」", () => {
    const owned = read("src/components/ui/OwnedAssetsSection.tsx");
    expect(owned).toContain("あなたの知恵の価値");
    expect(owned).not.toContain("もちもの時価のうごき");
  });

  it("Onboarding StepCard uses purple Hexagon fill (#6366F1) with white inner number", () => {
    const card = read("src/components/intelligence-deck/StepCard.tsx");
    expect(card).toMatch(/fill="#6366F1"/);
    expect(card).toMatch(/fill="#FFFFFF"/);
    expect(card).toMatch(/font-medium text-\[#F1F5F9\]/);
  });
});

describe("Final Polish (#127) — Purple Ripple", () => {
  it("@/lib/motion exports useRipple + RIPPLE_CLASS with brand-primary tint", () => {
    const src = read("src/lib/motion/index.tsx");
    expect(src).toContain("export function useRipple");
    expect(src).toContain("RIPPLE_CLASS");
    expect(src).toContain("bg-brand-primary/20");
    expect(src).toContain("motion-safe:animate-purple-ripple");
    expect(src).toContain("motion-reduce:opacity-0");
  });

  it("tailwind.config.ts wires the purple-ripple keyframe (220ms ease-out)", () => {
    const tw = read("tailwind.config.ts");
    expect(tw).toContain("purple-ripple");
    expect(tw).toMatch(/"purple-ripple":\s*"purple-ripple 220ms ease-out forwards"/);
  });

  it("Mint advance + PlugInApply spawn the ripple via useRipple()", () => {
    const mint = read("src/app/mint/page.tsx");
    const apply = read("src/components/PlugInApply.tsx");
    for (const src of [mint, apply]) {
      expect(src).toContain("useRipple");
      expect(src).toContain("ripple.onPointerDown");
      expect(src).toContain("ripple.ripples");
      expect(src).toMatch(/relative\s+overflow-hidden/);
    }
  });
});
