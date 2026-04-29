# なめらかテーマ設計書 v3（メルカリ風統一 UI）

> コンセプト：**GUILD AI の唯一テーマ。メルカリ×LINE×PayPay 的な日常アプリのトーン。**
> キャッチコピー：**「AIエージェントで、あなたの時間をアップデート。」**
> 補助コピー：**「寝てる間も、AIがあなたの知恵で稼ぐ場所です。」**

---

## 0. キャッチコピー定義

| 用途 | コピー |
|------|--------|
| メインコピー（公式） | AIエージェントで、あなたの時間をアップデート。 |
| 補助文 | 寝てる間も、AIがあなたの知恵で稼ぐ場所です。 |
| ホーム CTA (1) | いま のこす |
| ホーム CTA (2) | いま かせぐ |
| フッタ副文 | AIエージェントで、あなたの時間をアップデート。 |
| `/bank` | 何を のこしますか？ |
| `/jobs` | いま、かせぎ どきの しごと。 |
| `/guild` | 今日も、あなたの 時間 を AI が 守っています。 |
| `/sell` | 3行で 出品完了。 |

配置：
- ホームの `<h1>` にモバイル 28px / PC 40px で表示
- `src/app/layout.tsx` の `metadata.title` / `og:title` に設定
- フッタの 2 行目に控えめに掲載

---

## 1. デザイントークン（nameraka — ライト）

| トークン | 値 | 用途 |
|----------|-----|------|
| `--n-bg` | `#FAFAF7` | 薄いオフホワイト背景 |
| `--n-surface` | `#FFFFFF` | カード・ダイアログ（純白） |
| `--n-surface-2` | `#F5F3EE` | インナーサーフェス・セクション |
| `--n-divider` | `rgba(0,0,0,0.08)` | 区切り線 |
| `--n-text` | `#1A1714` | 主テキスト（濃いブラウン） |
| `--n-muted` | `#6B6456` | 補助テキスト |
| `--n-primary` | `#E64545` | **メルカリ赤** Primary CTA |
| `--n-primary-hover` | `#D03A3A` | ホバー状態 |
| `--n-gold` | `#D4AF37` | 格付・重要指標（ゴールド） |
| `--n-gold-soft` | `#F2DFA0` | ゴールドのソフト版 |
| `--n-positive` | `#0E9F4F` | 加算・成功（緑） |
| `--n-negative` | `#E64545` | 減算・エラー |

サイドバー背景：`#F2F0EB`（メインとの差別化）

---

## 2. メルカリ風統一ガイド

### 色

- **背景**：オフホワイト `#FAFAF7`、サーフェスは純白 `#FFFFFF`、サイドバーは `#F2F0EB`
- **Primary CTA**：`#E64545`（メルカリ赤）、ホバーで `#D03A3A`、文字白
- **Secondary**：白 + グレー枠 `border-gray-200`、文字 `#1F1B16`

### 余白

- セクション間：`space-y-10`
- カード内：`p-5` 〜 `p-6`

### 角丸

| 要素 | クラス |
|------|--------|
| カード | `rounded-2xl` |
| ボタン | `rounded-full` |
| 入力 | `rounded-xl` |
| タグ / チップ | `rounded-full` |

### ボタン

| 種別 | クラス例 |
|------|---------|
| Primary CTA | `h-12 min-w-[200px] rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold text-base hover:bg-[#D03A3A] active:scale-[0.98] transition-all duration-220 shadow-sm` |
| Secondary | `h-12 rounded-full border border-gray-200 bg-white text-[#1F1B16] font-bold hover:bg-gray-50 active:scale-[0.98] transition-all duration-220` |

### タグ / チップ

```
bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs
```

### カード

```
bg-white border border-black/5 rounded-2xl shadow-sm active:scale-[0.99] transition-all duration-220
```

### タイポグラフィ

- 本文：16px / `leading-relaxed`
- 見出し：20〜28px
- 英数字：`tabular-nums`、円マーク半角 `¥`、3桁カンマ
- フォント：Yu Gothic + Noto Sans JP

### アイコン

- 単色 `text-gray-700`、サイズ `w-5 h-5`
- アイコン + ラベル必須
- lucide-react 等の外部依存を入れず SVG ピクト流用

### アニメーション

- 全体：`220ms ease-out`（`cubic-bezier(0.22, 1, 0.36, 1)`）
- タップ時：`active:scale-[0.98]`（ボタン全種）
- `prefers-reduced-motion` 対応あり

