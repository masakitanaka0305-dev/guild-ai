# Zero-Day Banner 設計

## 概要

優先度の高いゼロデイイベントを画面最上部に発光バナーとして表示する。
ユーザーがひと目で緊急情報に気づけるよう設計。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/components/ZeroDayBanner.tsx` | 発光バナーコンポーネント |
| `src/lib/zero-day/index.ts` | `getActivePriorityEvent()` 追加 |
| `src/app/layout.tsx` | `<ZeroDayBanner />` をヘッダーより上に配置 |

## 表示条件

- `getActivePriorityEvent()` が non-null（critical または high 優先度のイベントが存在）
- `guild_zero_day_dismissed_until` の localStorage 値が現在時刻より未来でない

## ビジュアル仕様

```
┌─────────────────────────────────────────────────────────┐
│ 🔴 緊急  マイナンバー改正対応 MD が...      [詳細] [×]  │  amber-rose gradient
└─────────────────────────────────────────────────────────┘
```

- 背景: `linear-gradient(to right, #FEF3C7, #FECACA)` (amber→rose)
- 発光: `bannerPulse` keyframe — box-shadow 0→16px、2.4s ループ
- `z-index: 40`（MainHeader z-30 の上）

## 24h 非表示

「×」ボタンをクリックすると `Date.now() + 86400000` を localStorage に保存。
次回ロード時に現在時刻と比較して非表示を継続。

## reduced-motion 対応

```css
@media (prefers-reduced-motion: reduce) {
  .banner-pulse { animation: none !important; }
}
```

`<style>` タグを inline で埋め込み（グローバル CSS 汚染を避ける）。

## アクセシビリティ

- `role="status"` + `aria-live="polite"` でスクリーンリーダーに穏やかに通知
- assertive（割り込み）は使用しない
- 「×」ボタンに `aria-label="バナーを閉じる（24時間非表示）"`

## getActivePriorityEvent

```typescript
export function getActivePriorityEvent(): ZeroDayEvent | null {
  const events = getZeroDayEvents(true); // priority order
  return events.find((e) => e.priority === "critical" || e.priority === "high") ?? null;
}
```
