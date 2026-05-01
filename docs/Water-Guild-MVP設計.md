# Water Guild — Hexagonal Robustness（MVP 設計）

> 沈黙の意匠で、データの堅牢性を語る。
> 動かないことが、信頼を語る。

---

## 1. デザイン原則

| 原則 | 意味 | 実装での担保 |
|------|------|--------------|
| **Hexagonal Robustness** | 6辺で組み合った甲羅。崩れない構造体としての登記台帳。 | 正六角形を rank badge / アイコン枠 / 装飾に静的に使う。 |
| **沈黙の保護** | 騒がず、漏らさず、深く保管する。 | アニメーション全面禁止（`data-anim="off"`）。 |
| **幾何学だけで世界観を語る** | キャラクターも擬人化も使わない。色・角丸・六角形・波線のみ。 | 既存マスコット PNG は撤去。`<Hexagon>` と `<WaveLine>` のみ。 |

---

## 2. デザイントークン

### 2.1 カラーパレット

| 役割 | 値 | 使い所 |
|------|----|--------|
| Background | `#0B1121` | `body` 背景。深海ネイビー。 |
| Surface | `#162035` | カード／パネル。 |
| Surface-2 | `#1E293B` | 入力フィールド／二次面。 |
| Accent | `#22D3EE` | CTA／リンク／rank S 塗り。Tailwind `cyan-400` 相当。 |
| Accent Hover | `#06B6D4` | （hover は `data-anim="off"` 下では効かない／予備）|
| Text | `#E2E8F0` | 本文／見出し。 |
| Muted | `#94A3B8` | 補足／ラベル。 |
| Divider | `rgba(226,232,240,0.10)` | 分割線。 |

### 2.2 トークン参照

```css
:root, [data-theme="water"] {
  --water-bg:           #0B1121;
  --water-surface:      #162035;
  --water-surface-2:    #1E293B;
  --water-accent:       #22D3EE;
  --water-accent-hover: #06B6D4;
  --water-text:         #E2E8F0;
  --water-muted:        #94A3B8;
  --water-divider:      rgba(226,232,240,0.10);
}
```

Tailwind では `bg-water-bg` `text-water-text` `border-water-divider` `shadow-water-glow` などで参照する。

### 2.3 角の丸み

| 用途 | 値 | クラス |
|------|----|--------|
| 入力／カード | 14px | `rounded-lg` |
| CTA／一次ボタン | 18px | `rounded-xl` |
| Pill / 補助 | 22px | `rounded-2xl` |

CTA は **必ず `rounded-xl`**。Flat ＋ 静的 `shadow-water-glow`。

---

## 3. 静的シェイプ

### 3.1 `Hexagon`（`src/components/ui/Hexagon.tsx`）

正六角形の SVG。`viewBox="0 0 100 100"` の 6 頂点ポリゴン。

```tsx
<Hexagon size={64} fill="#22D3EE" stroke="#22D3EE" label="S" labelColor="#0B1121" ariaLabel="ランク S" />
```

| Prop | 既定 | 用途 |
|------|------|------|
| `size` | `64` | 一辺ではなく viewBox 内サイズ（px）。 |
| `fill` | `transparent` | 塗り。 |
| `stroke` | `#22D3EE` | 縁取り。 |
| `strokeWidth` | `2` | 縁取りの太さ。 |
| `label` | — | 中央テキスト（`S` / `A` / `B` / `—` / `G` 等）。 |
| `labelColor` | `#E2E8F0` | テキスト色。 |
| `ariaLabel` | — | 指定時 `role="img"` を付与。装飾用なら省略 → `aria-hidden`。 |

#### 利用箇所
- **rank badge**（`RankBadge.tsx`）: S/A/B/D を六角形で描画。
- **avatar frame**（onboarding 確認画面ヘッダ）: 姓の頭文字を中央に。
- **トップページ「初めての…」バナー**: 装飾。

### 3.2 `WaveLine`（`src/components/ui/WaveLine.tsx`）

細線一本の波。`stroke-opacity` 既定 `0.3` で読みづらいくらいに目立たない。

