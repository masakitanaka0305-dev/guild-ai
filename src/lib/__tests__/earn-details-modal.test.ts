import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("EarnDetailsModal — earn-explanation modal from 稼ぐ surface", () => {
  it("modal exposes the spec copy + role=dialog + Esc handler + cyan close", () => {
    const src = read("src/components/ui/EarnDetailsModal.tsx");
    expect(src).toMatch(/role="dialog"/);
    expect(src).toMatch(/aria-modal="true"/);
    expect(src).toMatch(/key === "Escape"/);
    expect(src).toContain("あなたの知能はどう収益を生むか");
    expect(src).toContain("企業が案件で必要な MD を AI が自動マッチング");
    expect(src).toContain("エージェントが派遣");
    expect(src).toContain("0.001 JPY 単位");
    // Card surface + cyan close button
    expect(src).toContain("bg-midnight-surface");
    expect(src).toContain("rounded-2xl shadow-xl p-6");
    expect(src).toContain("bg-brand-primary");
    // Secondary CTA links to /profile (Intelligence Balance lives there)
    expect(src).toMatch(/href="\/profile"/);
    expect(src).toContain("Intelligence Balance を見る");
  });

  it("/guild surfaces a 「収益の仕組みを見る →」 trigger that opens the modal", () => {
    const src = read("src/app/guild/page.tsx");
    expect(src).toContain('import { EarnDetailsModal } from "@/components/ui/EarnDetailsModal"');
    expect(src).toContain('data-testid="earn-details-trigger"');
    expect(src).toContain("収益の仕組みを見る");
    expect(src).toContain("setEarnOpen(true)");
    expect(src).toMatch(/<EarnDetailsModal\s+open=\{earnOpen\}/);
  });
});
