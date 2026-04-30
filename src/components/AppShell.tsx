"use client";

import Link from "next/link";
import { SidebarNav, BottomNav } from "@/components/SidebarNav";
import { IncomeStreamBar } from "@/components/IncomeStreamBar";
import { ZeroDayToast } from "@/components/ZeroDayToast";
import { MainHeader } from "@/components/MainHeader";
import { ZeroDayBanner } from "@/components/ZeroDayBanner";

// ─── Enterprise CTA banner — shared footer band, sticks above bottom nav ─────

function EnterpriseCTA() {
  return (
    <div
      data-testid="enterprise-cta-mobile"
      className="lg:hidden flex-shrink-0 sticky bottom-16 z-30 bg-[#162035] border-t border-cyan-400/20"
    >
      <Link
        href="/business/checkout"
        className="flex items-center justify-between px-4 py-2.5 text-[12px] font-semibold text-cyan-400 underline-offset-4 hover:underline hover:bg-cyan-400/5 transition-colors"
      >
        <span>🏢 提携・案件提供をご検討の企業様へ →</span>
      </Link>
    </div>
  );
}

function EnterpriseCTADesktop() {
  return (
    <div
      data-testid="enterprise-cta-desktop"
      className="flex-shrink-0 border-t border-white/10 bg-[#162035]"
    >
      <Link
        href="/business/checkout"
        className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-cyan-400 underline-offset-4 hover:underline hover:bg-cyan-400/5 transition-colors"
      >
        <span>🏢 提携・案件提供をご検討の企業様へ →</span>
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden lg:flex w-52 flex-shrink-0 flex-col border-r border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[#F2F0EB]">
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[var(--n-divider,rgba(0,0,0,0.08))] flex-shrink-0">
          <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[var(--primary,#06B6D4)]">
            <span className="text-white text-xs font-black tracking-wider">G</span>
          </div>
          <span className="text-sm font-bold text-[var(--n-text,#1A1714)]">GUILD AI</span>
        </div>
        <SidebarNav />
        <EnterpriseCTADesktop />
        <div className="px-4 py-3 border-t border-[var(--n-divider,rgba(0,0,0,0.08))] flex-shrink-0">
          <p className="text-[10px] text-[var(--n-muted,#6B6456)] leading-relaxed">
            寝てる間も、AIがあなたの知恵で稼ぐ場所です。
          </p>
        </div>
      </aside>

      {/* ── Right column ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <ZeroDayBanner />
        <MainHeader />
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          {children}
        </div>
        <EnterpriseCTA />
        <BottomNav />
        <IncomeStreamBar />
        <ZeroDayToast />
        {/* FAB — 出す (Quick Listing) — desktop only; mobile FAB lives in BottomNav */}
        <Link
          href="/onboarding"
          aria-label="出す"
          className="hidden lg:flex fixed right-8 bottom-8 z-50 w-14 h-14 items-center justify-center rounded-full shadow-xl text-2xl font-bold bg-[var(--primary,#06B6D4)] text-white hover:bg-[#0891B2] active:scale-[0.98] transition-all duration-220"
        >
          ＋
        </Link>
      </div>
    </>
  );
}
