"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getPageTitle, showBackButton } from "@/lib/nav-config";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";

export function MainHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  const hasBack = showBackButton(pathname);

  return (
    <header
      className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[var(--n-bg,#FAFAF7)]/95 backdrop-blur-sm z-40 flex-shrink-0 sticky top-0"
      aria-label="ページヘッダー"
    >
      {/* Left: back button or spacer */}
      <div className="w-9 flex items-center">
        {hasBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="前のページに戻る"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>

      {/* Center: page title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-[var(--n-text,#1A1714)] whitespace-nowrap">
        {title}
      </h1>

      {/* Right: theme toggle + small + entry + notification bell */}
      <div className="flex items-center justify-end gap-1">
        <ThemeSwitch />
        <Link
          href="/onboarding"
          aria-label="出す"
          data-testid="header-plus"
          className="w-9 h-9 flex items-center justify-center rounded-full text-cyan-400 hover:bg-cyan-400/10 transition-colors active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-cyan-400" aria-hidden />
        </Link>
        <button
          type="button"
          aria-label="通知"
          className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
