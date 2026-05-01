import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(
  join(ROOT, "src/components/ui/PipelineStepper.tsx"),
  "utf-8",
);

describe("PipelineStepper — Logic White (#125)", () => {
  it("renders an <ol> of steps with done / active / todo states", () => {
    expect(src).toMatch(/<ol[\s\S]*?data-testid="pipeline-stepper"/);
    expect(src).toMatch(/data-testid=\{`pipeline-step-\$\{idx\}`\}/);
    expect(src).toMatch(/data-state=\{state\}/);
    expect(src).toMatch(/aria-current=\{state === "active" \? "step" : undefined\}/);
    expect(src).toMatch(/done\?: boolean/);
    expect(src).toMatch(/active\?: boolean/);
    expect(src).toMatch(/todo\?: boolean/);
  });

  it("active state pulls Royal Blue from var(--color-ai-action), todo uses border-subtle", () => {
    // The active dot is white-on-Royal-Blue with the cyan ring;
    // the todo dot is slate-100 with subtle border.
    expect(src).toMatch(/state === "done"[\s\S]*?bg-\[var\(--color-ai-action\)\][\s\S]*?text-white/);
    expect(src).toMatch(/state === "active"[\s\S]*?bg-white[\s\S]*?text-\[var\(--color-ai-action\)\]/);
    // Todo state falls through to the default branch — slate-100 surface
    expect(src).toMatch(/bg-\[var\(--color-bg-elevated\)\][\s\S]*?text-\[var\(--color-text-muted\)\]/);
    // Connecting line
    expect(src).toMatch(/h-0\.5 w-12 sm:w-20[\s\S]*?bg-\[var\(--color-ai-action\)\]/);
  });

  it("uses lucide Check inside completed step dots", () => {
    expect(src).toContain('import { Check } from "lucide-react"');
    expect(src).toMatch(/<Check\b/);
  });
});
