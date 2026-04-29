# Friendly Intelligence Bank — デザイン設計書

> **⚠️ テーマ注記（v13 更新）**
> GUILD AI のデフォルトテーマは **なめらかテーマ** (`data-theme="nameraka"`) になりました。
> 本書は **kawaii テーマ** の仕様書です。ThemeToggle で「Kawaii」を選択した場合にのみ適用されます。
> Terminal Theme の仕様は [`docs/Terminal-Theme設計.md`](./Terminal-Theme設計.md) を参照。

## 1. カラートークン

| トークン名 | HEX | 用途 |
|---|---|---|
| `snow` | `#FFFFFF` | 主背景（白） |
| `snow-soft` | `#FAFAF7` | サブ背景・コードブロック |
| `gold` | `#D4A437` | リッチゴールド・強調色 |
| `gold-soft` | `#F2DFA0` | ゴールドのやわらかいバリアント |
| `gold-light` | `#FFF8DC` | ゴールド背景の薄い版 |
| `timee-yellow` | `#FFCC00` | タイミーイエロー（既存 ACCENT と同値） |
| `ink` | `#1A1628` | 主テキスト（= kuroko） |
| `ink-muted` | `#6F6884` | 補助テキスト |

既存の `kaki / accent-green` は副系統として保持。kawaii テーマの主役は上記 friendly トークン。

## 2. 演出タイムライン

### /bank（ちえをのこす）
| フェーズ | 演出 | 所要時間 |
|---|---|---|
| ファイル受付 | Shimaenaga `mode="watch"` 瞳スイープ | 連続（1.6s ループ） |
| スキャン中 | 「スキャンちゅう...」 + ゴールドスタンプが上から降下 | 0.6s delay → 0.55s drop |
| ランク確定 | スタンプ「ポンッ！」 + playStampChime() | 0.55s |
| 武器化完了 | 紙吹雪 + playPassbookChime() | 2s |

### /guild（おたからをかくにんする）
| フェーズ | 演出 | 所要時間 |
|---|---|---|
| ループ実演完了 | CoinRain（8コイン × 0.08s stagger） + 紙吹雪 | 0.9s fall × 8 |

### ループ実演ボタン（/guild）
合計 **4.6s**（ステップ 800→1000→800→700→700→600ms）

## 3. 音のマッピング

| 音 | 関数 | 周波数 | 長さ | 用途 |
|---|---|---|---|---|
| チャリン（金貨） | `playPassbookChime()` | 440/220/880Hz | 0.8s | 通帳記録・クエスト応募 |
| ポヨン（ノート保存） | `playPoyon()` | 150→250Hz sweep | 0.18s | ノート入力確定 |
| ポンッ！（スタンプ） | `playStampChime()` | 1200/800/400Hz | 0.25s | スタンプ押印 |
| 水琴窟（達成） | `playSuccessChime()` | 700/350/1400Hz | 0.6s | 武器化完了・ループ実演完了 |

## 4. Shimaenaga モード一覧（更新版）

| mode | 説明 | 用途 |
|---|---|---|
| `avatar` | まばたきアニメ | 一般ナビ・ガイド |
| `seal` | 認証スタンプ円形 | ヘッダー受付 |
| `guardian` | 翼を広げた守り神 | 武器化完了・武器庫ヘッダー |
| `watch` | 瞳が左右スイープ（1.6s） | スキャン中の「じーっ」演出 |

## 5. RankBadge friendly モード

| rank | バッジ名 | サブラベル | グラデーション |
|---|---|---|---|
| S | 金 | すごい！ | `#F2DFA0 → #D4A437` |
| A | 銀 | いいかんじ | `#E8E8E8 → #ABABAB` |
| B | 銅 | これから | `#F0C890 → #B87333` |

アクセシビリティ：`aria-label="金バッジ — すごい！"` 形式で色のみに依存しない。

## 6. ShimaenagaGuide — 吹き出しコピー集

| ページ | コピー |
|---|---|
| `/bank` | ノートをここにおいてみよう！ |
| `/guild` | ためしに ちえを のこしてみよう！ |
| `/jobs` | 金マークの おねがいから やってみよう！ |
| `/sell` | GitHubを えらぶだけで できるよ！ |
| その他 | まずは ちえを のこすところから はじめよう！ |
| エラー時 | ごめんね、ちょっと まちがえちゃった |

- 閉じると 5 秒後にちょこんと戻る
- Pro モード時はステルス（アイコンのみ、吹き出し抑制）
- `role="status"` + `aria-live="polite"` でスクリーンリーダー対応

## 7. useTactile — 振動パターン

| context | 振動 (ms) | 音 |
|---|---|---|
| `stamp` | [15] | playStampChime |
| `poyon` | [8] | playPoyon |
| `coin` | [10, 5, 10] | playPassbookChime |
| `quest` | [12] | playPassbookChime |

`prefers-reduced-motion: reduce` のとき振動をスキップ。

## 8. Pro モード切替の挙動

1. トグルをクリック → `transition-colors duration-300 ease-out` でスイッチが反転
2. `ProRadialOverlay` が `clip-path: circle(0%→150%)` で 0.4s 全画面フラッシュ
3. `prefers-reduced-motion` 時はフェードに置換（`animation: none`）
4. Pro ON 時：ShimaenagaGuide はステルスモード（アイコンのみ）、角丸縮小（`rounded-md`）、Raw Data 初期展開

## 9. 文言ルール（kawaii テーマ）

- 重要ボタン：のこす／うけとる／つかう／もらう／みる（3〜5 字ひらがな主体）
- 案件ボタン：「えらんでもらう」
- 武器化ボタン：「ぶきにしてのこす」
- 銀行ヘッダー：「キミの知恵（ちえ）をのこす」
- 案件ページ見出し：「いまスグできる おねがい（クエスト）」
- 漢字率 ≤ 30% を目安（技術ドキュメント・API ルートは除外）
