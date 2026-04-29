# なめらかテーマ設計書 v2（ライト × 日常アプリ調）

> コンセプト：**知恵（MD）を金塊（資産）に変える、メルカリ／LINE／PayPay 的な日常アプリのトーン**
> ベンチマーク：メルカリの出品の速さ ＋ タイミーの即時報酬
>
> **v2 変更点（light repaint）**：ベースカラーを濃紺（`#0A192F`）から ライト（`#FAFAF7`）に刷新。旧カラーは `midnight` テーマとして保持。

---

## 1. デザイントークン（nameraka — ライト）

| トークン | 値 | 用途 |
|----------|-----|------|
| `--n-bg` | `#FAFAF7` | 薄いオフホワイト背景 |
| `--n-surface` | `#FFFFFF` | カード・ダイアログ |
| `--n-surface-2` | `#F5F3EE` | インナーサーフェス・セクション |
| `--n-divider` | `rgba(0,0,0,0.08)` | 区切り線（薄グレー） |
| `--n-text` | `#1A1714` | 主テキスト（濃いブラウン） |
| `--n-muted` | `#6B6456` | 補助テキスト |
| `--n-primary` | `#E64545` | 主アクション CTA（赤） |
| `--n-primary-hover` | `#CC3A3A` | ホバー状態 |
| `--n-gold` | `#D4AF37` | 格付・重要指標（ゴールド） |
| `--n-gold-soft` | `#F2DFA0` | ゴールドのソフト版 |
| `--n-positive` | `#0E9F4F` | 加算・成功（緑） |
| `--n-negative` | `#E64545` | 減算・エラー |

角丸：`rounded-2xl`（16px）基本、主要カードは `rounded-3xl`、ボタンは `rounded-full`

フォント：本文 `-apple-system / Yu Gothic / Noto Sans JP`

アニメーション：180〜260ms `ease-out`。Pro の 100ms キャップは nameraka では外れる（220ms デフォルト）。

---

## 1b. ミッドナイトテーマ（midnight — 旧 nameraka ダーク）

| トークン | 値 |
|----------|----|
| `--n-bg` | `#0A192F` |
| `--n-surface` | `#0E2240` |
| `--n-primary` | `#D4AF37`（ゴールド） |
| `--n-positive` | `#4DD08F` |

`midnight` は ThemeToggle の 2 番目の状態。旧 nameraka（濃紺）を好むユーザー向け隠しトグル。

---

## 2. ナビラベル（nameraka 専用）

| パス | ラベル | 説明 |
|------|--------|------|
| `/` | ホーム | タイル型マーケット概観 |
| `/bank` | のこす | ノート提出→鑑定 |
| `/jobs` | かせぐ | あいしょうベースの案件一覧 |
| `/guild` | マイ銀行 | 今日のおだちん・今月の合計 |
| `/sell` | はじめての提出 | ミニマル登録フォーム |
| `/wallet` | おさいふ | 通帳・お知らせ |

### ボトムナビ（モバイル）

4 タブ＋中央 FAB 構成：

```
[ホーム] [のこす] [  ＋  ] [かせぐ] [マイ銀行]
                  ↑ FAB (64px 赤丸) → /sell
```

- FAB: `w-14 h-14` 丸型、`bg-[var(--n-primary)]` 赤、`aria-label="知恵をのこす"`
- タブの active: 赤いドット＋赤テキスト（`--n-primary`）

---

## 3. 画面別レイアウト

### ホーム（/）

- ヒーロー（1行）：「知恵を、寝てる間も働かせる場所。」
  - 赤アクセント：「寝てる間も」が `--n-primary` 色
- CTA 2 ボタン：「いま のこす」（赤 filled）+ 「いま かせぐ」（赤 outlined）
- **MarketHeatBar は nameraka では非表示**（シンプルを維持）
- 2 タブ：「新着の知恵」「おすすめ案件」— active は赤
- タイルグリッド：モバイル 1 列 / タブレット 2 列 / PC 3 列

**知恵タイル**：タイトル / 概要 1 行 / 査定額レンジ / ランクバッジ / 著者ハンドル
- hover: `border-[var(--n-primary)]/40`
- タイトル hover: 赤

