// GUILD AI — Projects (案件) marketplace model
// URL-based routing: /projects/[id] — SSG-friendly, no client state required.

import type { Rank } from "@/types";

export interface ProjectRequiredMd {
  id: string;       // md interface identifier
  rankMin: Rank;    // minimum rank accepted
  weight: number;   // importance 1-3
  label: string;    // human-readable name
}

export type ProjectStatus = "open" | "applied" | "executing" | "settling" | "settled";

export interface Project {
  id: string;
  title: string;
  description: string;
  industry: string;
  techStack: string[];
  requiredMdInterfaces: ProjectRequiredMd[];
  grossRewardJpy: number;
  platformFeePct: number;   // e.g. 5 = 5%
  rentalFeeHourlyJpy: number; // hourly rental cost if renting missing MDs
  deadline: string;          // ISO date YYYY-MM-DD
  applicantCount: number;
  clientHandle: string;
  sesChallenge?: string;     // SES現場課題: infra constraint or legal issue
  status: ProjectStatus;
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj_001",
    title: "金融インフラ監視パイプラインの刷新",
    description: "レガシー監視スクリプトをOpenTelemetry + Grafana Cloudへ移行。SLO定義・アラート設計・ダッシュボード構築まで一貫して担当。",
    industry: "金融・インフラ",
    techStack: ["Go", "OpenTelemetry", "Grafana", "Postgres"],
    requiredMdInterfaces: [
      { id: "md_observability", rankMin: "A", weight: 3, label: "可観測性設計" },
      { id: "md_infra_go",      rankMin: "A", weight: 2, label: "Goインフラ実装" },
      { id: "md_slo_policy",    rankMin: "B", weight: 1, label: "SLO・アラート設計" },
    ],
    grossRewardJpy: 420_000,
    platformFeePct: 5,
    rentalFeeHourlyJpy: 3_500,
    deadline: "2026-05-30",
    applicantCount: 21,
    clientHandle: "fintech_corp_jp",
    sesChallenge: "オンプレ帯域制限（1Gbps 上限）+ 金融庁ガイドラインの監査ログ要件 (7 年保管)。",
    status: "open",
  },
  {
    id: "proj_002",
    title: "ECサイト購買予測MLパイプライン構築",
    description: "月次バッチ→リアルタイムフィーチャーストアへ移行。行動ログからクリック率・転換率を予測するモデルのシステム設計と実装。",
    industry: "EC・Retail",
    techStack: ["Python", "dbt", "BigQuery", "Vertex AI"],
    requiredMdInterfaces: [
      { id: "md_ml_pipeline",   rankMin: "S", weight: 3, label: "MLパイプライン設計" },
      { id: "md_feature_store", rankMin: "A", weight: 2, label: "フィーチャーストア" },
      { id: "md_dbt_modeling",  rankMin: "B", weight: 1, label: "dbtモデリング" },
    ],
    grossRewardJpy: 680_000,
    platformFeePct: 5,
    rentalFeeHourlyJpy: 5_000,
    deadline: "2026-06-15",
    applicantCount: 14,
    clientHandle: "retail_ai_kk",
    sesChallenge: "個人情報保護法改正（2025年施行）に伴う購買データの取り扱い厳格化。EU向け越境EC対応でGDPR同等水準が必要。",
    status: "open",
  },
  {
    id: "proj_003",
    title: "マルチエージェント社内ナレッジ検索基盤",
    description: "RAG + Agentアーキテクチャで社内WikiおよびConfluenceを横断検索。Slack Botとして組み込み、問い合わせ数を50%削減することが目標。",
    industry: "エンタープライズ・HR",
    techStack: ["TypeScript", "LangChain", "Pinecone", "Slack API"],
    requiredMdInterfaces: [
      { id: "md_rag_design",    rankMin: "S", weight: 3, label: "RAG設計" },
      { id: "md_agent_arch",    rankMin: "A", weight: 3, label: "Agentアーキテクチャ" },
      { id: "md_slack_bot",     rankMin: "B", weight: 1, label: "Slack Bot実装" },
    ],
    grossRewardJpy: 560_000,
    platformFeePct: 5,
    rentalFeeHourlyJpy: 4_200,
    deadline: "2026-05-20",
    applicantCount: 33,
    clientHandle: "enterprise_hr_corp",
    sesChallenge: "情報漏洩対策としてLLMへの社外送信禁止。オンプレミスLLM（Llama-3-70B）限定運用の要件がある。",
    status: "open",
  },
  {
    id: "proj_004",
    title: "IoT工場ラインのリアルタイム異常検知",
    description: "センサーデータ（振動・温度・電流）をストリーム処理し、異常パターンを秒単位で検出。PLC連携とアラート自動発報まで含む。",
    industry: "製造・IoT",
    techStack: ["Rust", "Kafka", "InfluxDB", "Grafana"],
    requiredMdInterfaces: [
      { id: "md_stream_rust",   rankMin: "S", weight: 3, label: "Rustストリーム処理" },
      { id: "md_iot_protocol",  rankMin: "A", weight: 2, label: "IoTプロトコル設計" },
      { id: "md_timeseries_db", rankMin: "B", weight: 1, label: "時系列DB設計" },
    ],
    grossRewardJpy: 780_000,
    platformFeePct: 5,
    rentalFeeHourlyJpy: 6_000,
    deadline: "2026-07-01",
    applicantCount: 9,
    clientHandle: "factory_dx_inc",
    sesChallenge: "工場ラインの稼働率99.9%保証。メンテナンス窓は深夜2時間のみ。PLCベンダーロック（三菱電機）あり。",
    status: "open",
  },
  {
    id: "proj_005",
    title: "コンプライアンス自動監査レポート生成",
    description: "金融規制（FISC、ISMS、SOC2）に準拠した監査証跡を自動収集・レポート化。四半期ごとのリリースサイクルに対応したCI統合まで。",
    industry: "法務・コンプライアンス",
    techStack: ["Python", "AWS Lambda", "DynamoDB", "LaTeX"],
    requiredMdInterfaces: [
      { id: "md_compliance",    rankMin: "A", weight: 3, label: "コンプライアンス設計" },
      { id: "md_audit_trail",   rankMin: "A", weight: 2, label: "監査証跡実装" },
      { id: "md_report_gen",    rankMin: "B", weight: 1, label: "レポート生成" },
    ],
    grossRewardJpy: 350_000,
    platformFeePct: 5,
    rentalFeeHourlyJpy: 3_000,
    deadline: "2026-05-25",
    applicantCount: 17,
    clientHandle: "finreg_solutions",
    sesChallenge: "FISC安全対策基準（第11版）と改正個人情報保護法の同時準拠。クラウド証拠保全の法的要件が不明確。",
    status: "open",
  },
  {
    id: "proj_006",
    title: "モバイルアプリ型AIコーチング基盤",
    description: "フィットネス・睡眠・食事データをLLMで解析し、パーソナライズされた週次コーチングを生成。Apple HealthKit / Google Fit連携含む。",
    industry: "ヘルスケア・モバイル",
    techStack: ["React Native", "TypeScript", "OpenAI", "Supabase"],
    requiredMdInterfaces: [
      { id: "md_react_native",  rankMin: "A", weight: 2, label: "React Native実装" },
      { id: "md_llm_coaching",  rankMin: "S", weight: 3, label: "LLMコーチング設計" },
      { id: "md_health_api",    rankMin: "B", weight: 1, label: "HealthKit連携" },
    ],
    grossRewardJpy: 490_000,
    platformFeePct: 5,
    rentalFeeHourlyJpy: 4_000,
    deadline: "2026-06-30",
    applicantCount: 28,
    clientHandle: "health_coach_app",
    sesChallenge: "医療機器該当性の回避（薬機法リスク）。Apple審査でヘルスデータ利用目的の明示が必須。",
    status: "open",
  },
];