### 見出し帯スタイル

```tsx
<div className="flex items-center gap-3 mb-5">
  <div className="w-1 h-6 rounded-full bg-[var(--n-primary,#E64545)]" />  {/* 赤縦バー 4px */}
  <h2 className="text-lg font-bold text-[var(--n-text,#1A1714)]">{title}</h2>
</div>
```

---

## 3. ナビゲーション

### サイドバー（PC）

| パス | ラベル |
|------|--------|
| `/` | ホーム |
| `/bank` | のこす |
| `/jobs` | かせぐ |
| `/guild` | マイ銀行 |
| `/sell` | はじめての提出 |
| `/wallet` | おさいふ通帳 |

### ボトムナビ（モバイル）

4 タブ + 中央 FAB 構成：
```
[ホーム] [のこす] [  ＋  ] [かせぐ] [マイ銀行]
                  ↑ FAB (64px 赤丸) → /sell
```

- FAB：`w-14 h-14` 丸型、赤、`aria-label="のこす"`、`bottom-[88px]`（タブバーと重ならない）
- タブの active：赤ドット + 赤テキスト

---

## 4. 各画面の最終構成

### ホーム（/）

1. **ヒーロー**：「AIエージェントで、あなたの時間をアップデート。」（h1） + 補助文 + 2 CTA
2. **3 バリュー**：「すぐ売れる」「むずかしくない」「24時間 AIが働く」 — 3カラム(PC) / 縦タイル(mobile)
3. **新着の知恵**：横スクロール 4 カード（セクション赤縦バー見出し）
4. **おすすめの しごと**：縦リスト 3 件
5. **帯バナー**：「まだ かせいでない？ いま のこしてみよう。」+ 白ボタン
6. **フッタ**：GUILD AI ロゴ + 副コピー + ナビリンク群

### のこす（/bank）

- 見出し：「何を のこしますか？」
- 大型ドロップエリア（白・破線）
- 査定プレビュー → 赤丸ボタン「提出する →」

### かせぐ（/jobs）

- 見出し：「いま、かせぎ どきの しごと。」
- 縦カード一覧 + 赤ボタン「この知恵で 応募する」

### マイ銀行（/guild）

- 見出し：「今日も、あなたの 時間 を AI が 守っています。」
- 2 数字カード（今日のおだちん / 今月の合計）
- 詳細折りたたみ → 通帳テーブル

### 出品（/sell）

- 見出し：「3行で 出品完了。」
- ステップインジケーター → フォーム → 赤丸ボタン

---

## 5. jargon-lint 許可 / 禁止リスト

### 許可語（FORBIDDEN リストに含めない）

| 語 | 理由 |
|----|------|
| AIエージェント | メインキャッチコピーの一部 |
| アップデート | メインキャッチコピーの一部 |
| あなたの時間 | メインキャッチコピーの一部 |

### 禁止語（`src/lib/__tests__/jargon-lint.test.ts` の FORBIDDEN）

| 語 | 置換先 |
|----|--------|
| JPYC | デジタル円 または ¥ |
| ステーブルコイン | デジタル円 |
| Stablecoin | デジタル円 |
| API Hotbed | おしごと窓口 |
| APIエンドポイント | おしごと窓口 |
| CCAF | こだわり（実績ログ） |
| お仕事 | おしごと（ひらがな） |
| 取引所 | 保管庫 |

---

## 6. アニメーション仕様

| 名前 | 用途 | 時間 |
|------|------|------|
| `scanLine` | のこす 鑑定演出（赤ライン） | 0.4s |
| `slideInToast` | FloatingPayoutToast 出現 | 220ms |
| Default transition | nameraka 全体 | 220ms ease-out |

---

## 7. ビジネスロジック（モック）

### instant-buyout
- `offerInstantBuyout(audit)` → S/A のみオファー、B は null
- `computeAssessmentRange(score)` → `[min, max]` in JPY

### match-fit
- `computeFit(jobId, ownedRecipeIds)` → 0-100
- `fitLabel(score)` → "ぴったり"（≥80）/ "もう少し"（≥50）/ "これから"（<50）

### royalty-stream
- `useRoyaltyStream(true)` → 28〜32s 間隔で RoyaltyEvent
- `ROYALTY_EVENTS_PER_MINUTE = 2`
