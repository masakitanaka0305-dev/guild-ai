"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { mockLogin, isMockAuthed } from "@/lib/mock-auth";

// Only allow same-origin paths (defense against open-redirect)
function safeRedirect(target: string | null): string {
  if (!target) return "/";
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const [submitting, setSubmitting] = useState(false);

  // Already-authed guard: skip the form for returning visitors
  useEffect(() => {
    if (isMockAuthed()) router.replace(redirectTo);
  }, [redirectTo, router]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    mockLogin(
      String(fd.get("email") ?? ""),
      String(fd.get("password") ?? ""),
    );

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-kuroko mb-2">ログイン</h1>
      <p className="text-sm text-[#9890A8] mb-6">
        アカウントにサインインします
        {searchParams.get("redirect") && (
          <span className="block mt-1 text-xs text-kaki">
            ログイン後、元のページに戻ります
          </span>
        )}
      </p>

      <form onSubmit={onSubmit} className="section-card p-6 space-y-4">
        <label className="block">
          <span className="block text-xs font-semibold text-[#3A3664] mb-1">
            メールアドレス<span className="text-red-500 ml-1">*</span>
          </span>
          <input
            type="email" name="email" required autoComplete="email"
            className="input-base"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-[#3A3664] mb-1">
            パスワード<span className="text-red-500 ml-1">*</span>
          </span>
          <input
            type="password" name="password" required autoComplete="current-password"
            className="input-base"
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="btn-primary w-full !py-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "ログイン中…" : "ログイン"}
        </button>

        <div className="text-center text-sm text-[#9890A8]">
          アカウントをお持ちでない方は
          <Link href="/signup" className="text-kaki underline ml-1">こちらから登録</Link>
        </div>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-12 max-w-md mx-auto">
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
