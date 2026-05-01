import { describe, it, expect } from "vitest";
import {
  gradeIntelligence,
  extractHeadings,
  RANK_SUB_LABEL,
  RANK_COLOR_TOKEN,
  RANK_TIER,
} from "@/lib/grading";

function fab(text: string, count: number): string {
  return Array.from({ length: count }, () => text).join("\n");
}

describe("grading: structure / density / consistency formula", () => {
  it("S-tier example crosses the 85 threshold and carries the 伝説級 sub-label", () => {
    const md =
      // 2,000+ chars and a full ATX hierarchy
      "# 大見出し\n" +
      fab("## 設計\n本文。\n", 6) +
      fab("### 実装\n本文。\n", 8) +
      // Pack technical + business terms — Density should saturate
      "API REST GraphQL TypeScript Python Go OpenAPI Postgres Redis Kafka " +
      "Kubernetes Docker OAuth JWT WebSocket gRPC OpenTelemetry Grafana RAG " +
      "LLM Embedding Vector Prompt Agent Pipeline Observability SLO " +
      "ROI KPI OKR ARR LTV CAC TAM Pricing Margin Conversion Retention " +
      "Funnel Stakeholder Roadmap Milestone " +
      // pad
      "ここに 2000 文字を超える解説を記述します。" .repeat(120);
    const r = gradeIntelligence({
      mdText: md,
      hasRunningCode: true,
      githubSignals: { commitCount: 200, recentActivity: true, topics: ["TypeScript", "API"] },
    });
    expect(r.rank).toBe("S");
    expect(r.total).toBeGreaterThanOrEqual(85);
    expect(r.subLabel).toBe(RANK_SUB_LABEL.S);
    expect(r.subLabel).toBe("伝説級。市場価値トップ1%");
  });

  it("A-tier example sits in [70, 85)", () => {
    const md =
      "# Title\n" +
      fab("## H2 設計", 4) + "\n" +
      fab("### H3 詳細", 6) + "\n" +
      // ~18 unique tech/biz term hits
      "API REST GraphQL TypeScript Python Go OpenAPI Postgres Redis OAuth " +
      "WebSocket Pipeline SLO Observability ROI KPI ARR Pricing\n" +
      // Pad to clear the 2000-char structure threshold
      "実装ノートはここに記載します。".repeat(140);
    const r = gradeIntelligence({
      mdText: md,
      hasRunningCode: true,
      githubSignals: { commitCount: 40, recentActivity: true },
    });
    expect(r.rank).toBe("A");
    expect(r.total).toBeGreaterThanOrEqual(70);
    expect(r.total).toBeLessThan(85);
    expect(r.subLabel).toBe("即戦力。エージェント派遣の主力");
  });

  it("B-tier example sits in [50, 70)", () => {
    const md =
      "# Title\n" +
      "## 概要\n## 設計\n## 実装\n" +
      "### ノート1\n### ノート2\n### ノート3\n### ノート4\n### ノート5\n" +
      "API Python Go Postgres ROI Pricing Roadmap " +
      // Structure ≥ 2000 chars but minimal density / consistency
      "本文を書きます。".repeat(280);
    // Omit github signals → neutral 50 consistency
    const r = gradeIntelligence({ mdText: md, hasRunningCode: true });
    expect(r.rank).toBe("B");
    expect(r.total).toBeGreaterThanOrEqual(50);
    expect(r.total).toBeLessThan(70);
    expect(r.subLabel).toBe("堅実な基盤。信頼性の高い知能");
  });

  it("D-tier — recipe-gate (hasRunningCode=false) forces D regardless of score", () => {
    const md = "# Title\n本文だけ。技術用語: API REST.";
    const r = gradeIntelligence({ mdText: md, hasRunningCode: false });
    expect(r.rank).toBe("D");
    expect(r.subLabel).toBe("育成枠。ポテンシャルを秘めた種");
  });

  it("breakdown values are bounded to [0, 100] and pillars vary independently", () => {
    const longHeading = "# T\n" + fab("## H\n", 10) + fab("### S\n", 10) + "本文" .repeat(2000);
    const noTerms     = "本文" .repeat(2000);
    const a = gradeIntelligence({ mdText: longHeading });
    const b = gradeIntelligence({ mdText: noTerms });
    for (const r of [a, b]) {
      expect(r.breakdown.structure).toBeGreaterThanOrEqual(0);
      expect(r.breakdown.structure).toBeLessThanOrEqual(100);
      expect(r.breakdown.density).toBeGreaterThanOrEqual(0);
      expect(r.breakdown.density).toBeLessThanOrEqual(100);
      expect(r.breakdown.consistency).toBeGreaterThanOrEqual(0);
      expect(r.breakdown.consistency).toBeLessThanOrEqual(100);
    }
    // Same body length, but headings differ → structure differs
    expect(a.breakdown.structure).toBeGreaterThan(b.breakdown.structure);
  });

  it("color tokens, tier labels, and sub-labels are wired for all four ranks", () => {
    expect(RANK_COLOR_TOKEN.S.fill).toBe("#FDE047");
    expect(RANK_COLOR_TOKEN.A.fill).toBe("#22D3EE");
    expect(RANK_COLOR_TOKEN.B.fill).toBe("#34D399");
    expect(RANK_COLOR_TOKEN.D.fill).toBe("#94A3B8");
    expect(RANK_TIER).toEqual({ S: "Legend", A: "Expert", B: "Core", D: "Seed" });
  });

  it("extractHeadings counts ATX h1/h2/h3 only", () => {
    const md = "# A\n## B\n### C\n#### D\n## E";
    expect(extractHeadings(md)).toEqual({ h1: 1, h2: 2, h3: 1 });
  });
});
