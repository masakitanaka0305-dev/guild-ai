// Presale Agent — natural language → MD bundle + pricing + savings

import { getCatalog, getCatalogByIndustry, type SolutionPackage } from "@/lib/solution-catalog";

export interface PricingBreakdown {
  baseMonthlyJpy: number;
  setupJpy: number;
  perCallJpy: number | null;
  tier: "team" | "enterprise" | "enterprise-plus";
}

export interface PresaleProposal {
  packageId: string | null;
  recommendedPackage: SolutionPackage | null;
  mdBundle: string[];
  pricing: PricingBreakdown;
  expectedSavings: number;
  complianceTags: string[];
  rationale: string;
}

// ─── Keyword dictionaries ─────────────────────────────────────────────────────

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  金融: ["金融", "銀行", "保険", "証券", "ファイナンス", "審査", "融資", "コンプライアンス", "法令", "金商法"],
  医療: ["医療", "病院", "クリニック", "カルテ", "処方", "診療", "患者", "医師", "ヘルスケア"],
  小売: ["小売", "EC", "通販", "ショップ", "商品", "在庫", "レビュー", "購入", "顧客", "CRM"],
  製造: ["製造", "工場", "部品", "生産", "ERP", "発注", "在庫管理", "サプライチェーン", "品質"],
};

const OPERATION_KEYWORDS: Record<string, string[]> = {
  "ocr-invoice":    ["請求書", "PDF", "仕分け", "OCR", "会計", "勘定", "経費"],
  "call-crm":       ["コール", "通話", "録音", "CRM", "Salesforce", "HubSpot", "要約"],
  "abm-email":      ["メール", "ABM", "リード", "営業", "パーソナライズ", "文面"],
  "inventory":      ["在庫", "発注", "欠品", "予測", "季節", "ERP"],
  "compliance":     ["コンプライアンス", "チャット", "モニタ", "インサイダー", "ハラスメント", "漏洩"],
  "medical-ocr":    ["医療記録", "カルテ", "処方箋", "電子カルテ", "ICD"],
  "review-analysis":["レビュー", "感情", "スコア", "EC", "商品評価"],
  "contract":       ["契約書", "NDA", "リスク", "法務", "条項", "弁護士"],
  "qa-bot":         ["Q&A", "ナレッジ", "Bot", "社内", "Slack", "Teams", "FAQ", "マニュアル"],
  "insurance":      ["保険", "申請", "審査", "保険金", "クレーム"],
};

const OPERATION_TO_PACKAGE: Record<string, string> = {
  "ocr-invoice":    "pkg-001",
  "call-crm":       "pkg-002",
  "abm-email":      "pkg-003",
  "inventory":      "pkg-004",
  "compliance":     "pkg-005",
  "medical-ocr":    "pkg-006",
  "review-analysis":"pkg-007",
  "contract":       "pkg-008",
  "qa-bot":         "pkg-009",
  "insurance":      "pkg-010",
};

const COMPLIANCE_BY_INDUSTRY: Record<string, string[]> = {
  金融: ["金商法 第40条", "FISC安全対策基準", "AML/CFTガイドライン"],
  医療: ["医療法 第21条の2", "個人情報保護法（医療特則）", "電子カルテ管理基準"],
  小売: ["個人情報保護法", "特定商取引法", "景品表示法"],
  製造: ["ISO9001", "製造物責任法", "サプライチェーンBCP基準"],
};

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function countKeywords(text: string, keywords: string[]): number {
  return keywords.filter((kw) => text.includes(kw)).length;
}

function detectIndustry(query: string): string | null {
  let best: string | null = null;
  let bestScore = 0;
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = countKeywords(query, keywords);
    if (score > bestScore) { bestScore = score; best = industry; }
  }
  return best;
}

function detectOperation(query: string): string | null {
  let best: string | null = null;
  let bestScore = 0;
  for (const [op, keywords] of Object.entries(OPERATION_KEYWORDS)) {
    const score = countKeywords(query, keywords);
    if (score > bestScore) { bestScore = score; best = op; }
  }
  return best;
}

// ─── Pricing calculation (deterministic) ─────────────────────────────────────

function calcPricing(pkg: SolutionPackage): PricingBreakdown {
  const baseMap: Record<string, number> = { team: 98_000, enterprise: 298_000, "enterprise-plus": 598_000 };
  const setupMap: Record<string, number> = { team: 0, enterprise: 300_000, "enterprise-plus": 800_000 };
  return {
    baseMonthlyJpy: baseMap[pkg.minTier],
    setupJpy: setupMap[pkg.minTier],
    perCallJpy: pkg.minTier === "team" ? 0 : null,
    tier: pkg.minTier,
  };
}

function buildRationale(pkg: SolutionPackage, industry: string | null): string {
  const industryNote = industry ? `${industry}業界向けに最適化された` : "";
  const roiM = (pkg.roiMonthlyJpy / 1_000_000).toFixed(1);
  return `${industryNote}「${pkg.title}」パッケージを推奨します。月次 ROI ${roiM}M 円、SLA ${pkg.slaPct}% で ${pkg.includedMds.length} 本の専門 MD が含まれます。`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function proposeFromText(query: string): PresaleProposal {
  const industry = detectIndustry(query);
  const operation = detectOperation(query);

  let pkg: SolutionPackage | null = null;

  if (operation && OPERATION_TO_PACKAGE[operation]) {
    const catalog = getCatalog();
    pkg = catalog.find((p) => p.id === OPERATION_TO_PACKAGE[operation]) ?? null;
  }

  if (!pkg && industry) {
    const byIndustry = getCatalogByIndustry(industry as never);
    pkg = byIndustry.sort((a, b) => b.roiMonthlyJpy - a.roiMonthlyJpy)[0] ?? null;
  }

  if (!pkg) {
    const catalog = getCatalog();
    pkg = catalog.sort((a, b) => b.roiMonthlyJpy - a.roiMonthlyJpy)[0];
  }

  const pricing = calcPricing(pkg);
  const complianceTags = industry ? (COMPLIANCE_BY_INDUSTRY[industry] ?? []) : [];

  return {
    packageId: pkg.id,
    recommendedPackage: pkg,
    mdBundle: pkg.includedMds,
    pricing,
    expectedSavings: pkg.roiMonthlyJpy,
    complianceTags,
    rationale: buildRationale(pkg, industry),
  };
}
