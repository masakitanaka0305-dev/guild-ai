// GUILD AI — GitHub Picker (mock)
// Returns deterministic repo list seeded from username. No PAT required.

export interface MockRepo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  recommended: boolean;
  isPrivate?: boolean;
  updatedAt?: string;
}

const REPO_TEMPLATES: { name: string; desc: string }[] = [
  { name: "ai-agent",       desc: "自律型 AI エージェントフレームワーク" },
  { name: "llm-toolkit",    desc: "LLM 統合ツールキット" },
  { name: "data-pipeline",  desc: "高スループットデータパイプライン" },
  { name: "api-gateway",    desc: "マイクロサービス用 API ゲートウェイ" },
  { name: "smart-contract", desc: "Web3 スマートコントラクトライブラリ" },
  { name: "ml-runner",      desc: "分散機械学習ランナー" },
  { name: "embed-search",   desc: "ベクトル埋め込み検索エンジン" },
  { name: "code-gen",       desc: "AI コード生成モジュール" },
  { name: "chat-bot",       desc: "マルチモーダル会話エージェント" },
  { name: "vector-db",      desc: "インメモリベクトルデータベース" },
];

const LANGUAGES = ["TypeScript", "Python", "Go", "Rust", "JavaScript"];

const README_TEMPLATES: Array<{ keywords: string[]; content: string }> = [
  {
    keywords: ["agent", "llm", "chat", "code"],
    content: `# {name}
{desc}

このリポジトリは LangChain と OpenAI GPT-4 を使った自律型エージェントの実装です。TypeScript + Next.js で構築されており、Vercel に即座にデプロイできます。

## 技術スタック
- TypeScript / Next.js
- OpenAI API
- LangChain
- Vercel

## 特徴
- ストリーミングレスポンス対応
- マルチターン会話管理
- ツール呼び出し（Function Calling）
`,
  },
  {
    keywords: ["data", "pipeline", "ml", "runner"],
    content: `# {name}
{desc}

高パフォーマンスなデータ処理パイプラインです。Python と Go で実装され、大規模データセットを効率的に処理します。Docker コンテナで動作します。

## 技術スタック
- Python
- Go
- Docker

## 特徴
- 並列処理対応
- リアルタイムモニタリング
- エラーリカバリー機能
`,
  },
  {
    keywords: ["embed", "search", "vector", "db"],
    content: `# {name}
{desc}

ベクトル類似検索エンジンです。TypeScript と Rust で実装され、高速なセマンティック検索を提供します。

## 技術スタック
- TypeScript
- Rust
- React

## 特徴
- ミリ秒レベルの検索速度
- 多次元ベクトル対応
- REST API 付き
`,
  },
];

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Alias for listRepos — used by GitHub Integration routes in mock mode. */
export function getMockRepos(username: string): MockRepo[] {
  return listRepos(username);
}

export function listRepos(user: string): MockRepo[] {
  const seed = djb2(user || "demo");

  // Compute stars for each repo to find recommended (highest stars)
  const starValues = REPO_TEMPLATES.map((_, i) => ((seed * (i + 1)) % 500) + 10);
  const maxStars = Math.max(...starValues);
  const recommendedIdx = starValues.indexOf(maxStars);

  return REPO_TEMPLATES.map((t, i) => ({
    id: `repo-${seed}-${i}`,
    name: t.name,
    fullName: `${user || "demo"}/${t.name}`,
    description: t.desc,
    url: `https://github.com/${user || "demo"}/${t.name}`,
    language: LANGUAGES[(seed + i) % LANGUAGES.length],
    stars: starValues[i],
    recommended: i === recommendedIdx,
  }));
}

/** Returns a deterministic mock README for a given repo. */
export function fetchReadme(repo: MockRepo): string {
  const seed = djb2(repo.name);
  const template = README_TEMPLATES[seed % README_TEMPLATES.length];
  return template.content
    .replace("{name}", repo.fullName)
    .replace("{desc}", repo.description);
}
