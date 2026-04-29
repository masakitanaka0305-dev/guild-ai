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

**密度ガイド：3 行以上のテキストブロック禁止 / 1 セクション 1 メッセージ**

1. **ヒーロー**：「AIエージェントで、」「あなたの時間を」「アップデート。」の 3 行強制改行（`<span className="block">`、赤強調なし）。サイズ：モバイル 28px / タブレット 36px / PC 48px（`text-[28px] sm:text-4xl lg:text-5xl`）、`leading-[1.2]`。サブコピー `font-semibold text-[#4A4458]`。CTA **1 個**（「いま のこす」→ `/bank`）。価格チップ廃止。
2. **初めてのギルドエーアイ講座バナー**：**薄い水色グラデ背景**（`bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD]`＋`ring-1 ring-sky-100/60`）、マスコット PNG + 見出し + サブ文（「自分のペース」赤強調）。タップでオンボーディングモーダル開示。右上 ✕ で非表示（`guild_onboarding_dismissed`）。`aria-label="初めてのギルドエーアイ講座"`
   - **OnboardingModal**：`max-h-[80vh] overflow-y-auto overscroll-contain`。4 ステップ `<ol space-y-5>`。各ステップ：太字ラベル → 短サブ（xs gray）→ 本文（sm gray-700 leading-relaxed）。強調語（`text-[#E64545] font-semibold`）：「タイトル・想定価格・難易度」「専用の API エンドポイント」「1 コール 0.1〜10 円」「作成者であるあなたに 100%」「直近の印税・推定時給・累計売上」。Esc 閉じ・focus trap・`aria-modal="true"` 維持。
3. **つかいかた はかんたん**（統合ブロック）：3 カード 3 列（📝のこす→/sell / 🤖AIが働く→/jobs / 💴¥が入る→/guild）
4. **いま のこされた しごと**：横スクロール 3 件、タイトル＋¥価格のみ
5. **かせげる しごと**：縦リスト 2 件、タイトル＋報酬＋「応募する」赤ボタン
6. **フッタ**：GUILD AI ロゴ＋ナビリンク＋「初めての方へ」（モーダル再表示）

削除済み：帯バナー（CTA 重複のため撤去）、3 ステップ説明ストリップ（統合ブロックに統合）、2 本目 CTA「いま かせぐ」

### のこす（/bank）— FAB・ホームCTA の共通遷移先

**MD 入力 3 経路**（タブ切替）：

| タブ | 経路 | 詳細 |
|------|------|------|
| 📁 ファイル | ファイルを選ぶ / DnD | `.md` / `.markdown` / `.txt`、1MB 上限。ドラッグ中は `border-[#E64545] bg-red-50` |
| ✍️ 直接書く | テキスト貼り付け | `<textarea aria-label="MD を直接書く">`。先頭 5KB プレビュー＋残文字数表示 |

- ファイル拡張子NG → 赤トースト「MD ファイルだけ受け付けています」（2 秒）
- サイズ超過 → 「もう少しコンパクトにできますか？」
- 取り込み後、テキストエリアにプレビュー表示 → 既存 AI 鑑定フローへ
- 「のこす」ボタンは content < 10 文字で `disabled`

### かせぐ（/jobs）

- 見出し：「いま、かせぎ どきの しごと。」
- 縦カード一覧 + 赤ボタン「この知恵で 応募する」

### マイ銀行（/guild）

- 見出し：「今日も、あなたの 時間 を AI が 守っています。」
- **「いまの推定時給」カード**（最上部）：大型数値 `¥X / 時間`、緑パルス SVG、`aria-live="polite"`、補助文「直近 60 秒の API 印税から推計」
- 2 数字カード（今日のおだちん / 今月の合計）
- **稼働中ノート上位 3 件**：直近1分コール数・単価・累計売上、横スクロール（PC縦リスト）
- 詳細折りたたみ → 通帳テーブル（印税行も `type: 印税` で表示）

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
