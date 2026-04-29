import type { ReactNode } from "react";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SidebarNav, BottomNav } from "@/components/SidebarNav";
import { IncomeStreamBar } from "@/components/IncomeStreamBar";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-jp",
  display: "swap",
  weight: ["400", "500", "700", "900"],
});

const BASE_URL = "https://guild-ai.vercel.app";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: "AIエージェントで、あなたの時間をアップデート。｜日本最大のAIエージェント・プラットフォーム",
  description: "日本最大のAIエージェント・プラットフォーム",
  openGraph: {
    title: "AIエージェントで、あなたの時間をアップデート。｜日本最大のAIエージェント・プラットフォーム",
    description: "日本最大のAIエージェント・プラットフォーム",
    url: BASE_URL,
    siteName: "GUILD AI",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "GUILD AI" }],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIエージェントで、あなたの時間をアップデート。｜日本最大のAIエージェント・プラットフォーム",
    description: "日本最大のAIエージェント・プラットフォーム",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={notoSansJP.variable} data-theme="nameraka">
      <head />
      <body className="h-screen h-dvh flex bg-[var(--n-bg,#FAFAF7)] overflow-hidden text-[var(--n-text,#1A1714)] font-sans antialiased">

        {/* ── Desktop sidebar ───────────────────────────────── */}
        <aside className="hidden lg:flex w-52 flex-shrink-0 flex-col border-r border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[#F2F0EB]">
          {/* Logo */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[var(--n-divider,rgba(0,0,0,0.08))] flex-shrink-0">
            <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[var(--n-primary,#E64545)]">
              <span className="text-white text-xs font-black tracking-wider">G</span>
            </div>
            <span className="text-sm font-bold text-[var(--n-text,#1A1714)]">GUILD AI</span>
          </div>
          <SidebarNav />
          <div className="px-4 py-4 border-t border-[var(--n-divider,rgba(0,0,0,0.08))] flex-shrink-0">
            <p className="text-[10px] text-[var(--n-muted,#6B6456)] leading-relaxed">
              寝てる間も、AIがあなたの知恵で稼ぐ場所です。
            </p>
          </div>
        </aside>

        {/* ── Right column ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Mobile header */}
          <header className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[var(--n-bg,#FAFAF7)]/95 backdrop-blur-sm z-40 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--n-primary,#E64545)]">
                <span className="text-white text-[10px] font-black">G</span>
              </div>
              <span className="text-sm font-bold text-[var(--n-text,#1A1714)]">GUILD AI</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Mute button */}
              <button
                aria-label="サウンドのミュート切替"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/>
                </svg>
              </button>
              {/* Notification bell */}
              <button
                aria-label="通知"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </button>
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
            {children}
          </div>

          <BottomNav />

          {/* Global income stream toasts */}
          <IncomeStreamBar />

          {/* ＋ FAB — /bank への知恵登録ボタン */}
          <Link
            href="/bank"
            aria-label="投稿"
            className="fixed bottom-[88px] left-1/2 -translate-x-1/2 lg:left-auto lg:right-8 lg:bottom-8 lg:translate-x-0 z-50 w-14 h-14 flex items-center justify-center rounded-full shadow-xl text-2xl font-bold bg-[var(--n-primary,#E64545)] text-white hover:bg-[#D03A3A] active:scale-[0.98] transition-all duration-220"
          >
            ＋
          </Link>
        </div>

      </body>
    </html>
  );
}
