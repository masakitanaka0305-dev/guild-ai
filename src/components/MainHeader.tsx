"use client";

import { usePathname, useRouter } from "next/navigation";
import { getPageTitle, showBackButton } from "@/lib/nav-config";

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

      {/* Right: notification bell */}
      <div className="w-9 flex items-center justify-end">
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