**案件タイル**：タイトル / カテゴリ / **あいしょう**（ぴったり/もう少し/これから）/ 報酬

### のこす（/bank）

1. 中央大型ドロップエリア（白背景・薄ボーダー）
2. **「¥◯◯ から ¥◯◯ で売れそうです」**（assessRange プレビュー）
3. 提出ボタン：`rounded-full` **赤 CTA**（`bg-[var(--n-primary)]`）
4. **0.4s スキャンライン演出**（赤ライン）→ 鑑定結果
5. 結果：格付プレート大型中央表示 + 査定額レンジ
6. **0秒換金オファー**（S/A のみ）

#### スキャンタイムライン（nameraka v2）
```
入力 → 提出する → (0.4s スキャン) → 結果表示
```

#### 0秒換金オファー計算式
```
amount = clamp(score × 800, 5000, 500000)
```

#### 査定額レンジ計算式
```
center = clamp(score × 800, 500, 500000)
min    = max(500, round(center × 0.6))
max    = min(500000, round(center × 1.4))
表示: "¥{min} から ¥{max} で売れそうです"
```

### かせぐ（/jobs）

- 縦カード一覧（白カード、`--n-primary` ボーダー for eligible）
- 各カード：
  - **時間バケット**ラベル（今日中に終わる / 今週中に終わる / いつでもOK）— seed % 3 で決定論的
  - **あいしょう**ラベル（適合率%の代わり）：ぴったり / もう少し / これから
  - タイトル / 説明 / 必要バッジ / おだちん
- 「この知恵で応募」CTA → **赤 rounded-full ボタン**
- 採用モーダル：白背景、n-positive（緑）ボーダー

#### あいしょう判定式
```
fit >= 80 → "ぴったり"
fit >= 50 → "もう少し"
fit <  50 → "これから"
```

### マイ銀行（/guild）

- 上段 **2 カード**（白）：
  1. 今日のおだちん（緑 `--n-positive`）
  2. 今月の合計（主テキスト）
- `<details>` 折りたたみ「くわしく見る」：AUM / MoM / APR の 3 指標
- FloatingPayoutToast：入金時に右下スライドイン
- ノートカード：白カード、hover で `--n-primary` ボーダー
- 通帳テーブル

---

## 4. アニメーション仕様

| 名前 | 用途 | 時間 |
|------|------|------|
| `scanLine` | のこす の鑑定演出（nameraka v2 では赤ライン） | **0.4s** |
| `slideInToast` | FloatingPayoutToast 出現 | 220ms |
| Default transition | nameraka 全体 | 220ms ease-out |

---

## 5. テーマ階層（4 状態）

| `data-theme` | 概要 | デフォルト |
|---|---|---|
| `nameraka` | **本仕様。ライト×赤 CTA。日常アプリ調。** | ✅ |
| `midnight` | 旧 nameraka。濃紺×ゴールド。同じ n-* 変数、異なる値。 | — |
| `pro` | 旧 terminal。エンジニア向け硬派。 | — |
| `kawaii` | Friendly Bank。kawaii UI。 | — |

ThemeToggle: `["nameraka", "midnight", "pro", "kawaii"]` の 4 状態ボタン。

---

## 6. ビジネスロジック（モック）

### instant-buyout (`src/lib/instant-buyout/index.ts`)
- `offerInstantBuyout(audit)` → S/A のみオファー、B は null
- `computeAssessmentRange(score)` → `[min, max]` in JPY

### match-fit (`src/lib/match-fit/index.ts`)
- `computeFit(jobId, ownedRecipeIds)` → 0-100
- `fitLabel(score)` → "ぴったり"（≥80）/ "もう少し"（≥50）/ "これから"（<50）
- `fitColor(score)` → CSS var based color class

### royalty-stream (`src/lib/royalty-stream/index.ts`)
- `useRoyaltyStream(enabled)` → 28〜32s 間隔で RoyaltyEvent を発火
- `ROYALTY_EVENTS_PER_MINUTE = 2`
