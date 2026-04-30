import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("Sticky Action — mobile-fixed Apply on /projects/[id]", () => {
  const plug = readFileSync(
    join(ROOT, "src/components/PlugInApply.tsx"),
    "utf-8",
  );
  const projectPage = readFileSync(
    join(ROOT, "src/app/projects/[id]/page.tsx"),
    "utf-8",
  );

  it("PlugInApply emits a fixed bottom bar with md:static fallback when sticky=true", () => {
    expect(plug).toMatch(/sticky\s*=\s*false/);
    expect(plug).toMatch(/md:static\s+fixed\s+bottom-16/);
    expect(plug).toMatch(/role=\{wrapperRole\}/);
    expect(plug).toMatch(/aria-label=\{wrapperLabel\}/);
    expect(plug).toContain("主要アクション");
  });

  it("/projects/[id] mounts the sticky variant on mobile and a card on md+", () => {
    expect(projectPage).toMatch(/<PlugInApply\s+projectId=\{project\.id\}\s+sticky\s*\/>/);
    expect(projectPage).toMatch(/hidden md:block/);
    // Mobile-only main padding leaves room for the sticky bar
    expect(projectPage).toMatch(/pb-44 md:pb-8/);
  });
});