```tsx
<WaveLine ariaLabel="水の意匠 — 静的波線" />
```

`/guild`（資産台帳）見出し直下に置く。アニメーション無し。

---

## 4. アニメーション全廃ルール

### 4.1 仕組み

1. ルート `<html>` に `data-anim="off"`。
2. `globals.css` の `@layer base` 内：

   ```css
   [data-anim="off"] *,
   [data-anim="off"] *::before,
   [data-anim="off"] *::after {
     transition: none !important;
     animation: none !important;
   }
   ```
3. これにより Tailwind の `animate-pulse` `animate-bounce` も無効化される。

### 4.2 検証

`src/lib/__tests__/no-anim-global.test.ts` が以下を保証する：

- CSS の kill switch が `*`／`*::before`／`*::after` を網羅し `!important` 付きで書かれている。
- `<html data-anim="off">` であること。
- `framer-motion` の import が src 配下に**ゼロ**。
- `guild-ai-mascot` の参照が src 配下に**ゼロ**。

---

## 5. Smart Pre-fill（入力レス・オンボーディング）

`/onboarding` の form フェーズは **「入力」ではなく「確認」**。

### 5.1 データソース

`MOCK_OAUTH_PROFILE`（OAuth 実装後に実セッション payload に差し替え）：

```ts
{
  fullName: "田中 雅基",
  email:    "masaki.tanaka.0305@gmail.com",
  githubHandle: "masaki-tanaka",
  githubUrl: "https://github.com/masaki-tanaka/water-guild-demo",
}
```

### 5.2 名前の自動分割

`splitJapaneseName(fullName)` → `{ familyName, givenName }`。

- ASCII / 全角空白で分割。
- 区切り無しの和名は **先頭2文字を姓**、残りを名（最頻ヒューリスティック）。
- Latin 単一トークンは姓に置く（要レビュー）。

### 5.3 UI 規約

- 入力欄は `defaultValue` プリフィル（OAuth 値を尊重し、編集はオプトイン）。
- ヘッダーに hex avatar frame（姓の頭文字）。
- CTA：「**確認して進む — 登記（Sync）開始**」 / `rounded-xl` ＋ `shadow-water-glow`。
- フォーカスリングは `ring-1 ring-[var(--water-accent)]`。

---

## 6. コピー差し替え一覧

| 旧 | 新 | 場所 |
|----|----|------|
| 登録する | **登記（Sync）** | `/marketplace`, `/showcase` 一次 CTA |
| たからもの登録する | **たからもの登記（Sync）** | `/showcase` |
| GitHub リポジトリ URL | GitHub **コードベース** URL | `/onboarding` |
| エンドポイント | おしごと窓口 | `/onboarding` 結果ペイン |
| 登録 → | **登記（Sync）** → | 各 CTA |

`/onboarding` メイン CTA は「**確認して進む**」。
ダッシュボードの精製動作（資産化）には「**精製（Mint）**」を使う。

### 6.1 Jargon-Lint で禁止語

`src/lib/__tests__/jargon-lint.test.ts` に追加された Water Guild 固有の禁止語：

- リポジトリ → コードベース
- エンドポイント → おしごと窓口
- squirtle / shimaenaga → マスコット禁止
- kawaii → プロ向けトーンに統一

---

## 7. アクセシビリティ

- 六角形 rank badge は `role="img"` ＋ `aria-label="ランク {rank}"`。
- フォームは全項目に `<label htmlFor>`。
- ボタンは min-height 44px（`min-h-11`）。
- `WaveLine` は装飾としては `aria-hidden`、説明的に使う場合 `ariaLabel` を渡せる。

---

## 8. レスポンシブ

| ブレイクポイント | 確認内容 |
|------------------|----------|
| 375 (iPhone SE) | hex 36px / wave 24px / 二段 CTA 折り返し可 |
| 768 (iPad) | hex 56px / wave 24px / 一段 CTA |
| 1280 (Desktop) | サイドバー併用、本文 max-width 720px |

---

## 9. 関連ファイル

