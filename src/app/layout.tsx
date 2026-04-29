import type { ReactNode } from "react";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SidebarNav, BottomNav } from "@/components/SidebarNav";
import { IncomeStreamBar } from "@/components/IncomeStreamBar";
import { ZeroDayToast } from "@/components/ZeroDayToast";
import { SupportChat } from "@/components/SupportChat";
import { MainHeader } from "@/components/MainHeader";

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
          {/* Mobile header — タイミー型中央タイトル */}
          <MainHeader />

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
            {children}
          </div>

          <BottomNav />

          {/* Global income stream toasts */}
          <IncomeStreamBar />

          {/* Zero-Day alert toast */}
          <ZeroDayToast />

          {/* Shima Support floating chat */}
          <SupportChat />

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
