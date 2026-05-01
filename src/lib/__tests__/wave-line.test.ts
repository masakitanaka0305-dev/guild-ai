import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("WaveLine — dashboard line-art", () => {
  const src = readFileSync(
    join(ROOT, "src/components/ui/WaveLine.tsx"),
    "utf-8",
  );

  it("uses a single sinuous Bézier path (M ... Q ... T ...)", () => {
    expect(src).toMatch(/d="M0 30 Q 25 10, 50 30 T 100 30"/);
  });

  it("renders at low default opacity (≤ 0.5) so it stays subtle", () => {
    const m = src.match(/opacity\s*=\s*0?\.(\d+)/);
    expect(m).not.toBeNull();
    expect(Number("0." + m![1])).toBeLessThanOrEqual(0.5);
  });

  it("contains no animation or transition", () => {
    expect(src).not.toMatch(/animate|@keyframes|transition\s*:/i);
  });

  it("guild dashboard mounts the WaveLine under the 知恵袋銀行 heading", () => {
    const guild = readFileSync(
      join(ROOT, "src/app/guild/page.tsx"),
      "utf-8",
    );
    expect(guild).toContain('from "@/components/ui/WaveLine"');
    // Mercari Lightness (#126): h1 swapped from もちもの → 知恵袋銀行
    expect(guild).toContain("あなたの知恵袋銀行");
    expect(guild).toContain("<WaveLine");
  });
});