- `tailwind.config.ts` — `colors.water.*`, `boxShadow.water-glow`
- `src/app/globals.css` — `[data-theme="water"]` ＋ `[data-anim="off"]`
- `src/app/layout.tsx` — `data-theme="water" data-anim="off"`
- `src/components/ui/Hexagon.tsx` — 静的六角形
- `src/components/ui/WaveLine.tsx` — 静的波線
- `src/components/RankBadge.tsx` — 六角形 rank badge
- `src/lib/name-split/index.ts` — 和名分割
- `src/app/onboarding/page.tsx` — 確認画面
- `src/app/guild/page.tsx` — 資産台帳ヘッダ

---

## 10. テスト一覧（Water Guild）

| テスト | 件数 | 場所 |
|--------|------|------|
| water-tokens | 4 | `src/lib/__tests__/water-tokens.test.ts` |
| hexagon | 4 | `src/lib/__tests__/hexagon.test.ts` |
| hex-rank-badge | 4 | `src/lib/__tests__/hex-rank-badge.test.ts` |
| name-split | 6 | `src/lib/name-split/__tests__/name-split.test.ts` |
| onboarding-prefill | 5 | `src/lib/__tests__/onboarding-prefill.test.ts` |
| wave-line | 4 | `src/lib/__tests__/wave-line.test.ts` |
| no-anim-global | 4 | `src/lib/__tests__/no-anim-global.test.ts` |

合計 **31 件** の新規テスト。

---

# Water Guild v2 — UX/UI Refinements

> v1 で世界観の骨組みを敷いた。v2 はその骨組みに **読みやすさ** と **入力レス** を流し込む工程。

## 11. 可読性トークン

| 役割 | クラス／トークン | 値 | 使い所 |
|------|------------------|----|--------|
| Body silver | `text-[#E2E8F0]` | `#E2E8F0` | 標準本文／ラベル |
| Muted | `text-slate-400` | `#94A3B8` | 補助ラベル／キャプション／breadcrumb |
| Strong | `text-white` | `#FFFFFF` | 重要見出し／メイン数値 |
| Tag ink | `text-[#F1F5F9]` | `#F1F5F9` | tech-stack chip 文字 |

低コントラストの `text-slate-{500,600}` / `text-zinc-{400,500}` / `text-gray-{400,500,600}` は **src/ 配下から全廃**。`water-utility-classes.test.ts` がリグレッションを検出する。

## 12. ユーティリティクラス

### 12.1 `metric-prime` / `metric-prime-white`

```css
.metric-prime {
  @apply text-[#22D3EE] font-semibold tabular-nums tracking-tight;
  font-size: 1.5rem;        /* sm: 1.875rem */
  line-height: 1.15;
}
.metric-prime-white { @apply text-white font-semibold tabular-nums tracking-tight; … }
```

**用途**: 売上 / 手取り / Match % など「これが事実」と言い切る数値。

### 12.2 `chip-tech`

```css
.chip-tech {
  @apply inline-flex items-center bg-[#1E293B] text-[#F1F5F9]
         rounded-full px-3 py-1 text-xs font-medium;
  border: 1px solid rgba(34,211,238,0.18);
}
```

**用途**: tech-stack タグ。深海ベースに浮く陶器のような pill。

## 13. AI Pre-select（入力レス・応募）

`src/lib/md-pickfit/index.ts` の `pickBestFitMd(ownedMds, project)`:

1. **Covered count**: 案件 requirements を最も多く満たす MD を最優先。
2. **Weighted rank score**: 同点なら weight × ownedRank の合算が大きい方。
3. **Tie-break**: それでも同点なら id の lexicographic 順（決定論担保）。
4. **Fallback**: 一致 0 件なら所有 MD の最高ランクを返し、UI に「完全一致なし — ランク最上位を選択」と表示。

`<PlugInApply>` が `<select defaultValue=...>` でプリセレクトし、下に「**自動でおすすめを選択しました — N 件の要件に合致**」のキャプションを置く。

## 14. Sticky Action

`<PlugInApply sticky />` のとき：

