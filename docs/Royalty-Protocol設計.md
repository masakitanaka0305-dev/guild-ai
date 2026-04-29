# Royalty Protocol 設計書 v1

> 「知識資産が API として呼ばれるたびに、作成者へ印税が分配される仕組み」

---

## 1. エンドポイント仕様

各 MD ノートには **固有の API エンドポイント** が自動発行されます。

```
https://guild-ai.vercel.app/api/note/{guildId}
```

### GET — メタ情報取得

```
GET /api/note/GUILD:0001
Cache-Control: public, max-age=30
```

レスポンス例：

```json
{
  "guildId": "GUILD:0001",
  "title": "ノート GUILD:0001",
  "rank": "A",
  "perCallJpy": 1.2,
  "callsTotal24h": 42,
  "status": "active",
  "endpointUrl": "https://guild-ai.vercel.app/api/note/GUILD:0001"
}
```

### POST — 実行（印税カウント）

```
POST /api/note/GUILD:0001
```

レスポンス例：

```json
{
  "ok": true,
  "callsTotal24h": 43,
  "earnedJpy": 1.2
}
```

---

## 2. 分配比率

| 受取先 | 割合 |
|--------|------|
| 作成者 | **70%** |
| プラットフォーム | **25%** |
| インデックス基金 | **5%** |

### 計算式

```typescript
distribute(perCallJpy: number): RoyaltyDistribution {
  author:    perCallJpy × 0.70
  platform:  perCallJpy × 0.25
  indexFund: perCallJpy × 0.05
}
```

例）1コール ¥1.2 の場合：作成者 ¥0.84 / プラットフォーム ¥0.30 / 基金 ¥0.06

---

## 3. 推定時給の計算式

```
推定時給 = 直近 60 秒の API 印税合計 × 60
```

- `useRoyaltyStream` が返す直近イベントをフィルタ（`now - at < 60_000ms`）
- 直近 60 秒にイベントがない場合は `月収 ÷ 720時間` をフォールバックとして表示
- 10 秒ごとに再計算（`setInterval(calc, 10_000)`）
- `aria-live="polite"` で数値変化をスクリーンリーダーへ通知
- `prefers-reduced-motion` でパルスアニメーション停止

---

## 4. リアルタイム表示の頻度ガード

| 対象 | 頻度上限 |
|------|---------|
| FloatingPayoutToast（API印税） | 最大 1 分に 1 回 |
| 推定時給の再計算 | 10 秒ごと |
| royaltyStream イベント発火 | 28〜32 秒ごと（約 2 回/分） |

---

## 5. curl 例（コードフェンス内）

```bash
# GET メタ情報
curl https://guild-ai.vercel.app/api/note/GUILD:0001

# POST 実行（印税カウント）
curl -X POST https://guild-ai.vercel.app/api/note/GUILD:0001
```

---

## 6. 関連ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/note-endpoint/index.ts` | `getEndpointStats` / `recordCall` / `formatEndpointUrl` |
| `src/lib/royalty-protocol/index.ts` | `distribute(perCallJpy)` → 70/25/5 分配 |
| `src/app/api/note/[guildId]/route.ts` | GET / POST ルートハンドラ |
| `src/app/guild/page.tsx` | 推定時給カード・稼働中ノート top3 |
| `src/app/bank/page.tsx` | 登録完了後の「この知恵の API」カード |
| `src/lib/royalty-stream/index.ts` | `useRoyaltyStream` — 28〜32s 間隔イベント |
| `src/lib/__tests__/royalty-protocol.test.ts` | 8 件のテスト |
