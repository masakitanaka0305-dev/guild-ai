// GUILD AI — GitHub Onboarding Express
// 6-step deterministic flow: OAuth → repo → analyze → validate → publish → listed
// Total simulated duration < 180s (target ≈ 9s mock, < 180s assertion for tests).

import { scanRepo, validateGithubUrl, type ScanResult, type SuggestedAsset } from "@/lib/repo-scanner";

export type OnboardingStepId =
  | "connect"
  | "select-repo"
  | "analyze"
  | "validate"
  | "publish"
  | "listed";

export interface OnboardingStep {
  id: OnboardingStepId;
  label: string;
  description: string;
  durationMs: number;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "connect",
    label: "GitHub OAuth 接続",
    description: "GitHub アカウントを認証します",
    durationMs: 800,
  },
  {
    id: "select-repo",
    label: "リポジトリ選択",
    description: "公開するリポジトリを選択します",
    durationMs: 500,
  },
  {
    id: "analyze",
    label: "AI コンテンツ解析",
    description: "ナレッジ資産を抽出・分類します",
    durationMs: 3200,
  },
  {
    id: "validate",
    label: "Validation Score 鑑定",
    description: "品質スコアを自動算出します",
    durationMs: 2100,
  },
  {
    id: "publish",
    label: "エンドポイント発行",
    description: "公開 API エンドポイントを生成します",
    durationMs: 1400,
  },
  {
    id: "listed",
    label: "Marketplace 出品完了",
    description: "Intelligence Marketplace に掲載されました",
    durationMs: 500,
  },
];

export const TOTAL_DURATION_MS = ONBOARDING_STEPS.reduce((s, step) => s + step.durationMs, 0);

export interface OnboardingResult {
  handle: string;
  githubUrl: string;
  scanResult: ScanResult;
  topAsset: SuggestedAsset | null;
  endpointSlug: string;
  validationScore: number;
  completedAt: string;
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

export function simulateOnboarding(handle: string, githubUrl: string): OnboardingResult {
  if (!validateGithubUrl(githubUrl)) {
    throw new Error("Invalid GitHub URL");
  }

  const scanResult = scanRepo(githubUrl);
  const topAsset = scanResult.suggestedAssets[0] ?? null;

  const seed = djb2(`${handle}::${githubUrl}`);
  const validationScore = 60 + (seed % 35); // 60–94

  const repoName = githubUrl.split("/").pop() ?? "repo";
  const endpointSlug = `${handle}/${repoName}`;

  return {
    handle,
    githubUrl,
    scanResult,
    topAsset,
    endpointSlug,
    validationScore,
    completedAt: new Date().toISOString(),
  };
}
