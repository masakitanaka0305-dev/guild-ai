import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("ClampDescription — show-more toggle", () => {
  const src = readFileSync(
    join(ROOT, "src/components/ui/ClampDescription.tsx"),
    "utf-8",
  );

  it("clamps to maxLines (default 3) and toggles via aria-expanded button", () => {
    expect(src).toMatch(/maxLines\s*=\s*3/);
    expect(src).toMatch(/WebkitLineClamp:\s*maxLines/);
    expect(src).toMatch(/aria-expanded=\{expanded\}/);
    expect(src).toContain("もっと見る");
    expect(src).toContain("閉じる");
    // Esc closes the expanded body — preserves keyboard control
    expect(src).toMatch(/e\.key\s*===\s*"Escape"/);
  });
});