```
md:static fixed bottom-16 md:bottom-auto left-0 right-0 z-30
px-4 py-3 bg-[#0B1121]/95 backdrop-blur border-t border-white/10
md:border-0 md:bg-transparent md:backdrop-blur-0 md:p-0
```

モバイルのみ親指ゾーンに固定。`role="region" aria-label="主要アクション"` で支援技術にも届く。デスクトップではカード内に戻る。

`/projects/[id]` のメインは `pb-44 md:pb-8` でスティッキーバーと衝突しない。

## 15. ClampDescription

```
<ClampDescription text={…} maxLines={3} />
```

`-webkit-line-clamp` で行数制限。トグルは `<button aria-expanded>`。`Esc` で折り畳み。アニメ無し（`data-anim="off"` の契約に従う）。

## 16. Hexagon Steps（進捗インジケータ）

`<HexagonSteps total={N} currentIdx={i} labels={...} />` が hex 列を生成：

- **complete**: fill `#22D3EE` / stroke `#22D3EE` / center `✓` (`#0B1121`)
- **active**: fill `#1E293B` / stroke `#22D3EE` / center 番号 (`#22D3EE`)
- **pending**: fill `#162035` / stroke `#94A3B8` / center 番号 (`#94A3B8`)

完了行のステップカードは `bg-emerald-600/10` ＋ `border-l-4 border-[#22D3EE]` で達成感を与える。アニメ無し。`aria-current="step"` を active に付与。

## 17. テスト一覧（v2 追加分）

| テスト | 件数 | 場所 |
|--------|------|------|
| md-pickfit | 4 | `src/lib/md-pickfit/__tests__/md-pickfit.test.ts` |
| sticky-action | 2 | `src/lib/__tests__/sticky-action.test.ts` |
| clamp-description | 1 | `src/lib/__tests__/clamp-description.test.ts` |
| hexagon-steps | 4 | `src/lib/__tests__/hexagon-steps.test.ts` |
| water-utility-classes | 6 | `src/lib/__tests__/water-utility-classes.test.ts` |

合計 **17 件** の v2 新規テスト。

---

## 18. UX Pass 2 — 「+」配置／CTA 文言／ウィザード／プロフィール

### 18.1 「+」ボタン配置ルール

| 表示面 | ＋ ボタン | z-index |
|--------|----------|---------|
| モバイル BottomNav 中央 | `data-testid="bottom-nav-fab"`（cyan-400 の固定中央 FAB） | `z-30` |
| モバイル MainHeader 右 | lucide `Plus`（cyan-400 アイコン） | inline |
| デスクトップ サイドバー | SidebarNav `PRIMARY_ACTION` カード（cyan-400 塗り） | inline |
| **撤去** | `fixed right-8 bottom-8` の旧 desktop 用 floating FAB | — |

提携バナー帯は `z-20`、BottomNav は `z-40`。FAB は `z-30` に挟まれて常に視認可能・重ならない構造。

### 18.2 CTA 文言マップ（Water Guild v3 → UX pass 2）

| 用途 | 旧文言 | 新文言（UX pass 2） |
|------|--------|----------------------|
| 案件 Apply CTA | この案件に応募する | **エージェントをデプロイ**（lucide `Send`） |
| Apply CTA キャプション | 選んだ知能資産があなたのスキル証明になります | **あなたの思考をコピーした AI が、企業のプロジェクトに参加します**（`text-cyan-400/70`） |
| 知能選択ラベル | この知能で応募 | **知能をプラグイン** |
| 案件ステータス（applied） | 応募中 | **エージェント派遣中** |
| Apply 中ラベル | 応募中... | **派遣中...** |

`jargon-lint`：「この案件に応募する」は **NG**、「エージェントをデプロイ／知能をプラグイン／エージェント派遣中／思考をコピー」は許可。

### 18.3 Onboarding ウィザード仕様

3 ステップを `phase === "form"` の中で `wizardStep` で管理：

