import { describe, it, expect } from "vitest";
import {
  contrastRatio,
  contrastRatioRounded,
  LOGIC_WHITE_PAIRS,
} from "@/lib/contrast";

describe("Logic White (#125) — WCAG AA gate", () => {
  it("bg-base × text-primary clears AA (≥ 4.5)", () => {
    expect(contrastRatioRounded("#0F172A", "#F8FAFC")).toBeGreaterThanOrEqual(4.5);
  });

  it("bg-surface × text-muted clears AA (≥ 4.5) — slate-600 on white", () => {
    const r = contrastRatioRounded("#475569", "#FFFFFF");
    expect(r).toBeGreaterThanOrEqual(4.5);
    // Spec says ~8:1; allow slack.
    expect(r).toBeGreaterThan(7);
  });

  it("ai-action × on-primary (Royal Blue + white text) clears AA (≥ 4.5)", () => {
    expect(contrastRatioRounded("#FFFFFF", "#4F46E5")).toBeGreaterThanOrEqual(4.5);
  });

  it("ai-success × on-primary (Emerald-600 + white) clears AA-large (≥ 3.0) for pill geometry", () => {
    // Emerald-600 + white ≈ 3.8:1 — below AA-normal (4.5) but
    // comfortably above AA-large. Restricted to pills / badges where
    // the spec already assumes large UI.
    expect(contrastRatioRounded("#FFFFFF", "#059669")).toBeGreaterThanOrEqual(3.0);
  });

  it("rank-gold × text-primary on white reads ≥ 3.0:1 (AA-large for badges)", () => {
    // Gold tones can't always clear normal-text 4.5:1 on slate-900;
    // use as a badge fill where the pill geometry counts as large UI.
    const r = contrastRatioRounded("#0F172A", "#FBBF24");
    expect(r).toBeGreaterThanOrEqual(3.0);
  });

  it("LOGIC_WHITE_PAIRS sweep — every pair ≥ 3.0:1", () => {
    expect(LOGIC_WHITE_PAIRS).toHaveLength(6);
    for (const p of LOGIC_WHITE_PAIRS) {
      expect(p.fg).toMatch(/^#[0-9A-F]{6}$/i);
      expect(p.bg).toMatch(/^#[0-9A-F]{6}$/i);
      expect(contrastRatio(p.fg, p.bg)).toBeGreaterThanOrEqual(3.0);
    }
  });
});
