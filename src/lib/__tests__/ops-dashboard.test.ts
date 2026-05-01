import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(
  join(ROOT, "src/app/admin/ops/page.tsx"),
  "utf-8",
);

describe("/admin/ops — Logic White (#125)", () => {
  it("page renders 3 KPI cards with metric-prime numbers", () => {
    expect(src).toContain('data-testid="ops-h1"');
    expect(src).toContain("監視ダッシュボード");
    expect(src).toContain('data-testid="ops-kpi-row"');
    // Three KPI cards mounted by the KpiCard helper
    const labels = ["応答率", "成功率", "月間コール"];
    for (const l of labels) {
      expect(src).toContain(l);
    }
    // Numbers wrapped in metric-prime
    expect(src).toContain("metric-prime");
  });

  it("障害アラート banner uses role=alert with the negative semantic color", () => {
    expect(src).toContain('data-testid="ops-alert"');
    expect(src).toMatch(/role="alert"/);
    expect(src).toContain("障害アラート");
    expect(src).toMatch(/border-\[var\(--color-ai-negative\)\]/);
    // Polite professional copy: 検知 / 対応
    expect(src).toContain("検知：");
  });

  it("7-day trend chart sits on the left + Stepper / CTA on the right", () => {
    expect(src).toContain('data-testid="ops-trend"');
    expect(src).toContain('data-testid="ops-trend-chart"');
    expect(src).toContain("応答成功率（直近 7 日）");
    expect(src).toContain('import { PipelineStepper } from "@/components/ui/PipelineStepper"');
    expect(src).toMatch(/<PipelineStepper\b/);
    // Stepper carries 観測 → 検知 → 対応
    expect(src).toContain('label: "観測"');
    expect(src).toContain('label: "検知"');
    expect(src).toContain('label: "対応"');
    // Primary respond CTA
    expect(src).toContain('data-testid="ops-respond-cta"');
    expect(src).toContain('aria-label="アラートに対応します"');
  });
});
