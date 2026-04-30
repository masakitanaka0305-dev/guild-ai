# Onboarding Express 設計

> 2〜3分で GitHub リポジトリから Intelligence Marketplace に出品するフロー

## 概要

GitHub リポジトリ URL を入力するだけで、AI 解析 → Validation Score 算出 → 
エンドポイント発行 → Marketplace 掲載まで自動完結する高速オンボーディング。

## 6 ステップ

| # | ステップ ID | 表示名 | 目的 | 想定時間 |
|---|------------|--------|------|---------|
| 1 | `connect` | GitHub OAuth 接続 | 認証トークン取得（モック） | 0.8s |
| 2 | `select-repo` | リポジトリ選択 | 対象リポジトリの特定 | 0.5s |
| 3 | `analyze` | AI コンテンツ解析 | MD ファイル抽出・分類 | 3.2s |
| 4 | `validate` | Validation Score 鑑定 | 品質スコア算出（60〜94） | 2.1s |
| 5 | `publish` | エンドポイント発行 | AtoA API URL 生成 | 1.4s |
| 6 | `listed` | Marketplace 出品完了 | 公開 | 0.5s |

**合計: 約 8.5 秒（UI 体感）/ 180 秒以内（テスト保証値）**

## データフロー

```
GitHub URL
  → scanRepo(url)       // src/lib/repo-scanner
  → suggestedAssets[]   // S/A/B ランク付き
  → simulateOnboarding(handle, url)
    → validationScore (djb2 シード, 60〜94)
    → endpointSlug (handle/repoName)
```

## a11y

- 進行中: `<section aria-live="polite" role="status">`
- 各ステップ: `<li aria-current="step">` (アクティブ時)
- プログレスバー: `<div>` + `style.width` パーセント

## ロールバックポイント

| フェーズ | 対応 |
|---------|------|
| OAuth 接続失敗 | エラートースト + form にリセット |
| AI 解析タイムアウト | ステップ 3 で 10s 超過 → フォールバックスコア 60 |
| エンドポイント衝突 | slug に `-2` サフィックス追加 |

## レスポンシブ

- 375px: 1 カラム、ステップ説明は折りたたみ
- 768px: 同上
- 1280px: サイドバー付き 2 カラムに昇格（v2）

## セキュリティ

- GitHub URL のバリデーション: `^https?://github\.com/[\w.-]+/[\w.-]+`
- エンドポイントスラグは英数字 + `/` のみ（XSS 防止）
- 本番では GitHub App 経由で OAuth トークンを取得する（v2）
