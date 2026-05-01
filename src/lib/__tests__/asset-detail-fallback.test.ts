import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Guild 詳細 link → /asset/[id] with Coming Soon fallback", () => {
  it("AssetPortfolio routes 詳細 to /asset/${guildId} when implemented, modal otherwise", () => {
    const src = read("src/components/AssetPortfolio.tsx");
    expect(src).toContain('import { ComingSoonModal } from "@/components/ui/ComingSoonModal"');
    // DetailTrigger picks Link or button based on isAssetImplemented
    expect(src).toMatch(/href=\{`\/asset\/\$\{guildId\}`\}/);
    expect(src).toContain("isAssetImplemented");
    expect(src).toMatch(/data-testid="asset-detail-coming-soon"/);
    // Modal mounted at the section root
    expect(src).toMatch(/<ComingSoonModal\s+open=\{comingSoonOpen\}/);
  });

  it("isAssetImplemented helper checks the marketplace listing catalogue", () => {
    const src = read("src/lib/portfolio/index.ts");
    expect(src).toMatch(/export function isAssetImplemented\(guildId: string\): boolean/);
    expect(src).toMatch(/MOCK_MARKETPLACE\.some\(/);
    expect(src).toMatch(/listing\.id === guildId/);
  });

  it("ComingSoonModal renders role=dialog + cyan close button + Esc handler", () => {
    const src = read("src/components/ui/ComingSoonModal.tsx");
    expect(src).toMatch(/role="dialog"/);
    expect(src).toMatch(/aria-modal="true"/);
    expect(src).toContain("Coming Soon");
    expect(src).toContain("MVP 後リリース予定です");
    expect(src).toContain("bg-cyan-400");
    expect(src).toMatch(/key === "Escape"/);
    expect(src).toContain("bg-[#162035] rounded-2xl shadow-xl p-6");
  });
});
