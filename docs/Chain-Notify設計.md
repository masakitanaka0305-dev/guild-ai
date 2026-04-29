# Chain Notify 設計書

## 概要

`src/lib/chain-notify/index.ts`
`src/components/ChainNotifyToast.tsx`

MD が連鎖的に引用された際、連鎖の深さと累積配当の増加をユーザーに通知するバイラル UX。

## 発火ルール

| 条件 | 内容 |
|------|------|
| depth | ≥ 2（直接引用は対象外） |
| 頻度 | 最大 5 件 / 分（rate limiting）|
| 間隔 | 28〜48 秒ランダム |
| 通知文テンプレート | `あなたの「{title}」が {depth} 段階先で引用されました！累積配当が +¥{prev} → +¥{new} に増加中` |

## オプトアウト

```javascript
localStorage.setItem("guild_chain_notify_optout", "1");
```

## API

| 関数 | 説明 |
|------|------|
| `subscribeChain(cb)` | 連鎖通知を購読 |
| `unsubscribeChain(cb)` | 購読解除 |
| `simulateChainEvent(seed?)` | 決定論的モックイベント生成 |
| `getRecentChainEvents()` | 直近 5 件を返す |
| `_fireForTest(seed?)` | テスト用即時発火 |

## ChainNotifyToast コンポーネント

- **オーロラスタイル**：`background: linear-gradient(135deg, #D4AF37, #9B59B6)`（金→紫）。
- 通常の FloatingPayoutToast とは別レイヤー（`bottom-40`）。
- **Confetti**：8 粒の小ドット（`prefers-reduced-motion` で非表示）。
- `aria-live="polite"` + `role="status"` でスクリーンリーダー読み上げ。
- `prefers-reduced-motion` 時はフェードのみ（`animate-[slideInToast]` → `animate-[fadeIn]`）。

## /profile の「最近の連鎖」

`getRecentChainEvents()` の最新 5 件を `<ol>` で表示（ImpactCard 内）。

## テスト（`grand-launch.test.ts`）

| テスト | 保証内容 |
|--------|---------|
| depth ≥ 2 | simulateChainEvent の depth 値 |
| 決定論 | 同一 seed で同一結果 |
| _fireForTest | 購読者 callback 呼び出し + recent 追加 |
