# MainHeader 設計（タイミー型中央タイトルヘッダー）

## 概要

タイミー・LINE Pay などの JP アプリに習い、モバイルヘッダーを
「GUILD AI ロゴ左寄せ」から「ページタイトル中央寄せ」に刷新。
戻るボタン（左）· ページタイトル（中央）· 通知ベル（右）の3ゾーン構成。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/nav-config.ts` | ページタイトルマップ・showBackButton ロジック |
| `src/components/MainHeader.tsx` | 新ヘッダーコンポーネント |

## レイアウト

```
┌─────────────────────────────────┐
│  [←]    ページタイトル    [🔔]  │  h: 56px
└─────────────────────────────────┘
sticky top-0 · backdrop-blur-sm · bg/95
```

- 左ゾーン（w-9）: `showBackButton()` が true の時だけ `router.back()` ボタン表示
- 中央: `getPageTitle(pathname)` の結果。`absolute left-1/2 -translate-x-1/2` で真中
- 右ゾーン（w-9）: 通知ベル

## ページタイトルマッピング（主要）

| パス | タイトル |
|------|---------|
| `/` | ホーム |
| `/bank` | 投稿 |
| `/sell` | 出品 |
| `/guild` | マイ銀行 |
| `/disputes` | 紛争解決センター |
| `/business/checkout` | プラン申し込み |
| `/asset/*` | アセット詳細 |
| (未知) | GUILD AI |

## 戻るボタン表示ルール

ルートナビゲーション(`/`, `/bank`, `/jobs`, `/guild`, `/marketplace`, `/showcase`)では非表示。
それ以外（詳細ページ・設定ページ等）では表示。

## GUILD AI ロゴの扱い変更

- デスクトップサイドバー: そのまま維持（`w-8 h-8 rounded-2xl` + "GUILD AI" テキスト）
- モバイルヘッダー: ロゴ削除 → ページタイトルに置換

## テスト保証

`src/lib/__tests__/nav-config.test.ts`（5テスト）:
- PAGE_TITLES に全主要ルートのエントリが存在
- getPageTitle の既知ルート変換
- 動的ルート（/asset/xxx など）の処理
- 未知ルートのデフォルト値
- showBackButton のルートナビゲーション判定
