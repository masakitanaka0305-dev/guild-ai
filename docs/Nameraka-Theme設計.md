# なめらかテーマ設計書 v4（メルカリ風統一 UI / 18y/o トーン）

> コンセプト：**GUILD AI の唯一テーマ。メルカリ×LINE×PayPay 的な日常アプリのトーン。**
> キャッチコピー：**「AIエージェントで、あなたの時間をアップデート。」**
> 補助コピー：**「寝てる間も、AIがあなたの知恵で稼ぐ場所です。」**
> ターゲット：**18歳（高校生〜大学生）でも直感的に使える大人語彙。** ひらがな幼語ではなく、若者が普通に使う日本語（報酬・資産・投稿・案件）を採用。

---

## 0. キャッチコピー定義

| 用途 | コピー |
|------|--------|
| メインコピー（公式） | AIエージェントで、あなたの時間をアップデート。 |
| 補助文 | 寝てる間も、AIがあなたの知恵で稼ぐ場所です。 |
| ホーム CTA (1) | 投稿する（旧: いま のこす） |
| ホーム CTA (2) | 案件（旧: いま かせぐ） |
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
| `/bank` | 投稿 |
| `/jobs` | 案件 |
| `/guild` | 運用 |

### ボトムナビ（モバイル）

4 タブ + 中央 FAB 構成：
```
[ホーム] [投稿] [  ＋  ] [案件] [運用]
                ↑ FAB (64px 赤丸) → /bank
```

- FAB：`w-14 h-14` 丸型、赤、`aria-label="投稿"`、`bottom-[88px]`（タブバーと重ならない）
- タブの active：赤ドット + 赤テキスト
- `/guild` (運用) `main` タグに `pb-24 sm:pb-12`（モバイル底ナビと重ならない余白）

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

- **ヒーローブロック**（最上部）：「かせぐ：あなたの ノートが 役立つ おしごとです」＋サブ文（「おしごとの依頼」「応募 1 タップ」を赤強調）
- 各カード：時間ラベル + あいしょう（`<Tip>` ？アイコン：「あなたの登記済みノートとの相性です」）+ タイトル + 必要タグ + 赤ボタン「この知恵で 応募する」

### 運用（/guild）

- **ヒーローブロック**（最上部）：「運用：あなたが投稿したMDファイルの状況・報酬・取引をまとめる場所」＋サブ文（「今日の報酬」「今月の合計」「推定時給」を赤強調）
- **総資産ヒーローカード**（`<TotalAssetsCard>`、`rounded-3xl p-6 sm:p-8`）：
  - 見出し：縦バー＋「総資産」＋「？」ツールチップ（aria-describedby）
  - メイン数字：「現在の残高」ラベル＋`¥X,XXX,XXX`（text-4xl/text-5xl、`aria-live="polite"`）
  - サブ 3 指標グリッド（1 列 / sm:3 列）：累計報酬 / 運用資産の評価額 / 今月の伸び（±%）
  - ドーナツチャート SVG（`aria-label="資産の内訳"`）＋凡例
  - 入金イベント（incomeStream）で 10 秒スロットルで残高を加算
- **運用中のリアルタイム指標カード**：推定時給（大型）＋今日の報酬・今月の合計（小型横並び）＋緑パルス
- **運用中の資産：あなたが投稿したMDファイル**（`<SectionBand>` + `<Tip>`、`<AssetPortfolio>` コンポーネント）
  - ヘッダサマリ：「運用中 N 件 ／ 審査中 N 件 ／ 停止中 N 件 — 合計 N 件」
  - 並び替えプルダウン（報酬順 / コール数順 / 最終呼び出し順 / 投稿日順）
  - 「＋ 新しく投稿する」→ `/sell`
  - 各資産：タイトル・ステータスバッジ（運用中 緑 / 審査中 黄 / 停止中 グレー）・**実行状態バッジ（待機中 / 実行中 / 要メンテナンス）**・公開エンドポイント短縮・今月の報酬・累計コール数 Sparkline・最終呼び出し相対時刻・「詳細」→ `/asset/{guildId}`
  - **実行状態 3 種**（`src/lib/asset-status/index.ts` → `computeStatus()`）：
    - **待機中（ready）**：最終呼び出しから 30 秒超・30 日未満。`bg-gray-50` + 緑ドット。
    - **実行中（executing）**：最終呼び出しから 30 秒以内、または incomeStream イベントで動的発火（5 秒間）。`bg-emerald-50` + 脈動ドット（reduced-motion で停止）。
    - **要メンテナンス（awaiting_update）**：停止中 or 30 日無稼働。`bg-amber-50` + 黄ドット。
  - 並び替えオプションに「ステータス別」追加（実行中 → 待機中 → 要メンテ）
  - モバイル縦カード／PC テーブル（`overflow-x-auto`）
  - 件数 0 時：「まだ投稿された資産はありません」＋「投稿する」→ `/sell`
- **通帳：これまでの取引**（`<SectionBand>` 見出し帯 + `<Tip>`）：入出金テーブル（報酬＋印税行）
- 折りたたみ「くわしく見る」→ AUM / MoM / APR

#### 用語統一ルール

| 廃止語 | 置換先 |
|--------|--------|
| お財布通帳 | 使用禁止（jargon-lint FORBIDDEN） |
| ギルド通帳 | 通帳（セクション名） |
| お財布 | 運用 または 通帳 |
| マイ銀行 | 運用（/guild ページ名・ナビラベル） |
| はじめての提出 | サイドバーから削除（sell ページは FAB 経由） |
| おさいふ通帳 | サイドバーから削除（通帳機能は /guild に集約） |

- **ページ名**：`/guild` = 運用
- **取引履歴セクション**：通帳（「通帳：これまでの取引」）
- ボトムタブラベル：「運用」（第4タブ）
- 通帳テーブル：`overflow-x-auto`、初期10件表示・「もっと見る」で30件まで拡張

#### `<Tip>` コンポーネント仕様（`src/components/Tip.tsx`）

- 外部依存ゼロ。`useState` + `useId` で hover/tap 時に tooltip 表示。
- `aria-describedby` でスクリーンリーダー対応。
- スタイル：`？` ボタン `text-gray-400 border-gray-300`、14px 相当。tooltip 背景 `#1A1714` 白文字、`max-w-[180px]`。

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