```
Step A — GitHub 連携
  data-testid="onboarding-step-a"
  GitHub から始める CTA → 連携ボタンをタップ → wizardStep = "role"
        ↓
Step B — 職種選択
  data-testid="onboarding-step-b"
  3 タイル（💻 エンジニア / 🎨 デザイナー / 📋 PdM）
  role="radio" + aria-checked、タップで wizardStep = "confirm"
        ↓
Step 0 — Smart Pre-fill 確認（既存）
  - <dl>/<dt>/<dd> 確認ビュー
  - 「編集する」で <input> に切替
  - 任意項目（生年・住所）は「後で設定する →」cyan ring CTA、デフォルト skip
  - 「あとで /profile でも編集できます」キャプション
  - 同意チェックボックス → 「確認して進む — 登記（Sync）開始」
        ↓
phase = "running" → TimerBar + 既存 7 ステップ
```

クエリパラメータ `?role=engineer/designer/pdm` で Step B をスキップ可能。
`?fast=1` で Step A/B 両方をスキップ。

### 18.4 プロフィールタブ構成

`/profile` ヘッダ：

- 六角形 Static Badge（48px、`HexRankBadge`）
- `@handle`（white semibold 24px）＋ ハンドルコピー（lucide `Copy`）
- 累計報酬 ¥ ／ 稼働中 MD：cyan `metric-prime`（数値）+ `text-[#CBD5E1] text-xs uppercase tracking-wide`（ラベル）

3 タブ：

| ID | ラベル | 中身 |
|----|--------|------|
| `status` | ステータス | 収益サマリ + プロ識別バッジ列（鑑定/完了案件/月間コール/鑑定済 件） |
| `md` | 登記済み MD | 登記済み件数の summary ＋ /guild への深いリンク |
| `activity` | 活動履歴 | 社会インパクト ＋ グローバル着金 ＋ オリジナリティ ＋ 自己紹介 |

`role="tablist"` ＋ 各タブ `role="tab"` ＋ `aria-selected` ＋ `aria-controls`。タブパネルは `role="tabpanel"` ＋ `hidden` で切替。active は `text-cyan-400` ＋ 2px 下線、非 active は `text-slate-400`。

### 18.5 Coming Soon フォールバック

`<ComingSoonModal>` (`src/components/ui/ComingSoonModal.tsx`)

- `role="dialog"` ＋ `aria-modal="true"` ＋ Esc 閉じ
- カード：`bg-[#162035] rounded-2xl shadow-xl p-6`
- 見出し：「Coming Soon」白
- 本文：「この詳細ページは MVP 後リリース予定です。」slate-400
- 閉じるボタン：cyan-400 塗り

`/guild` の Asset Portfolio から「詳細」をタップすると、`isAssetImplemented(guildId)` が `true` なら `<Link href={\`/asset/\${guildId}\`}>`、`false` なら ComingSoonModal を開く。型で接続を保証。

### 18.6 テスト一覧（UX pass 2）

| テスト | 件数 | 場所 |
|--------|------|------|
| fab-placement | 3 | `src/lib/__tests__/fab-placement.test.ts` |
| asset-detail-fallback | 3 | `src/lib/__tests__/asset-detail-fallback.test.ts` |
| apply-cta-copy | 5 | `src/lib/__tests__/apply-cta-copy.test.ts` |
| onboarding-wizard | 4 | `src/lib/__tests__/onboarding-wizard.test.ts` |
| onboarding-later-skip | 3 | `src/lib/__tests__/onboarding-later-skip.test.ts` |
| profile-tabs | 5 | `src/lib/__tests__/profile-tabs.test.ts` |

合計 **23 件** の UX pass 2 新規テスト。

---

## 19. Intelligence Deck — Onboarding Home

### 19.1 目的とトーン

「登録」「Signup」と一切言わない、**「知能の資産化を開始する」**を中心軸に据えた没入型ランディング画面。背景は **#0B1121**（深海ネイビー）、フルスクリーン、ナビ・フッタなし。

### 19.2 ルーティング

| URL | 表示 |
|-----|------|
| `/intelligence-deck` | 公開ランディング（誰でも） |
| `/onboarding`（未認証時） | `<DeckHome>` を返す（ゲート） |
| `/onboarding`（認証済 or `?fast=1`） | 既存ウィザード（Step A → B → 0） |

