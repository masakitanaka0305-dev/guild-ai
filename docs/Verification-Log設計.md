# Verification Log 設計

## 概要

`src/lib/verification-log/index.ts` が提供する決定論的モック実行ログ。
`/asset/[id]` の中段「実行エビデンス」セクションで利用する。

## データ構造

| フィールド    | 型           | 説明                        |
|-------------|-------------|----------------------------|
| ts          | string (ISO) | 実行タイムスタンプ（過去30日以内）|
| env         | prod / staging / pilot | 実行環境 |
| outcome     | success / partial / fail | 実行結果 |
| durationMs  | number      | 応答時間（50–950ms）         |
| region      | tokyo / osaka / fukuoka / singapore / seoul | 実行地域 |
| payerType   | individual / business / agent | 呼び出し元種別 |
| hash        | string (hex) | トランザクション識別子        |

## 実装詳細

- `djb2` ハッシュ + `lcg` で guildId から完全決定論的に生成
- `getVerificationLog(guildId, count=50)` で 50 件のログを返す
- 結果は `summary` と `entries` に分離
- Outcome の重み: success 90% / partial 7% / fail 3%

## UI コンポーネント

`src/components/VerificationLogSection.tsx`
- "use client" — `useState` で「もっと見る」展開
- 初期表示: 5 件 → 展開で全 50 件
- 4 つのサマリーメトリクスカード（総実行回数・成功率・最終成功日・環境数）
- `<table>` + `<caption>` でアクセシブルなログテーブル

## 設計原則

- 外部 API 呼び出し不要（モック）
- guildId が同じなら常に同じ結果を返す（テスト安定性）
- 数値はすべて実際のデプロイ環境で観測し得る範囲に設定
