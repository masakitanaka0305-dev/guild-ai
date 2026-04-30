import { describe, it, expect } from "vitest";
import { getCatalog, getPackage, getCatalogByIndustry } from "@/lib/solution-catalog";
import { proposeFromText } from "@/lib/presale-agent";
import { buildReport } from "@/lib/compliance-report";

// ─── Solution Catalog ─────────────────────────────────────────────────────────

describe("solution-catalog", () => {
  it("getCatalog returns 10 packages", () => {
    const catalog = getCatalog();
    expect(catalog).toHaveLength(10);
  });

  it("all packages have required fields", () => {
    const catalog = getCatalog();
    for (const pkg of catalog) {
      expect(pkg.id).toMatch(/^pkg-\d{3}$/);
      expect(pkg.title.length).toBeGreaterThan(0);
      expect(pkg.industries.length).toBeGreaterThan(0);
      expect(pkg.includedMds.length).toBeGreaterThan(0);
      expect(pkg.roiMonthlyJpy).toBeGreaterThan(0);
      expect([99.5, 99.9]).toContain(pkg.slaPct);
      expect(["team", "enterprise", "enterprise-plus"]).toContain(pkg.minTier);
    }
  });

  it("getPackage returns correct package by id", () => {
    const pkg = getPackage("pkg-001");
    expect(pkg).not.toBeNull();
    expect(pkg!.title).toBe("請求書 PDF 自動仕分け");
  });

  it("getCatalogByIndustry filters correctly", () => {
    const kinyu = getCatalogByIndustry("金融");
    expect(kinyu.length).toBeGreaterThan(0);
    for (const pkg of kinyu) {
      expect(pkg.industries).toContain("金融");
    }
    const iryo = getCatalogByIndustry("医療");
    expect(iryo.length).toBeGreaterThan(0);
    for (const pkg of iryo) {
      expect(pkg.industries).toContain("医療");
    }
  });
});

// ─── Presale Agent ────────────────────────────────────────────────────────────

describe("presale-agent", () => {
  it("proposeFromText returns a valid proposal", () => {
    const proposal = proposeFromText("製造業の在庫管理を自動化したい");
    expect(proposal.packageId).toBeTruthy();
    expect(proposal.mdBundle.length).toBeGreaterThan(0);
    expect(proposal.expectedSavings).toBeGreaterThan(0);
    expect(proposal.rationale.length).toBeGreaterThan(0);
  });

  it("detects industry and returns compliance tags for 金融", () => {
    const proposal = proposeFromText("金融機関のコンプライアンス対応を強化したい");
    expect(proposal.complianceTags.length).toBeGreaterThan(0);
    expect(proposal.recommendedPackage?.industries).toContain("金融");
  });

  it("detects operation keywords and recommends relevant package", () => {
    const proposal = proposeFromText("在庫予測と自動発注でERPに連携したい");
    expect(proposal.packageId).toBe("pkg-004");
  });

  it("returns a proposal even for unknown queries", () => {
    const proposal = proposeFromText("よくわからないが何かしたい");
    expect(proposal.packageId).toBeTruthy();
    expect(proposal.pricing.baseMonthlyJpy).toBeGreaterThan(0);
  });
});

// ─── Compliance Report ────────────────────────────────────────────────────────

describe("compliance-report", () => {
  it("buildReport returns a valid report structure", () => {
    const report = buildReport("GUILD:TEST001");
    expect(report.guildId).toBe("GUILD:TEST001");
    expect(report.certNumber).toMatch(/^GUILD-CERT-\d{6}$/);
    expect(report.securityChecks).toHaveLength(6);
    expect(report.complianceItems).toHaveLength(5);
  });

  it("securityChecks only have valid statuses", () => {
    const report = buildReport("GUILD:TEST002");
    for (const chk of report.securityChecks) {
      expect(["PASS", "WARN", "FAIL"]).toContain(chk.status);
      expect(chk.id).toMatch(/^SEC-\d{2}$/);
    }
  });

  it("complianceItems only have valid statuses", () => {
    const report = buildReport("GUILD:TEST003");
    for (const item of report.complianceItems) {
      expect(["適合", "条件付き適合", "対象外"]).toContain(item.status);
    }
  });

  it("overallVerdict is deterministic for same guildId", () => {
    const r1 = buildReport("GUILD:STABLE");
    const r2 = buildReport("GUILD:STABLE");
    expect(r1.overallVerdict).toBe(r2.overallVerdict);
    expect(r1.certNumber).toBe(r2.certNumber);
    expect(r1.originSignature).toBe(r2.originSignature);
  });
});