未認証時の判定は `useAuthState()` の `status === "anonymous"`。`?fast=1` はデモ用バイパス。

### 19.3 画面構成

```
┌──────────────────────────────────────────────────────────┐
│ GUILD AI                       登記済みエージェント数：  │
│                                  1,284 体                 │
│                                  直近 24h で +18 体        │
│                                                            │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│   │ STEP 1      │ │ STEP 2      │ │ STEP 3      │        │
│   │   ⬢          │ │   ⬢          │ │   ⬢          │        │
│   │ 登記 (Sync) │ │鑑定 (Grade) │ │派遣 (Deploy)│        │
│   │  GitHub …   │ │  AI が …    │ │  企業へ …   │        │
│   └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                            │
│        ┌────────────────────────────────────┐             │
│        │       自分の知能を登記する         │             │
│        └────────────────────────────────────┘             │
│              = 知能の資産化を開始する                      │
└──────────────────────────────────────────────────────────┘
```

3 カード：

| Step | タイトル | サブタイトル |
|------|----------|--------------|
| 1 | 登記 (Sync) | GitHub 連携であなたの思考を抽出 |
| 2 | 鑑定 (Grade) | AI があなたの専門知能を資産として評価 |
| 3 | 派遣 (Deploy) | あなたの代わりに働く AI エージェントを企業へ |

カードは `<ol aria-label="知能を資産化する 3 ステップ">` ＋ `<li data-testid="deck-step-N">`。`<Hexagon>` を中央に静的に配置、step 番号を中に黒抜きで描画。モバイル `grid-cols-1`、PC `md:grid-cols-3`。

### 19.4 Hero Button

- テキスト：「自分の知能を登記する」
- href：`/onboarding/repos`（GitHub 連携面）
- スタイル：`bg-cyan-400 text-[#0B1121] font-semibold rounded-full h-14 w-full md:h-16 md:max-w-md`
- 静的 glow：`shadow-[0_0_0_2px_rgba(34,211,238,0.5),0_0_28px_rgba(34,211,238,0.35)]` ＝ アニメ無し
- aria-label：`自分の知能を登記する`
- 直下の補助テキスト：`= 知能の資産化を開始する`（slate-400, text-xs）

### 19.5 ギルド感の演出

- `登記済みエージェント数：1,284 体` を `text-cyan-400/80 text-xs tabular-nums font-mono` で右上に
- `直近 24h で +18 体` を slate-400 small で添える
- 数値は `src/lib/intelligence-deck/index.ts` の `getRegisteredAgents()` ＋ `getRecentAgentsDelta24h()` で固定（テストで pin）

### 19.6 コピーガイド（jargon-lint）

許可語：
- 自分の知能を登記する
- 知能の資産化を開始する
- 登記済みエージェント数
- 登記 (Sync) / 鑑定 (Grade) / 派遣 (Deploy)
- STEP 1 / STEP 2 / STEP 3

NG（jargon-lint で検出）：
- Signup / Sign up / サインアップ / 会員登録 / 無料登録（**全 UI で禁止**）
- Intelligence Deck 配下のファイルでは **登録** も禁止（必ず **登記**）

### 19.7 アクセシビリティ

- `<main>` は 1 つ、`<h1 class="sr-only">自分の知能を登記する</h1>`
- 3 カードは `<ol>` で順序を保ち、各 `<li>`
- Hero Button は `<Link>`（Enter／Space で発火）
- フォーカスリング `outline-cyan-400`

### 19.8 テスト一覧

| テスト | 件数 | 場所 |
|--------|------|------|
| intelligence-deck | 14 | `src/lib/__tests__/intelligence-deck.test.ts` |

`getRegisteredAgents() === 1284`、3 ステップ文言、Hero Button の文言・href・aria・glow、`/onboarding` 未認証時のゲート、Signup/Sign up/サインアップ/会員登録/無料登録 が src/app・src/components 配下に **存在しない**こと、Intelligence Deck 配下に「登録」が出てこないこと、を全部 source-string レベルで検証。


