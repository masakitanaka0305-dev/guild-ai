import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Onboarding 鑑定中 wait page → reveal flow", () => {
  it("/onboarding/grading/[handle]/[repo] is a 3-second static wait that replaces to draft?reveal=1", () => {
    const src = read("src/app/onboarding/grading/[handle]/[repo]/page.tsx");
    expect(src).toContain("鑑定中...");
    expect(src).toContain("Analyzing your Intelligence");
    expect(src).toContain("bg-midnight-base");
    expect(src).toMatch(/role="status"/);
    expect(src).toMatch(/aria-live="polite"/);
    // 3-second timeout that replaces with ?reveal=1
    expect(src).toMatch(/setTimeout\([\s\S]*?3000\)/);
    expect(src).toMatch(/router\.replace\(`\/onboarding\/draft\/\$\{handle\}\/\$\{repo\}\?reveal=1`\)/);
    // No animation classes (animate-* excluded)
    expect(src).not.toMatch(/animate-(bounce|pulse|spin|ping)/);
    expect(src).toContain('data-testid="grading-wait"');
  });

  it("/onboarding/draft/[owner]/[repo]?reveal=1 mounts a static rank Reveal with HexRankBadge", () => {
    const src = read("src/app/onboarding/draft/[owner]/[repo]/page.tsx");
    expect(src).toContain('searchParams?.get("reveal")');
    expect(src).toContain('data-testid="rank-reveal"');
    expect(src).toMatch(/<HexRankBadge[^>]*size=\{80\}[^>]*showSubLabel/);
    expect(src).toContain("gradeIntelligence");
  });
});
