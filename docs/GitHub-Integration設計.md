# GUILD AI — GitHub Asset Integration 設計

## 概要

GitHub リポジトリを Intelligence Marketplace の知能資産として直接登記するフロー。
NextAuth.js GitHub Provider で OAuth 認証し、Octokit でリポジトリ情報を取得、
Claude AI で 4 項目（課題・本質・鑑定・出口）を生成して登記する。

---

## OAuth スコープ

| スコープ | 理由 |
|---------|------|
| `read:user` | ユーザー名・アバター取得 |
| `repo` | プライベートリポジトリを含むコンテンツ読取 |

---

## フロー図

```
ユーザー
  │
  ├─ [デモ] ConnectGithubButton → /onboarding/repos?mock=1
  │
  └─ [本番] signIn("github") → NextAuth OAuth2 → /onboarding/repos
                │
                ├─ GET /api/repos/list  (Octokit: listForAuthenticatedUser)
                │
                └─ リポジトリ選択 → /onboarding/draft/[owner]/[repo]
                        │
                        ├─ POST /api/repos/analyze
                        │     ├─ getContext() — package.json/go.mod/requirements.txt/Cargo.toml
                        │     ├─ listCommits()
                        │     ├─ getReadme()
                        │     └─ parseIntel() — Claude 3.5 Sonnet (mock fallback)
                        │
                        ├─ ユーザーが 4 項目を編集 + 同意チェック
                        │
                        └─ POST /api/repos/deposit
                              ├─ depositAsset()
                              │     ├─ autoList() → rank + floorPrice
                              │     └─ Supabase insert (optional)
                              └─ 登記完了 (guildId, rank, floorPrice)
```

---

## LLM 入出力スキーマ

### 入力 (IntelInput)

```typescript
interface IntelInput {
  repoName: string;
  readme: string;          // MAX 8192 bytes
  commits: string[];       // 最新 20 件
  snippets: { path: string; content: string }[];  // 最大 5 ファイル × 4096 bytes
  context: {
    language: string;
    runtime: string;
    deps: string[];        // 最大 8 件
  };
}
```

### 出力 (IntelDraft — Zod スキーマ)

```typescript
const IntelDraftSchema = z.object({
  課題: z.string(),        // 解決している問題・バグ・非効率
  本質: z.string(),        // アルゴリズムの核心・ロジックの妙
  鑑定: z.string(),        // 環境整合性・信頼性評価
  出口: z.string(),        // 具体的ユースケース・適用シナリオ
  suggestedTitle: z.string(),       // 20 文字以内
  suggestedTags: z.array(z.string()), // 3-5 個
});
```

---

## 4 項目スキーマ定義

| 項目 | 目的 | 文字数目安 |
|------|------|-----------|
| 課題 | このコードが解決する具体的な問題・バグ・非効率 | 100〜200 文字 |
| 本質 | アルゴリズムの核心、工夫したロジック、設計の妙 | 100〜200 文字 |
| 鑑定 | 動作環境の整合性、想定される信頼性と品質評価 | 100〜200 文字 |
| 出口 | 再利用されるべき具体的なユースケース、適用シナリオ | 100〜200 文字 |

---

## env 雛形

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=your_anthropic_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
MOCK_GITHUB=true
MOCK_DB=true
```

---

## モード切替

| 変数 | 値 | 動作 |
|------|-----|------|
| `GITHUB_CLIENT_ID` | 未設定 | isMockGithub=true → デモリポジトリを使用 |
| `MOCK_GITHUB` | `"true"` | 強制モックモード |
| `ANTHROPIC_API_KEY` | 未設定 | mockIntelDraft() でフォールバック |
| `SUPABASE_URL` | 未設定 | getDb() → null → インメモリ保存 |

---

## ファイル構成

```
src/
├── lib/
│   ├── next-auth.ts           # NextAuth options + isMockGithub
│   ├── repo-context/          # extractContext() + getContext()
│   ├── intel-parser/          # parseIntel() + mockIntelDraft()
│   ├── asset-deposit/         # depositAsset() + getDeposit()
│   └── db/                    # getDb() Supabase optional helper
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth route handler
│   │   └── repos/
│   │       ├── list/           # GET — repo list
│   │       ├── analyze/        # POST — AI analysis
│   │       └── deposit/        # POST — asset deposit
│   └── onboarding/
│       ├── repos/              # Repo grid page
│       └── draft/[owner]/[repo]/ # Editable draft + approve
└── components/
    ├── ConnectGithubButton.tsx
    └── SessionProviderWrapper.tsx
```
