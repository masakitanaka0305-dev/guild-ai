import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("BackArrow on detail pages", () => {
  it("BackArrow component is at least 44×44 with cyan stroke and aria-label hook", () => {
    const src = readFileSync(
      join(ROOT, "src/components/ui/BackArrow.tsx"),
      "utf-8",
    );
    expect(src).toMatch(/min-h-\[44px\]/);
    expect(src).toMatch(/min-w-\[44px\]/);
    expect(src).toMatch(/aria-label=\{label\}/);
    expect(src).toMatch(/stroke-cyan-400/);
  });

  it("each detail page mounts the shared BackArrow", () => {
    const targets = [
      "src/app/projects/[id]/page.tsx",
      "src/app/onboarding/draft/[owner]/[repo]/page.tsx",
      "src/app/onboarding/repos/page.tsx",
      "src/app/asset/[id]/page.tsx",
      "src/app/asset/[id]/report/page.tsx",
    ];
    for (const rel of targets) {
      const c = readFileSync(join(ROOT, rel), "utf-8");
      expect(c, `${rel} should import BackArrow`).toContain('from "@/components/ui/BackArrow"');
      expect(c, `${rel} should mount <BackArrow`).toMatch(/<BackArrow\s/);
    }
  });
});
