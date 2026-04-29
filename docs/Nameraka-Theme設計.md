# なめらかテーマ設計書（Intelligence-as-a-Transaction）

> コンセプト：**知恵（MD）を金塊（資産）に変える、日本で最も使いやすく稼げる「知能の銀行」**
> ベンチマーク：メルカリの出品の速さ ＋ タイミーの即時報酬

---

## 1. デザイントークン

| トークン | 値 | 用途 |
|----------|-----|------|
| `--n-bg` | `#0A192F` | 濃紺ベース背景 |
| `--n-surface` | `#0E2240` | カード・サーフェス |
| `--n-surface-2` | `#122A4D` | インナーサーフェス |
| `--n-divider` | `#1F3A66` | 区切り線 |
| `--n-text` | `#F1F4F9` | 主テキスト |
| `--n-muted` | `#9FB1C8` | 補助テキスト |
| `--n-gold` | `#D4AF37` | アクション・重要指標 |
| `--n-gold-soft` | `#F2DFA0` | ゴールドの柔らかい版 |
| `--n-positive` | `#4DD08F` | 加算・成功 |
| `--n-negative` | `#FF7676` | 減算・エラー |

角丸：`rounded-2xl`（16px）基本、主要カードは `rounded-3xl`、ボタンは `rounded-full`

フォント：本文 `-apple-system / Yu Gothic / Noto Sans JP`。数値 `JetBrains Mono + tabular-nums`

アニメーション：180〜260ms `ease-out`。Pro の 100ms キャップは nameraka では外れる（220ms デフォルト）。

---

## 2. ナビラベル（nameraka 専用）

| パス | ラベル | 説明 |
|------|--------|------|
| `/` | ホーム | タイル型マーケット概観 |
| `/bank` | のこす | ノート提出→鑑定 |
| `/jobs` | かせぐ | 適合率ベースの案件一覧 |
| `/guild` | マイ銀行 | AUM・通帳・おだちん |
| `/sell` | はじめての提出 | ミニマル 3-step |
| `/wallet` | おさいふ | 通帳・お知らせ |

---

## 3. 画面別レイアウト

### ホーム（/）

- ヒーロー（小型）：「知恵を、金塊に。」+ サブコピー
- 市場の熱量バー：直近 5 分のパルス可視化（1.8s 更新）
- 2 タブ：「新着の知恵」「おすすめ案件」
- タイルグリッド：モバイル 1 列 / タブレット 2 列 / PC 3 列

**知恵タイル**：タイトル / 概要 1 行 / 査定額レンジ（¥XXX〜）/ 格付プレート mini / 著者ハンドル

**案件タイル**：タイトル / カテゴリ / 適合率% / 報酬 / リンク先

### のこす（/bank）

1. 中央大型ドロップエリア（テキスト貼付可）
2. 査定額レンジ（入力文字数に応じてリアルタイム表示）
3. 提出ボタン：`rounded-full` グラデーション CTA
4. 0.6s ゴールドスキャンライン演出 → 鑑定結果
5. 結果：格付プレート大型中央表示 + 査定額レンジ
6. **0秒換金オファー**（S/A のみ）：`⚡ いまだけ ¥XX,XXX で即時買い取り`

#### 0秒換金オファー計算式
```
amount = clamp(score × 800, 5000, 500000)
```

#### 査定額レンジ計算式
```
center = clamp(score × 800, 500, 500000)
min    = max(500, round(center × 0.6))
max    = min(500000, round(center × 1.4))
```

### かせぐ（/jobs）

- 縦カード一覧
- 各カード：カテゴリ / 適合率% / タイトル / 説明 / 必要バッジ / 報酬
- 「この知恵で応募」CTA → 即採用モーダル（採用されました！ + 着金額）

#### 適合率計算式（`computeFit`）
```
seed       = sum of charCodes of jobId
baseMatch  = (seed % 40) + 30        // 30–69
recipeBonus = min(30, recipeCount × 8)
fit        = min(100, baseMatch + recipeBonus)
```

### マイ銀行（/guild）

- 上段：AUM / 今月のおだちん（useLiveEarnings・ライブ更新）/ 先月比
- FloatingPayoutToast：おだちん入金時に右下スライドイン（220ms）→ 1.5s 滞在 → フェードアウト
- API印税バー：useRoyaltyStream（28〜32s 間隔、2件/分）の累計表示
- ノートカード一覧：mini RatingPlate + タイトル + スコア + 日付
- 通帳テーブル：日時 / 種類 / 金額 / 残高（tabular-nums）

---

## 4. アニメーション仕様

| 名前 | 用途 | 時間 |
|------|------|------|
| `scanLine` | 銀行の鑑定演出（ゴールドのラインが横断） | 0.6s |
| `slideInToast` | FloatingPayoutToast 出現 | 220ms |
| Default transition | nameraka 全体 | 220ms ease-out |

---

## 5. テーマ階層

| `data-theme` | 概要 | デフォルト |
|---|---|---|
| `nameraka` | 本仕様。濃紺×ゴールド。日常使い。 | ✅ |
| `pro` | 旧 terminal。エンジニア向け硬派。隠しトグル。 | — |
| `kawaii` | Friendly Bank。kawaii UI。隠しトグル。 | — |

---

## 6. ビジネスロジック（モック）

### instant-buyout (`src/lib/instant-buyout/index.ts`)
- `offerInstantBuyout(audit)` → S/A のみオファー、B は null
- `computeAssessmentRange(score)` → `[min, max]` in JPY

### match-fit (`src/lib/match-fit/index.ts`)
- `computeFit(jobId, ownedRecipeIds)` → 0-100
- `fitLabel(score)` → "ぴったり" / "いいかんじ" / "もう一歩" / "準備中"

### royalty-stream (`src/lib/royalty-stream/index.ts`)
- `useRoyaltyStream(enabled)` → 28〜32s 間隔で RoyaltyEvent を発火
- `ROYALTY_EVENTS_PER_MINUTE = 2`
