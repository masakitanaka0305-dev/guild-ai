# GUILD AI Terminal Theme — 設計書

> ⚠️ **v13 更新（Intelligence-as-a-Transaction）**：`pro` テーマとして維持。デフォルトは `nameraka` テーマに移行しました。`data-theme="pro"` で切替可能。

---

## 1. カラートークン（CSS Variables）

| 変数名 | 値 | 用途 |
|---|---|---|
| `--obsidian` | `#0B0D10` | ベース背景（最暗） |
| `--obsidian-2` | `#11141A` | カード・パネル背景 |
| `--slate` | `#1B2027` | セカンダリ背景 |
| `--slate-2` | `#232934` | インプット・テーブル行ホバー |
| `--slate-3` | `#2E3540` | ボーダー次点 |
| `--text-primary` | `#E8EBF0` | メインテキスト |
| `--text-muted` | `#98A1B0` | サブテキスト・ラベル |
| `--divider` | `#2A2F38` | ボーダー・区切り線 |
| `--t-gold` | `#D4AF37` | アクセントゴールド（CTA・強調） |
| `--t-gold-soft` | `#B58E1A` | ゴールドサブカラー |
| `--t-gold-glow` | `rgba(212,175,55,0.18)` | 最新ストリーム行ハイライト |
| `--positive` | `#4DA968` | 損益プラス（Yield・報酬） |
| `--negative` | `#C45757` | 損益マイナス（損失・エラー） |

## 2. 角丸・シャドウ規約

| 変数 | 値 | 適用箇所 |
|---|---|---|
| `--radius-sm` | `2px` | インラインバッジ・タグ |
| `--radius-md` | `4px` | カード・ボタン・インプット |
| `--radius-lg` | `6px` | モーダル・大型パネル |
| Shadow | `0 0 0 1px var(--divider)` | カードボーダーのみ、ドロップシャドウ廃止 |

## 3. フォント規約

| 種別 | フォント | feature-settings |
|---|---|---|
| 日本語 | Noto Sans JP (700/500/400) | — |
| 英数字 | (inherited) | — |
| コード・数値 | JetBrains Mono | `"tnum", "cv11"` |

- `font-feature-settings: "tnum", "cv11"` で等幅数字・視認性調整を全体適用。
- `font-mono` クラスで統一。

## 4. Zero-Latency アニメーション規約

| 項目 | 値 | 備考 |
|---|---|---|
| 全トランジション最大尺 | **100ms** | `[data-theme="terminal"] * { transition-duration: 100ms !important }` |
| 処理完了シグナル | **Gold Flash Bar** | `@keyframes gold-flash` — 2px 横線が 0.1s で opacity 0→1→0 |
| Kawaii アニメ | terminal では強制スキップ | 上記 `animation-duration: 100ms !important` で実質無効化 |
| reduced-motion | フラッシュは opacity フェードに置換 | `.gold-flash-bar { animation: none }` |

## 5. レイアウト寸法

### 資産運用ターミナル（/bank）
```
<TickerStrip />         — 全幅ヘッダー帯（h: auto, overflow-x: auto）
<main>
  ├── 左ペイン（1fr）   — MD提出フォーム + ステータス
  └── 右ペイン（320px） — 評価キュー Top10 + 取引ストリーム
```

### Engagement Terminal（/jobs）
```
<header>               — 統計バー（Recipes / Eligible / Applied）
<table>                — 幅100%、sticky thead
  行高: 22-28px, font-mono 11px, tabular-nums
  375px: Title / Yield / Action のみ表示
```

### Portfolio（/guild）
```
<StatsBar />           — 全幅、7カラム（AUM/Yield/MoM/APR/Recipes/Engagements/Total）
<main>
  ├── 左ペイン（1fr）   — Recipeテーブル + 取引履歴
  └── 右ペイン（280px） — DeployStatus + Yield Trend Sparklines
```

## 6. チャート表現

| コンポーネント | 場所 | 用途 |
|---|---|---|
| `TickerStrip` | /bank 上部 | 銘柄ID・スコア・Δ%・Yield % |
| `Sparkline` | Portfolio右ペイン | Yield Trend 折れ線（20pt） |
| `LineChart` | 汎用 | グリッド+面積塗り+ゴールド軸 |
| `OrderBookLite` | kawaii 非表示 | Bid/Ask 擬似板（5段×2） |
| `StreamFeed` | /bank 右ペイン | 取引ログ（行高22px、最新3行ゴールドハイライト） |
| `DeployStatusPanel` | Portfolio右ペイン | Vercel inspect 風モック |

データソース: `src/lib/terminal-data/index.ts`（すべてモック）

## 7. テーマ切替の優先順位

```
localStorage.guild_theme → data-theme 属性 → デフォルト "terminal"
```

1. `ThemeInitScript`（インラインスクリプト）が `<head>` で FOUC を防止
2. `ThemeToggle` が `data-theme` を書き換え → CSS Variables が即時反映
3. 3状態: `terminal → pro → kawaii → terminal`（循環）

## 8. Kawaii テーマ隔離ルール

- `.kawaii-only` — terminal/pro で `display: none !important`
- `.shimaenaga-mascot` — terminal/pro で `display: none !important`
- `.lodge-terminal-header` — terminal/pro で `display: block !important`（デフォルト hidden）
- kawaii テーマ専用語彙（「ぶき」「おたから」「えらんでもらう」等）は kawaii レンダリングパスにのみ出現

## 9. jargon 許可リスト（terminal テーマ）

terminal/pro テーマでは以下の技術語・金融語を使用可：

`CCAF` / `Tokenomics` / `Yield` / `APR` / `AUM` / `MoM` / `QoQ` / `TVL` / `SLA` / `RPS` / `PoC` / `Recipe` / `Engagement` / `Lodge` / `Portfolio`

kawaii テーマでは引き続き「二層言語ポリシー」を適用。
