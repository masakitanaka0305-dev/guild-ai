// Solution Catalog — standardized B2B solution packages

export type Industry = "金融" | "医療" | "小売" | "製造";
export type SlaPct = 99.5 | 99.9;
export type MinTier = "team" | "enterprise" | "enterprise-plus";

export interface SolutionPackage {
  id: string;
  title: string;
  summary: string;
  industries: Industry[];
  includedMds: string[];   // GUILD-IDs
  roiMonthlyJpy: number;
  slaPct: SlaPct;
  minTier: MinTier;
}

// ─── Static catalog (deterministic mock) ─────────────────────────────────────

const CATALOG: SolutionPackage[] = [
  {
    id: "pkg-001",
    title: "請求書 PDF 自動仕分け",
    summary: "PDF 請求書を OCR + LLM で解析し、勘定科目を自動分類。承認フローへ直接連携。",
    industries: ["金融", "製造"],
    includedMds: ["GUILD:INV001", "GUILD:OCR002", "GUILD:ACC003"],
    roiMonthlyJpy: 1_200_000,
    slaPct: 99.9,
    minTier: "enterprise",
  },
  {
    id: "pkg-002",
    title: "コールログ要約 → CRM 反映",
    summary: "通話録音を自動文字起こし・要約し、Salesforce / HubSpot のアクティビティに即時書き込み。",
    industries: ["小売", "製造"],
    includedMds: ["GUILD:CALL004", "GUILD:SUM005", "GUILD:CRM006", "GUILD:NLP007"],
    roiMonthlyJpy: 850_000,
    slaPct: 99.5,
    minTier: "enterprise",
  },
  {
    id: "pkg-003",
    title: "営業メールの ABM 化",
    summary: "リードの属性・行動ログから最適メール文面を自動生成。業種・役職・フェーズ別にパーソナライズ。",
    industries: ["製造", "小売"],
    includedMds: ["GUILD:ABM008", "GUILD:LEAD009", "GUILD:COPY010"],
    roiMonthlyJpy: 620_000,
    slaPct: 99.5,
    minTier: "team",
  },
  {
    id: "pkg-004",
    title: "在庫予測 + 自動発注",
    summary: "売上履歴・季節性・リードタイムを統合し、欠品率を 90% 削減。発注書を ERP に自動送信。",
    industries: ["製造", "小売"],
    includedMds: ["GUILD:INV011", "GUILD:PRED012", "GUILD:ERP013", "GUILD:ALER014"],
    roiMonthlyJpy: 2_400_000,
    slaPct: 99.9,
    minTier: "enterprise",
  },
  {
    id: "pkg-005",
    title: "コンプラ チャットモニタ",
    summary: "社内チャット・メールをリアルタイム解析し、インサイダー・ハラスメント・情報漏洩をフラグ。",
    industries: ["金融"],
    includedMds: ["GUILD:COMP015", "GUILD:FLAG016", "GUILD:RPT017"],
    roiMonthlyJpy: 3_500_000,
    slaPct: 99.9,
    minTier: "enterprise-plus",
  },
  {
    id: "pkg-006",
    title: "医療記録 OCR + 分類",
    summary: "手書きカルテ・処方箋を電子化し、ICD-10 コードで自動分類。電子カルテシステムに連携。",
    industries: ["医療"],
    includedMds: ["GUILD:MED018", "GUILD:OCR019", "GUILD:ICD020"],
    roiMonthlyJpy: 1_800_000,
    slaPct: 99.9,
    minTier: "enterprise-plus",
  },
  {
    id: "pkg-007",
    title: "EC サイト レビュー感情分析",
    summary: "商品レビューを感情スコア化し、改善優先度マップと週次レポートを自動生成。",
    industries: ["小売"],
    includedMds: ["GUILD:SENT021", "GUILD:REPT022"],
    roiMonthlyJpy: 380_000,
    slaPct: 99.5,
    minTier: "team",
  },
  {
    id: "pkg-008",
    title: "契約書 リスクチェック",
    summary: "NDA・業務委託契約書をアップロードするだけでリスク条項を抽出し、弁護士確認優先度を付与。",
    industries: ["金融", "製造"],
    includedMds: ["GUILD:CONT023", "GUILD:RISK024", "GUILD:CLAUS025"],
    roiMonthlyJpy: 950_000,
    slaPct: 99.5,
    minTier: "enterprise",
  },
  {
    id: "pkg-009",
    title: "社内ナレッジ Q&A Bot",
    summary: "社内規程・マニュアル・過去事例を RAG で検索し、正確な回答を Slack / Teams に返答。",
    industries: ["製造", "金融"],
    includedMds: ["GUILD:RAG026", "GUILD:SRCH027", "GUILD:KB028"],
    roiMonthlyJpy: 560_000,
    slaPct: 99.5,
    minTier: "team",
  },
  {
    id: "pkg-010",
    title: "保険申請 自動審査",
    summary: "申請書類を読み取り、過去事例との類似度・規約適合性を判定。人手審査件数を 70% 削減。",
    industries: ["金融", "医療"],
    includedMds: ["GUILD:INS029", "GUILD:CLM030", "GUILD:RULE031", "GUILD:AUDIT032"],
    roiMonthlyJpy: 2_100_000,
    slaPct: 99.9,
    minTier: "enterprise-plus",
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

export function getCatalog(): SolutionPackage[] {
  return CATALOG;
}

export function getPackage(id: string): SolutionPackage | null {
  return CATALOG.find((p) => p.id === id) ?? null;
}

export function getCatalogByIndustry(industry: Industry): SolutionPackage[] {
  return CATALOG.filter((p) => p.industries.includes(industry));
}