const RANK_SCORE: Record<Rank, number> = { S: 3, A: 2, B: 1, D: 0 };

/** djb2 hash for deterministic pseudo-random values */
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

export function getProject(id: string): Project | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id);
}

export function getProjectRankScore(rank: Rank): number {
  return RANK_SCORE[rank];
}

/** In-memory escrow store for environments without DATABASE_URL */
interface EscrowReserve {
  id: string;
  projectId: string;
  applicantHandle: string;
  mdRentalIds: string[];
  totalReservedMilliJpy: number;
  status: "pending" | "executing" | "settling" | "settled";
  createdAt: string;
}

const escrowStore = new Map<string, EscrowReserve>();

export function createEscrowReserve(
  projectId: string,
  applicantHandle: string,
  mdRentalIds: string[],
  totalReservedMilliJpy: number,
): EscrowReserve {
  const id = `esv_${djb2(projectId + applicantHandle + Date.now().toString()).toString(16).slice(0, 8)}`;
  const reserve: EscrowReserve = {
    id,
    projectId,
    applicantHandle,
    mdRentalIds,
    totalReservedMilliJpy,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  escrowStore.set(id, reserve);
  return reserve;
}

export function getEscrowReserve(id: string): EscrowReserve | undefined {
  return escrowStore.get(id);
}

export function advanceEscrowStatus(id: string): EscrowReserve | null {
  const r = escrowStore.get(id);
  if (!r) return null;
  const next: Record<EscrowReserve["status"], EscrowReserve["status"]> = {
    pending: "executing",
    executing: "settling",
    settling: "settled",
    settled: "settled",
  };
  r.status = next[r.status];
  return r;
}

export function _resetEscrowStore(): void {
  escrowStore.clear();
}
