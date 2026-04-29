# GUILD AI — Petal Logic 設計図（Japan-Market Localization）

## 概要

日本市場向け UX 強化：精霊マスコット（ランク別顔オーバーレイ）、銀行通帳風 UI、Guardian 語彙（保管庫・おさいふ通帳）。

（kawaii テーマは削除済み）

---

## 精霊（Spirit）— 顔オーバーレイ

### 設計思想

紋章（Asset Emblem）の上にランク別の顔（目・口）を重ねた「知能の精霊」。
ランクに応じた表情で、資産の品質をキャラクターで直感的に表現する。

```
S ランク: きらきら（十字星目 ✦ + 大きなスマイル + ほっぺ + スパークル）
A ランク: やさしい（丸い目 + 柔らかアーク笑顔 + ほっぺ）
B ランク: もぐもぐ（楕円目 + O型小さな口）
```

### 実装ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/asset-spirit/index.ts` | `generateSpirit()` + `renderSpiritSvg()` + `faceOverlaySvgString()` |
| `src/components/AssetSpirit.tsx` | JSX SVG コンポーネント（use client, dangerouslySetInnerHTML 禁止） |
| `src/app/api/spirit/[assetId]/route.ts` | GET → image/svg+xml（rank は ?rank= or マーケット lookup） |

### SVG 構造

```
<svg viewBox="0 0 100 100">
  <!-- Emblem layer (petals + center) -->
  ...
  <!-- Ghost face oval (white, opacity 0.82) -->
  <ellipse cx="50" cy="52" rx="24" ry="26" fill="white"/>
  <!-- Eyes (rank-conditional) -->
  <!-- S: 十字星（2楕円交差） / A: 丸目+ハイライト / B: 楕円目 -->
  <!-- Mouth (rank-conditional) -->
  <!-- S: Wスマイル / A: アーク笑顔 / B: もぐもぐO -->
  <!-- Blush (S/A のみ) -->
  <!-- Sparkle dots (S のみ) -->
</svg>
```

---

## HumanThumbnail 3層化

```
優先順位:
  1. 写真（ユーザーアップロード）  → <img src={dataUrl}>
  2. 精霊（rank 提供時）           → <AssetSpirit rank={rank}>
  3. 紋章（rank 省略時フォールバック）→ <AssetEmblem>
```

実装: `src/components/HumanThumbnail.tsx`
- `rank?: Rank` prop を追加
- rank あり → `<AssetSpirit>`、rank なし → `<AssetEmblem>`

### 各ページの rank 引き渡し

| ページ | 変更 |
|--------|------|
| `/showcase` | `<HumanThumbnail rank={item.listing.rank} ...>` |
| `/marketplace` | `<HumanThumbnail rank={item.listing.rank} ...>` |
| `/asset/[id]` | `<AssetSpirit>` に直接更新（ページはサーバーコンポーネントのため） |

---

## PassbookTable — 銀行通帳風 UI

`src/components/PassbookTable.tsx`

### デザイン仕様

| 要素 | スタイル |
|------|---------|
| 背景色 | `#FEFCF6`（軽い生成り） |
| ヘッダー背景 | `#F3EDD9`（やや濃い生成り） |
| 縦罫線 | `1px solid rgba(26,22,40,0.08)` |
| 交互行 | `#FEFCF6` / `#FAF7EE` |
| 入金金額 | `text-accent-green` + `+¥` prefix |

### カラム構成

```
┌─────────┬───────┬─────────────────────────┬──────────────┐
│  年月   │ 区分  │  お名前（たからもの）     │ お受け取り  │
├─────────┼───────┼─────────────────────────┼──────────────┤
│ 2026-04 │カード │ プロジェクト管理AI        │ +¥5,000    │
└─────────┴───────┴─────────────────────────┴──────────────┘
```

### wallet ページへの統合

- 旧: `<ul>` スタイルの取引履歴
- 新: `<PassbookTable transactions={snap.recentTransactions} />`
- ヘッダー: 「最近の取引履歴」→「おさいふ通帳」
- 通帳チャイムボタン追加（🔔 チャイム → `playPassbookChime()`）

---

## playPassbookChime() — 通帳音

`src/lib/sound/index.ts`

```typescript
// A4(440Hz) + A3(220Hz) + A5(880Hz) — メローな銀行通知音
export function playPassbookChime(): void { ... }
export const PASSBOOK_CHIME_FREQUENCIES = [440, 220, 880] as const;
```

`playSuccessChime`（700Hz 水琴窟）より低音でメロウ、入金通知に適したトーン。

---

## Guardian ブランディング（語彙変換）

| 旧表記 | 新表記 | 場所 |
|-------|--------|------|
| マーケット（nav） | 🏦 保管庫 | SidebarNav + BottomNav |
| お財布（nav） | 💰 おさいふ通帳 | SidebarNav |
| 財布（bottom nav） | 💰 通帳 | BottomNav |
| マーケット（h1） | 🏦 保管庫（スキルの貯金箱） | marketplace/page.tsx |
| AI評価済みスキル資産の一覧 | AI評価済みスキル資産の保管庫 | marketplace/page.tsx |
| マーケットを見る | 保管庫を見る | showcase/page.tsx |

---

## jargon-lint 拡張（Petal Logic §Guardian）

`src/lib/__tests__/jargon-lint.test.ts` の `FORBIDDEN` に追加:

| 禁止語 | 代替 |
|-------|------|
| `取引所` | 保管庫 |

※ 「Marketplace」「Exchange」は TypeScript 識別子（型名・定数名）として不可分なため jargon-lint 対象外。UI 表示テキストでの使用禁止は Guardian Branding への準拠で担保。

---

## API エンドポイント

### GET /api/spirit/[assetId]

```
Content-Type: image/svg+xml
Cache-Control: public, max-age=86400

クエリパラメータ:
  ?rank=S|A|B  — 明示指定（省略時はマーケット lookup → デフォルト B）
```

---

## 実装済みファイル一覧（Petal Logic）

| ファイル | 役割 |
|---------|------|
| `src/lib/asset-spirit/index.ts` | generateSpirit / renderSpiritSvg / faceOverlaySvgString |
| `src/lib/asset-spirit/__tests__/asset-spirit.test.ts` | 11 テスト |
| `src/components/AssetSpirit.tsx` | JSX SVG コンポーネント（use client） |
| `src/components/HumanThumbnail.tsx` | 3層化（rank? prop 追加） |
| `src/components/PassbookTable.tsx` | 銀行通帳風テーブル |
| `src/components/SidebarNav.tsx` | マーケット→保管庫、お財布→おさいふ通帳 |
| `src/app/marketplace/page.tsx` | h1 保管庫（スキルの貯金箱）、HumanThumbnail rank 追加 |
| `src/app/showcase/page.tsx` | HumanThumbnail rank 追加、保管庫を見る |
| `src/app/asset/[id]/page.tsx` | AssetSpirit に更新 |
| `src/app/wallet/page.tsx` | PassbookTable + playPassbookChime インポート |
| `src/lib/sound/index.ts` | playPassbookChime() + PASSBOOK_CHIME_FREQUENCIES |
| `src/lib/__tests__/jargon-lint.test.ts` | 取引所 を FORBIDDEN に追加 |
| `src/lib/__tests__/petal-logic.test.ts` | 24 テスト |
| `src/app/api/spirit/[assetId]/route.ts` | spirit SVG エンドポイント |

テスト合計: 35 件追加（spirit 11, petal-logic 24）→ 計 319 件
