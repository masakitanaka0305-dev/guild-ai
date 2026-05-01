# Live Mode 設計（#129）

GUILD AI の `/guild` 知恵袋銀行カウンタを、**ユーザーの明示同意があるとき**だけ
高頻度（2s）＋音付きで動かすための設計仕様。default は OFF。

> 不利益を与える dark pattern にならないよう、3 つの原則を必ず守る：
> 1. **OFF が default**（黙示の opt-in は禁止）
> 2. **1 タップで OFF に戻せる**
> 3. **初回 ON 時に「音と更新頻度が上がる」と明示するトースト**を 1 度だけ表示

---

## 1. 状態モデル

| state | cadence | 音 | UI ピル | aria-live |
|---|---|---|---|---|
| `off`（default） | 3〜5 秒 ランダム + 12 ticks/60s rate-limit | 無音 | なし | 値の更新のみ |
| `on`（user opt-in） | **2 秒固定** | `playPoyon`（global mute toggle 尊重） | 「LIVE」ピル ＋ pulse ドット | 30 秒に 1 回サマリ「直近 30 秒で +¥X 入りました」 |

両モード共通：
- 表示する数値は同一（フラクショナル ¥ → 整数 ¥ への自動切替）
- reduced-motion 時はチップのフェードが無効、値だけ更新
- localStorage `coinLiveMode = "on" | "off"` で永続化（device 単位）
- localStorage `coinLiveMode:firstSeen = "1"` で初回トースト acknowledge を保存

---

## 2. UI: `<LiveModeSwitch>`

`src/components/ui/LiveModeSwitch.tsx`。MainHeader（モバイル）／AppShell
sidebar（デスクトップ）に常駐。

```tsx
<button
  role="switch"
  aria-checked={isOn}
  aria-label={
    isOn
      ? "Live モード ON。1 タップで OFF に戻せます（音と更新頻度を抑えます）"
      : "Live モード OFF。1 タップで ON にできます（音と更新頻度が上がります）"
  }
  data-testid="live-mode-switch"
  data-live={isOn ? "on" : "off"}
>
  <Activity /> Live
</button>
```

- `role="switch" aria-checked` で SR は **トグル**として認識
- `aria-label` は **状態 ＋ 結果** を必ず述べる（"ON にできます（…が上がります）"）
- フォーカスリングは `outline-[var(--color-action-primary)]`
- ON のとき pulse ドットが Activity アイコン横に出る（`motion-reduce:animate-none`）

### 初回 ON トースト

```tsx
<div role="status" aria-live="polite" data-testid="live-mode-first-toast">
  Live モード になりました。音と更新頻度が上がります。いつでも OFF にできます。
  <button onClick={ack}>わかりました</button>
</div>
```

- 表示は **1 デバイスにつき 1 回限り**（`coinLiveMode:firstSeen` が永続化）
- 「わかりました」ボタンで明示的に ack（タップしないとトーストは閉じない）

---

## 3. CoinCounter 内部実装（抜粋）

```ts
const TICK_MIN_MS = 3000;
const TICK_MAX_MS = 5000;
const LIVE_TICK_MS = 2000;
const ARIA_THROTTLE_MS = 30_000;

const ms = isLive
  ? LIVE_TICK_MS
  : TICK_MIN_MS + Math.floor(Math.random() * (TICK_MAX_MS - TICK_MIN_MS + 1));

if (isLive && !isMuted()) playPoyon();

if (now - lastAriaAtRef.current >= ARIA_THROTTLE_MS) {
  setAriaSummary(`直近 30 秒で +¥${tickAccumRef.current} 入りました`);
}
```

- Live モードは relaxed モードの 12 ticks/分 ガードを **意図的に bypass**
  （opt-in しているため）
- グローバル `isMuted()` トグルが ON の場合、Live モードでも音は出ない

---

## 4. テスト

| Test | カバー |
|---|---|
| `live-mode.test.ts > LiveModeSwitch` | role=switch / aria-checked / aria-label の状態反転 |
| `live-mode.test.ts > localStorage 'coinLiveMode'` | デフォ off ／ toggle で setItem |
| `live-mode.test.ts > first-on toast` | `coinLiveMode:firstSeen` の永続化／「わかりました」CTA |
| `live-mode.test.ts > CoinCounter wiring` | useLiveMode 購読／`LIVE_TICK_MS=2000`／chime 条件 |
| `live-mode.test.ts > LIVE pill + motion-reduce` | LIVE ピルは Live 時のみ／pulse は motion-safe |
| `live-mode.test.ts > aria-live throttle` | `ARIA_THROTTLE_MS=30_000` ＋ サマリ文 |
| `live-mode.test.ts > header mounting` | MainHeader ＋ AppShell の両方にマウントされている |

---

## 5. 既知の積み残し

- 視覚障害ユーザー向けに「Live モードの **強度を 3 段階**で選べる」仕様は次フェーズ
  （現状 OFF / ON の 2 値）。
- chime のサウンドソースは既存 `playPoyon`。Live mode 専用の音色は別途検討
- `forceLiveMode` prop は埋め込みコンテキスト用エスケープハッチ。通常 UI からは
  常に `useLiveMode` を経由
