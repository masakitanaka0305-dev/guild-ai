import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Onboarding 鑑定中 wait page → reveal flow", () => {
  it("/onboarding/grading/[handle]/[repo] mounts the Cinematic Mint reveal (#128)", () => {
    const src = read("src/app/onboarding/grading/[handle]/[repo]/page.tsx");
    expect(src).toContain('data-testid="grading-wait"');
    expect(src).toContain("CinematicMint");
    expect(src).toContain("bg-midnight-base");
    // Continuation link to the draft surface is offered after reveal.
    expect(src).toMatch(/\/onboarding\/draft\/\$\{handle\}\/\$\{repo\}\?reveal=1/);
    expect(src).toContain("ノートを編集する");
  });

  it("/onboarding/draft/[owner]/[repo]?reveal=1 mounts a static rank Reveal with HexRankBadge", () => {
    const src = read("src/app/onboarding/draft/[owner]/[repo]/page.tsx");
    expect(src).toContain('searchParams?.get("reveal")');
    expect(src).toContain('data-testid="rank-reveal"');
    expect(src).toMatch(/<HexRankBadge[^>]*size=\{80\}[^>]*showSubLabel/);
    expect(src).toContain("gradeIntelligence");
  });
});
