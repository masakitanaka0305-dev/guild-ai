"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mockLogin } from "@/lib/mock-auth";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<"github" | "google" | "dev" | null>(null);

  function handleGithub() {
    setBusy("github");
    signIn("github", { callbackUrl: "/welcome" });
  }

  function handleGoogle() {
    setBusy("google");
    signIn("google", { callbackUrl: "/welcome" });
  }

  function handleDevBypass() {
    setBusy("dev");
    mockLogin("demo@guild-ai.dev", "dev-bypass");
    router.push("/projects");
  }

  return (
    <main className="min-h-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-[var(--n-text,#1A1714)] tracking-tight">
            GUILD AI
          </h1>
          <p className="mt-2 text-sm text-[var(--n-muted,#6B6456)]">
            ログインして案件を見る
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGithub}
            disabled={busy !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-[#1A1714] text-white text-sm font-bold hover:bg-[#2A2520] disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            {busy === "github" ? "接続中…" : "GitHub で続ける"}
          </button>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white text-[var(--n-text,#1A1714)] text-sm font-bold border border-[var(--n-divider,rgba(0,0,0,0.12))] hover:bg-[var(--n-surface-2,#F5F3EE)] disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" fill="#34A853" />
              <path d="M5.84 14.1A6.61 6.61 0 015.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
            </svg>
            {busy === "google" ? "接続中…" : "Google で続ける"}
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] text-[var(--n-muted,#6B6456)] leading-relaxed">
          続けることで{" "}
          <a href="/legal/terms" className="underline">利用規約</a>
          {" "}に同意したとみなされます
        </p>

        {/* ─── DEV ONLY 入室ボタン — 本番リリース前に削除 ────────────── */}
        <div className="mt-10 relative rounded-2xl border-2 border-dashed border-yellow-400 bg-yellow-50 p-4 overflow-hidden">
          <div className="absolute -top-px left-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black tracking-wider px-3 py-1 text-center">
            ⚠ DEV ONLY ⚠ 本番リリース前に削除
          </div>
          <div className="pt-5">
            <p className="text-xs font-bold text-yellow-900 mb-2">
              開発中バイパス
            </p>
            <p className="text-[11px] text-yellow-800 mb-3 leading-relaxed">
              認証をスキップして <code className="font-mono bg-yellow-100 px-1 rounded">demo-user</code> として案件画面へ直接入室します。
            </p>
            <button
              type="button"
              onClick={handleDevBypass}
              disabled={busy !== null}
              className="w-full px-4 py-2.5 rounded-xl bg-yellow-400 text-yellow-900 text-sm font-black hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {busy === "dev" ? "入室中…" : "→ そのまま入室する（開発中）"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
