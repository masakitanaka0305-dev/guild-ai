# Notification Honesty 設計（#128）

GUILD AI の通知 UI が **事実通知**のみで構成され、根拠のない値動き告知や
FOMO（Fear Of Missing Out）演出を構造的に排除するための設計仕様。

> **大前提**：Cinematic Mint（#128）の演出を強くしたぶん、通知は逆に静かに、
> 事実だけを語る。「演出は強く、誤認はさせない」。

---

## 1. 採用する通知タイプ（fact-based）

| type | UI 文例 | データソース |
|---|---|---|
| `weekly_summary` | 「先週、あなたの知恵は **¥3,420 稼ぎました**」 | passbook の weekly aggregate（毎週月曜の朝） |
| `royalty_settled` | 「新しい印税が **¥84 入金されました**」 | royalty stream の confirmed event |
| `enterprise_interest` | 「**○○社**があなたの『観測性設計メモ』に注目しています」 | mock AtoA inquiry — 必ず counterparty を名指す |

`@/lib/notifications/honest-events` に上記 3 タイプを生成するヘルパーが揃って
おり、`buildHonestNotificationStack(userId)` が deterministic な 3 件
スタックを返す（SSR / テストのため）。

---

## 2. 不採用：根拠のない値動き告知

以下のコピーは jargon-lint の FORBIDDEN に追加し、UI 上で出現させない：

| 禁止コピー | 理由 |
|---|---|
| 「**急騰**」「**暴落**」「**値動き**」 | mock 価格のままユーザーに価値変動の幻想を与える |
| 「価値が **N% 上昇**」 | グランドトゥルース不在の数値発表は誤情報 |
| 「**X人が見ています**」 | viewer count 偽装は fake-counter の典型 |
| 「**今だけ**」「**残り N 件**」 | 商品在庫がない仕組みなので scarcity は嘘 |

`src/lib/notifications/honest-events.ts` の `FOMO_BANNED_PHRASES` が
ホワイトリストの逆として export されており、`notification-honesty.test.ts`
が UI ソースを走査して上記コピーが混入していないかを CI で fail させる。

---

## 3. 設計ルール（コードと文章の両方に効く）

1. **すべての通知は具体的な数値 or 相手を持つ**：金額、tx id、企業名、対象 MD
2. **未来を予測しない**：weekly summary は **過去**の集計だけ
3. **interest signal は名前を出す**：匿名 viewer count に置換しない
4. **時系列に嘘をつかない**：`at` は実イベントの ISO 8601、UI ソートも降順
5. **ロケール認識**：`¥` は `toLocaleString("ja-JP")` で正書、3 桁区切り

---

## 4. UX とアクセシビリティ

- 通知ベルから history 一覧（既存 NotificationCenter 流用）
- `aria-live="polite"` ＋ 各通知に `<time dateTime={n.at}>`
- バッジは未読件数のみ。未読件数の偽装値は禁止
- 1 日に同じ user に同じ event を **2 回送らない**（dedupe key）

---

## 5. テスト（CI で fail させる）

| Test | カバー |
|---|---|
| `notification-honesty.test.ts > buildHonestNotificationStack` | 3 件スタックの type 構成と決定性 |
| `notification-honesty.test.ts > weekly summary` | 過去金額への参照と attribution.amountJpy |
| `notification-honesty.test.ts > royalty notification` | tx id ＋ 実金額への anchor |
| `notification-honesty.test.ts > enterprise interest` | counterparty 名と asset title が含まれる |
| `notification-honesty.test.ts > UI sources never use 急騰 / N% 上昇` | `src/app` ＋ `src/components` の全走査 |

`jargon-lint.test.ts` の FORBIDDEN にも 急騰 / 暴落 / 値動き が追加され、
コメント以外の UI コピーで出現すれば即時失敗。

---

## 6. 既知の積み残し

- 通知ベル UI 自体（`src/components/NotificationBell.tsx`）への組込みは
  本 PR 範囲外。`buildHonestNotificationStack(userId)` を bell の data
  source に差し替えるだけで適用可
- 「○○社」の名前は `ENTERPRISE_NAMES` 配列に格納された mock 値。本番では
  AtoA inquiry payload から counterparty.name を引く
