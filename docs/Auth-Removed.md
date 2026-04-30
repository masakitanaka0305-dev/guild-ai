# Auth Removed (v1 MVP)

認証フローは v1 MVP では後回しにします。

## 現状

- `/login`・`/signup` ページは削除済み
- ミドルウェアの認証リダイレクトは無効化 (`matcher: []`)
- `GuestInit` コンポーネントが全訪問者の `localStorage.guild_authed = "1"` を初期セット
- `AuthBar` は何も描画しない (`return null`)
- 認証関連の実装コード（`src/app/actions/auth.ts`、`src/lib/auth/`、`src/components/AuthProvider.tsx`）はコードベースに残存するが UI から呼び出されない

## v2 再導入予定

1. `GuestInit` を削除
2. `src/middleware.ts` に認証ガードを再追加
3. `src/app/login/page.tsx` を復元（`src/lib/mock-auth` を削除して DB auth に戻す）
4. `AuthBar` を復元
5. jargon-lint の auth-UI 禁止ルールを除去
