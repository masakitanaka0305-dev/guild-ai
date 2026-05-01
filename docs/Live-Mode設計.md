# Live Mode 設計（#129） — **撤回ノート（#130 で削除）**

> ## ステータス: REVOKED — 2026-05-01（#130 で撤去）
>
> #129 で実装した Live モード（CoinCounter の opt-in 高速ティッカー＋
> chime ＋ LIVE ピル）は、`#130 Healthy Excitement` の設計レビューで
> **撤回**しました。実装はコードベースから削除済み。本ドキュメントは
> 履歴として残します。

---

## 撤回した理由

1. **default 設計だけで十分**：3〜5s ランダムケイデンスとフラクショナル
   ¥ デルタは、それ単体で「動いている」「お礼が増えていく」感を
   ちゃんと作れていた。
2. **操作の複雑性を減らした**：トグル ＋ 初回トースト ＋ aria-live
   throttling という多層構造は、ヘッダの認知負荷を増やすわりに
   ユーザー価値が薄かった。
3. **音は global mute で十分**：ヘッダにもう 1 つトグルを置くより、
   既存の global mute を尊重するだけで OK。
4. **健全な熱狂は別軸で作る**：高頻度ティッカーで興奮を煽るより、
   `#130` で導入した **アチーブメント・ウォール／次のマイルストーン
   ／Hall of Fame ティッカー／Knowledge Map／ランク連動 reveal** の
   方が、達成感・期待・所属・発見・上達という健全な動機に
   ひもづく。

---

## 実装当時の挙動（参考）

| state | cadence | 音 | UI ピル |
|---|---|---|---|
| `off`（default） | 3〜5 秒 ランダム + 12 ticks/60s rate-limit | 無音 | なし |
| `on`（user opt-in） | 2 秒固定 | playPoyon（global mute 尊重） | 「LIVE」ピル ＋ pulse |

`localStorage["coinLiveMode"]` ＋ `localStorage["coinLiveMode:firstSeen"]`
で永続化、初回 ON 時に role="status" トーストで「音と更新頻度が上がります」
と明示。

---

## 撤去した成果物（#130 で削除）

- `src/hooks/useLiveMode.ts`
- `src/components/ui/LiveModeSwitch.tsx`
- `src/lib/__tests__/live-mode.test.ts`
- `<MainHeader>` ／ `<AppShell>` の `<LiveModeSwitch>` マウント
- CoinCounter の `useLiveMode` 購読 / `LIVE_TICK_MS` / `playPoyon` 呼び出し /
  `aria-live` throttle / forceLiveMode prop
- jargon-lint：`Live モード` / `LIVE` を **FORBIDDEN** に追加（再発防止）

CoinCounter は default のシンプル仕様に戻り、`#130` で生まれた 5 軸の
健全な熱狂（`docs/Healthy-Excitement設計.md`）にバトンを渡しています。
