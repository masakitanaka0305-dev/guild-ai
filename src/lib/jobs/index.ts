// GUILD AI — Jobs (案件) model
// Mock jobs board with weapon-based eligibility gating.

import type { Job, Weapon, Rank, JobApplication } from "@/types";

const APPLICATIONS_KEY = "guild_job_applications";

export const MOCK_JOBS: Job[] = [
  {
    id: "job_001",
    title: "AIプロダクトのUI設計レビュー",
    description: "新機能のワイヤーフレームをレビューし、UXの改善ポイントをまとめてください。",
    requiredRank: "B",
    requiredTags: ["設計", "PM"],
    reward: 8000,
    category: "設計・PM",
    status: "open",
  },
  {
    id: "job_002",
    title: "LLMプロンプト最適化",
    description: "既存のLLM呼び出しロジックを見直し、コスト削減と精度向上を両立させてください。",
    requiredRank: "A",
    requiredTags: ["AI", "実装"],
    reward: 25000,
    category: "AI・エンジニア",
    status: "open",
  },
  {
    id: "job_003",
    title: "テスト自動化パイプライン構築",
    description: "CI/CDにE2Eテストを統合し、品質ゲートを設定してください。",
    requiredRank: "A",
    requiredTags: ["テスト", "実装"],
    reward: 32000,
    category: "エンジニアリング",
    status: "open",
  },
  {
    id: "job_004",
    title: "Sランク設計ノートの武器化支援",
    description: "システム設計のこだわりノートをドキュメント化し、ナレッジシェアしてください。",
    requiredRank: "S",
    requiredTags: ["設計", "AI"],
    reward: 60000,
    category: "上級・設計",
    status: "open",
  },
  {
    id: "job_005",
    title: "マーケティング施策の言語化",
    description: "プロダクトの強みを整理し、ターゲットに刺さるコピーを書いてください。",
    requiredRank: "B",
    requiredTags: ["マーケ"],
    reward: 12000,
    category: "マーケティング",
    status: "open",
  },
  {
    id: "job_006",
    title: "AIアーキテクチャ全体設計",
    description: "マルチエージェント構成の設計図を作成し、技術選定の根拠を示してください。",
    requiredRank: "S",
    requiredTags: ["AI", "設計", "実装"],
    reward: 120000,
    category: "上級・AI",
    status: "open",
  },
];

const RANK_ORDER: Record<Rank, number> = { S: 3, A: 2, B: 1, D: 0 };

export interface EligibilityResult {
  canApply: boolean;
  matchedWeapon: Weapon | null;
  missingRank: boolean;
  missingTags: string[];
  hint: string;
}

export function checkJobEligibility(weapons: Weapon[], job: Job): EligibilityResult {
  if (weapons.length === 0) {
    return {
      canApply: false,
      matchedWeapon: null,
      missingRank: true,
      missingTags: job.requiredTags,
      hint: "Asset Ledger にノートを登録するとスキルが認定されます",
    };
  }

  const rankOk = (w: Weapon) => RANK_ORDER[w.rank] >= RANK_ORDER[job.requiredRank];
  const tagsOk = (w: Weapon) =>
    job.requiredTags.length === 0 ||
    job.requiredTags.some((t) => w.tags.includes(t));

  const best = weapons.find((w) => rankOk(w) && tagsOk(w));
  if (best) {
    return {
      canApply: true,
      matchedWeapon: best,
      missingRank: false,
      missingTags: [],
      hint: `「${best.title}」で応募できます！`,
    };
  }

  const rankMatch = weapons.find((w) => rankOk(w));
  const tagMatch = weapons.find((w) => tagsOk(w));

  if (!rankMatch) {
    return {
      canApply: false,
      matchedWeapon: null,
      missingRank: true,
      missingTags: job.requiredTags,
      hint: `Asset Ledger で${job.requiredRank}ランクのノートを登録すると応募できます`,
    };
  }

  const missingTags = job.requiredTags.filter(
    (t) => !weapons.some((w) => w.tags.includes(t))
  );
  return {
    canApply: false,
    matchedWeapon: tagMatch ?? null,
    missingRank: false,
    missingTags,
    hint: `Asset Ledger で「${missingTags[0] ?? job.requiredTags[0]}」タグのノートを登録すると応募できます`,
  };
}

export function getApplications(): JobApplication[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) ?? "[]") as JobApplication[];
  } catch {
    return [];
  }
}

export function applyToJob(jobId: string, weaponId: string, reward: number): JobApplication {
  const app: JobApplication = {
    jobId,
    weaponId,
    appliedAt: new Date().toISOString(),
    reward,
  };
  const current = getApplications();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify([...current, app]));
    } catch { /* ignore */ }
  }
  return app;
}
