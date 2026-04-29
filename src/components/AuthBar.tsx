"use client";

import { useState } from "react";
import Link from "next/link";
import { performLogoutAction } from "@/app/actions/auth";
import { useAuthState } from "@/components/AuthProvider";

/**
 * AuthBar — session-aware login/logout strip.
 * Reads from AuthProvider context (single fetch per page load).
 */
export function AuthBar() {
  const state = useAuthState();
  const user = state.user;
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await performLogoutAction();
    } finally {
      // Full reload guarantees AuthProvider re-fetches and any client cache
      // (passbook, etc.) is rebuilt from anonymous state.
      window.location.href = "/";
    }
  }

  if (state.status === "loading") {
    // Reserve vertical space to avoid layout shift on hydrate
    return <div className="px-4 sm:px-6 pt-4 pb-0 h-10" aria-hidden />;
  }

  return (
    <section className="px-4 sm:px-6 pt-4 pb-0 flex items-center justify-end gap-3 text-sm">
      {user ? (
        <>
          <span className="text-[var(--n-muted,#6B6456)] truncate max-w-[160px]" title={user.email}>
            <span className="font-bold text-[var(--n-text,#1A1714)]">{user.displayName}</span>
            <span className="ml-1">さん</span>
          </span>
          <Link
            href="/wallet"
            className="px-4 py-2 rounded-full text-[var(--n-text,#1A1714)] font-semibold hover:bg-[var(--n-surface-2,#F5F3EE)] active:scale-[0.98] transition-all duration-220"
          >
            マイページ
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-2 rounded-full border border-black/10 bg-white text-[var(--n-text,#1A1714)] font-semibold hover:bg-[var(--n-surface-2,#F5F3EE)] active:scale-[0.98] transition-all duration-220 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loggingOut ? "ログアウト中…" : "ログアウト"}
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-[var(--n-text,#1A1714)] font-semibold hover:bg-[var(--n-surface-2,#F5F3EE)] active:scale-[0.98] transition-all duration-220"
          >
            ログイン
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-full bg-[var(--n-primary,#E64545)] text-white font-semibold hover:bg-[#D03A3A] active:scale-[0.98] transition-all duration-220"
          >
            新規登録
          </Link>
        </>
      )}
    </section>
  );
}
