# Hybrid Plug-in System

> 「応募」ではなく「プラグイン」。人間の参画前から、AI が動いている。

このドキュメントは Hybrid Plug-in System（#121）の設計仕様。`/projects/[id]`
の Connected Intelligence Assets セクション、Apply CTA の状態遷移
（応募前 → プラグイン中 → Plugged-in）、`/applications` の Agent Active
ピル、jargon-lint の差分を扱う。

---

## 1. Connected Intelligence Assets セクション

`/projects/[id]` の Apply CTA 直上に静的な接続状態カードを配置する。

```
┌──────────────────────────────────────────────────────────────┐
│ ⌬ Connected Intelligence Assets                               │
│                                                                │
│ Status    ● Ready   (emerald pill)                             │
│ Agent     ● Synced (from MD Assets)   (cyan dot, text-cyan-300)│
│ Endpoint  /api/atoa/[guildId]   (font-mono slate-400)          │
│                                                                │
│ このプロジェクトには、あなたの「エンジニア・エージェント（仮）」が   │
│ 並行して接続されます。                                           │
│                                                                │
│                                       接続中  ●  ●  ●          │
└──────────────────────────────────────────────────────────────┘
```

実装：`src/components/ui/ConnectedIntelligenceAssets.tsx`

| 要素 | 仕様 |
|------|------|
| 外枠 | `rounded-2xl border border-white/10 bg-[#162035] border-l-4 border-l-cyan-400 p-5 sm:p-6 mb-4` |
| 見出し | white semibold ＋ lucide `Plug stroke-cyan-400` ＋ 左に縦バー（border-l-4） |
| Status:Ready ピル | `bg-emerald-500/15 text-emerald-300 ring-emerald-400/30 px-2 py-0.5 text-xs rounded-full` ＋ `bg-emerald-400` ドット |
| Agent:Synced 行 | `text-cyan-300` ＋ `bg-cyan-400` ドット |
| Endpoint 行 | `font-mono text-slate-400 text-xs`、値は `/api/atoa/${mdGuildId}` |
| 補助文 | slate-300 leading-relaxed |
| 接続中 ドット 3 個 | cyan-400 → 400/70 → 400/40、static、アニメ無し |

データソース：`pickBestFitMd(ownedMds, project)` の結果を `mdGuildId` として供給。

---

## 2. Apply CTA — 三段階の状態遷移

### 2.1 状態モデル

```
[応募前]
   knob = ピン留め: bg-cyan-400 + Plug icon
   label = 「知能をプラグイン（案件に参画）」
   aria-label = 「知能をプラグイン（案件に参画）」
   underwater でも grossly disabled
        ↓ (handleApply)
[プラグイン中]
   button text = "プラグイン中..."
   disabled, applying state
        ↓ (await fetch /api/applications/apply)
[接続完了 — 確認モーダル表示]
   role="dialog" / aria-modal / Esc / focus trap
   見出し: 接続完了
   本文 : あなたの知能（MD）に基づいた最適な条件で、案件にエントリーしました。…
   アクション: 「マイページで確認 →」/applications  ＋  「閉じる」
        ↓ (modal close OR navigate)
[Plugged-in / デプロイ済み]
   button = disabled emerald pill, lucide CheckCircle2
   aria-disabled="true"  aria-label="接続済み"
   classes: bg-emerald-500/10 ring-1 ring-emerald-400/40 text-emerald-300
            rounded-full px-4 py-2 text-sm font-semibold
   再訪時も Plugged-in で復帰
```

### 2.2 永続化

`localStorage["pluggedIn:${projectId}:${guildId}"]` に ISO timestamp を書き込み、
マウント時に同じキーを読み取って Plugged-in 状態を復元する。

```ts
const STORAGE_PREFIX = "pluggedIn:";
function pluggedInKey(projectId: string, guildId: string) {
  return `${STORAGE_PREFIX}${projectId}:${guildId}`;
}
```

SSR ／ ストレージ拒否環境では try/catch で silent-ignore — UI は応募前状態に戻るのみ。

### 2.3 確認モーダル

| 仕様 | 値 |
|------|-----|
| `role` | `dialog` |
| `aria-modal` | `true` |
| `aria-labelledby` | `plugin-confirm-heading` |
| カード | `bg-[#162035] rounded-2xl shadow-xl p-6 max-w-md max-w-[calc(100vw-32px)]` |
| オーバーレイ | `bg-black/60 backdrop-blur-sm` |
| Esc | キー押下で閉じる |
| Focus trap | Tab/Shift+Tab で内部要素に閉じ込める |
| Primary | 「マイページで確認 →」cyan-400 塗り + #0B1121 文字 + rounded-full → `/applications` |
| Secondary | 「閉じる」slate-300 テキストリンク |

---

## 3. Agent Active ピル（/applications）

各応募行に **既存のステータス（受付／AI鑑定中／クライアント確認中） ＋ Agent
Active ピル** を並列表示。`gap-2` で隣接。

| 仕様 | 値 |
|------|-----|
| 配色 | `bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30` |
| ドット | `bg-emerald-400` w-1.5 h-1.5 |
| ラベル | "Agent Active" |
| `aria-label` | "AI エージェントが接続中" |
| Tooltip | lucide `HelpCircle stroke-emerald-200/80` ＋ `title="人間の参画前から、AI レイヤでデプロイ済みです"` |
| 並び | StatusChip → AgentActivePill（モバイル＝カード右上、デスクトップ＝Status セル内） |

ページ最上部に slate-300 banner：「**Agent Active：あなたの知能はすでに動いています。**」

---

## 4. jargon-lint 差分

### 許可語（#121）
- 知能をプラグイン
- 案件に参画
- 接続完了
- Plugged-in
- デプロイ済み
- エンジニア・エージェント
- Connected Intelligence Assets
- Agent Active

### スコープ付き NG
- `aria-label="エージェントをデプロイ"` — **primary CTA では不可**。
  本文・モーダル・ドキュメントには現れて OK。
- 既存 NG 群（資産で応募する／プラグイン応募／この案件に応募する／Signup・
  Sign up・サインアップ・会員登録・無料登録／kawaii・shimaenaga 等の
  キャラクター系）は継続。

---

## 5. テスト一覧（Hybrid Plug-in System）

| テスト | 件数 | 場所 |
|--------|------|------|
| connected-intelligence-assets | 4 | `src/lib/__tests__/connected-intelligence-assets.test.ts` |
| apply-cta-copy（差し替え） | 4 | `src/lib/__tests__/apply-cta-copy.test.ts` |
| plug-in-flow | 4 | `src/lib/__tests__/plug-in-flow.test.ts` |
| agent-active-pill | 3 | `src/lib/__tests__/agent-active-pill.test.ts` |
| jargon-lint deploy-cta scope | +1 | 既存 `src/lib/__tests__/jargon-lint.test.ts` |

合計 **15 件**（うち新規ファイル 4 個 = 14 件、既存 1 件追記）。
