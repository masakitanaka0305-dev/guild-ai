import { describe, it, expect } from "vitest";
import {
  contrastRatio,
  contrastRatioRounded,
  parseHex,
  relativeLuminance,
  MIDNIGHT_PAIRS,
} from "@/lib/contrast";

describe("contrast: WCAG 2.1 ratio utility", () => {
  it("white-on-black returns 21:1", () => {
    expect(contrastRatioRounded("#FFFFFF", "#000000")).toBe(21);
  });

  it("identical colors return 1:1", () => {
    expect(contrastRatio("#06B6D4", "#06B6D4")).toBeCloseTo(1, 2);
  });

  it("parseHex normalises 3-digit and 6-digit forms", () => {
    expect(parseHex("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("#0F172A")).toEqual({ r: 15, g: 23, b: 42 });
  });

  it("relativeLuminance matches the WCAG examples for canonical greys", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });
});

describe("contrast: Midnight Logic AA gate", () => {
  // Spec target: every pair below is at least 4.5:1 (WCAG AA normal text)
  // OR ≥ 3.0:1 for large/UI elements where called out.
  it("bg-base × text-primary clears AA (≥ 4.5)", () => {
    const r = contrastRatioRounded("#F8FAFC", "#0F172A");
    expect(r).toBeGreaterThanOrEqual(4.5);
    // The spec quotes ~16:1; allow ±1 slack.
    expect(r).toBeGreaterThan(15);
  });

  it("bg-base × text-muted clears AA (≥ 4.5)", () => {
    const r = contrastRatioRounded("#94A3B8", "#0F172A");
    expect(r).toBeGreaterThanOrEqual(4.5);
  });

  it("ai-action × on-primary (button text) clears AA (≥ 4.5)", () => {
    const r = contrastRatioRounded("#0F172A", "#06B6D4");
    expect(r).toBeGreaterThanOrEqual(4.5);
  });

  it("ai-success × on-primary clears AA (≥ 4.5)", () => {
    const r = contrastRatioRounded("#0F172A", "#10B981");
    expect(r).toBeGreaterThanOrEqual(4.5);
  });

  it("ai-flow × on-primary clears AA-large (≥ 3.0) — flow is for badges, not body text", () => {
    const r = contrastRatioRounded("#0F172A", "#8B5CF6");
    expect(r).toBeGreaterThanOrEqual(3.0);
  });

  it("bg-surface × text-primary clears AA (≥ 4.5)", () => {
    const r = contrastRatioRounded("#F8FAFC", "#1E293B");
    expect(r).toBeGreaterThanOrEqual(4.5);
  });

  it("MIDNIGHT_PAIRS list covers the 6 spec pairs", () => {
    expect(MIDNIGHT_PAIRS).toHaveLength(6);
    for (const p of MIDNIGHT_PAIRS) {
      expect(p.fg).toMatch(/^#[0-9A-F]{6}$/i);
      expect(p.bg).toMatch(/^#[0-9A-F]{6}$/i);
      expect(contrastRatio(p.fg, p.bg)).toBeGreaterThanOrEqual(3.0);
    }
  });
});
