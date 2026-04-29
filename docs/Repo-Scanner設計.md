# Repo Scanner 設計（#96 Anti-Failure Protocol）

## 概要

GitHub リポジトリ URL を入力するだけで MD 資産候補を一括抽出する「ゼロ摩擦 バルク預け入れ」機能。
ユーザーが1つずつファイルをアップロードする手間を排除し、リポジトリ全体から価値のある MD を検出する。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/repo-scanner/index.ts` | スキャンロジック本体 |
| `src/components/BulkDepositSection.tsx` | `/sell` ページ下部の UI コンポーネント |

## アーキテクチャ

### `validateGithubUrl(url)`

```
正規表現: /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/
```

- `https://github.com/user/repo` → `true`
- `github.com/user/repo` → `false`（プロトコルなし）
- `https://not-github.com/` → `false`

### `scanRepo(githubUrl): ScanResult`

決定論的実装（djb2 ハッシュ + LCG）:

1. URL を djb2 でハッシュ化 → `seed`
2. `seed % 8 + 5` でファイル総数を決定（5–12）
3. README.md を常に含める（mdScore ≥ 85）
4. MD_PATHS から追加 MD ファイルを選択（2–5件）
5. CODE_PATHS からコードファイルを選択（残り枠）
6. MD ファイルの mdScore → S(≥80) / A(≥50) / B でランク付け

### UI フロー（BulkDepositSection）

```
URL 入力 → スキャン開始 → 600ms 疑似待機
→ チェックリスト表示（全件デフォルト選択）
→ 選択確定 → 「N 件一括登録」完了メッセージ
```

## 返却型

```typescript
interface ScanResult {
  githubUrl: string;
  files: ScannedFile[];          // type: "md" | "code" | "config" | "other"
  suggestedAssets: SuggestedAsset[];  // rank S/A/B, suggestedPriceJpy
  summary: ScanSummary;          // totalFiles, mdCount, codeCount, readmeFound
}
```

## 価格提案

| ランク | 提案価格 |
|--------|---------|
| S | ¥800 |
| A | ¥400 |
| B | ¥150 |

## テスト保証

`src/lib/__tests__/anti-failure.test.ts` の repo-scanner セクション（4テスト）:
- 同一 URL で決定論的
- README.md を常に含む（mdScore ≥ 85）
- ファイル数 5–12 の範囲
- validateGithubUrl の正当/不当 URL 判定
