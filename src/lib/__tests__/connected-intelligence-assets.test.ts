import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Connected Intelligence Assets — section card on /projects/[id]", () => {
  const cmp = read("src/components/ui/ConnectedIntelligenceAssets.tsx");
  const page = read("src/app/projects/[id]/page.tsx");

  it("ships the heading + Status:Ready / Agent:Synced / Endpoint trio", () => {
    expect(cmp).toContain("Connected Intelligence Assets");
    expect(cmp).toContain("Status");
    expect(cmp).toContain("Ready");
    expect(cmp).toContain("Synced (from MD Assets)");
    expect(cmp).toMatch(/\/api\/atoa\//);
    expect(cmp).toMatch(/<Plug[^>]*stroke-brand-primary/);
  });

  it("uses the spec pill geometry: emerald for Ready, cyan dot for Synced", () => {
    expect(cmp).toContain("bg-emerald-500/15");
    expect(cmp).toContain("text-emerald-300");
    expect(cmp).toContain("ring-emerald-400/30");
    expect(cmp).toContain("text-brand-primary");
    // Cyan vertical bar on the card
    expect(cmp).toContain("border-l-4 border-l-brand-primary");
  });

  it("includes the supporting エンジニア・エージェント copy + 接続中 dot trail", () => {
    expect(cmp).toContain(
      "このプロジェクトには、あなたの「エンジニア・エージェント（仮）」が並行して接続されます",
    );
    expect(cmp).toContain("接続中");
    // 3 cyan dots, static (no animate-* classes)
    expect(cmp).not.toMatch(/animate-(ping|pulse|spin|bounce)/);
  });

  it("/projects/[id] mounts ConnectedIntelligenceAssets fed by pickBestFitMd", () => {
    expect(page).toContain('import { ConnectedIntelligenceAssets } from "@/components/ui/ConnectedIntelligenceAssets"');
    expect(page).toMatch(/<ConnectedIntelligenceAssets[\s\S]*?mdGuildId=\{/);
    expect(page).toContain("pickBestFitMd(ownedMds, project)");
  });
});
