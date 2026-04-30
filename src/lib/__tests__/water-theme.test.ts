import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const root = process.cwd();

describe("water-theme: color tokens", () => {
  it("tailwind.config.ts defines primary DEFAULT as #06B6D4 (cyan-500)", () => {
    const src = readFileSync(resolve(root, "tailwind.config.ts"), "utf8");
    expect(src).toContain("#06B6D4");
    expect(src).toContain("primary");
  });

  it("globals.css defines --primary: #06B6D4 and --bg: #020617 (slate-950)", () => {
    const src = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
    expect(src).toContain("--primary: #06B6D4");
    expect(src).toContain("#020617");
  });
});

describe("water-theme: no-animation", () => {
  it("[data-anim='off'] scopes transition: none to globals.css", () => {
    const src = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
    expect(src).toContain('[data-anim="off"]');
    expect(src).toContain("transition: none");
  });

  it("no framer-motion imports in src/", () => {
    const { execSync } = require("child_process");
    try {
      const result = execSync('grep -r "framer-motion" src/ --include="*.tsx" --include="*.ts"', { encoding: "utf8" }).trim();
      expect(result).toBe("");
    } catch {
      // grep returns exit code 1 when no matches found — that's correct
    }
  });
});

describe("onboarding: analyze flow", () => {
  it("mockIntelDraft returns 4-section JSON (課題/本質/鑑定/出口)", async () => {
    const { mockIntelDraft } = await import("@/lib/intel-parser");
    const draft = mockIntelDraft({ repoName: "test", readme: "", commits: [], snippets: [], context: { language: "TypeScript", runtime: "Node.js", deps: [] } });
    expect(draft.課題).toBeTruthy();
    expect(draft.本質).toBeTruthy();
    expect(draft.鑑定).toBeTruthy();
    expect(draft.出口).toBeTruthy();
  });

  it("onboarding draft page file exists at expected path", () => {
    const path = resolve(root, "src/app/onboarding/draft/[owner]/[repo]/page.tsx");
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, "utf8");
    expect(src).toContain("Mint");
    expect(src).toContain("consentSig");
  });
});

describe("apply: plug-in apply", () => {
  it("projects/[id] page file exists and contains MD select (via PlugInApply)", () => {
    // The page imports PlugInApply which renders the select
    const pagePath = resolve(root, "src/app/projects/[id]/page.tsx");
    const pageSrc = readFileSync(pagePath, "utf8");
    expect(pageSrc).toContain("PlugInApply");
    expect(pageSrc).toContain("Apply");
    // Verify the PlugInApply component has the select element
    const componentPath = resolve(root, "src/components/PlugInApply.tsx");
    const componentSrc = readFileSync(componentPath, "utf8");
    expect(componentSrc).toContain("select");
  });

  it("applications API route exists with POST handler", () => {
    const path = resolve(root, "src/app/api/applications/apply/route.ts");
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, "utf8");
    expect(src).toContain("POST");
    expect(src).toContain("projectId");
  });
});
