import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();

describe("income-stream-ui: IncomeStreamBar accessibility", () => {
  it('IncomeStreamBar has role="status" and aria-live="polite"', () => {
    const src = readFileSync(resolve(root, "src/components/IncomeStreamBar.tsx"), "utf8");
    expect(src).toContain('role="status"');
    expect(src).toContain('aria-live="polite"');
  });
});
