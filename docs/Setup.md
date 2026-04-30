# GUILD AI — Setup Guide

## 環境変数の設定

### 1. GitHub OAuth App の作成
1. https://github.com/settings/developers → "New OAuth App"
2. Application name: `GUILD AI`
3. Homepage URL: `http://localhost:3000`
4. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
5. Client ID / Client Secret を控える

### 2. NEXTAUTH_SECRET の生成
```bash
openssl rand -base64 32
```

### 3. Anthropic API Key
https://console.anthropic.com/ でキーを取得

### 4. .env.local の作成
`.env.local.example` をコピーして `.env.local` を作成し、各値を設定:
```bash
cp .env.local.example .env.local
```

### 5. Vercel への環境変数登録
```bash
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add ANTHROPIC_API_KEY
```

## モックモード（env なし）
`MOCK_GITHUB=true` で GitHub OAuth なしでデモ動作します。
`MOCK_DB=true` で Supabase なしでメモリ保存します。
