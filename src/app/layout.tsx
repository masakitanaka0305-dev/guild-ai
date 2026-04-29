import type { ReactNode } from "react";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SidebarNav, BottomNav } from "@/components/SidebarNav";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { ShimaenagaGuide } from "@/components/ShimaenagaGuide";
import { ThemeInitScript, ThemeToggle } from "@/components/ThemeToggle";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-jp",
  display: "swap",
  weight: ["400", "500", "700", "900"],
});

const BASE_URL = "https://guild-ai.vercel.app";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: "GUILD AI — スキルを資産に。AIが買いに来る。",
  description: "あなたのスキルやコードを資産として登録すると、世界中の人やAIが利用料を払って使ってくれます。寝ている間も、あなたの分身が稼ぎ続ける場所。",
  openGraph: {
    title: "GUILD AI — スキルを資産に。AIが買いに来る。",
    description: "スキルを登録したら、AIが勝手に値段をつけた。思考の深さと試行回数が、そのまま評価に反映される。",
    url: BASE_URL,
    siteName: "GUILD AI",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "GUILD AI" }],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GUILD AI — スキルを資産に。AIが買いに来る。",
    description: "スキルを登録したら、AIが勝手に値段をつけた。思考の深さと試行回数が、そのまま評価に反映される。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={notoSansJP.variable} data-theme="nameraka">
      <head>
        <ThemeInitScript />
      </head>
      <body className="h-screen h-dvh flex bg-[var(--n-bg,#0A192F)] overflow-hidden text-[var(--n-text,#F1F4F9)] font-sans antialiased [data-theme=kawaii]:bg-kami [data-theme=kawaii]:text-kuroko [data-theme=pro]:bg-obsidian [data-theme=pro]:text-t-text">

        {/* ── Desktop sidebar ───────────────────────────────── */}
        <aside className="hidden lg:flex w-52 flex-shrink-0 flex-col border-r border-[var(--n-divider,#1F3A66)] bg-[var(--n-surface,#0E2240)] [data-theme=kawaii]:bg-surface-inset [data-theme=kawaii]:border-kuroko/10 [data-theme=pro]:bg-obsidian-2 [data-theme=pro]:border-divider">
          {/* Logo */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[var(--n-divider,#1F3A66)] flex-shrink-0">
            <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#1F3A66] to-[var(--n-gold,#D4AF37)]">
              <span className="text-white text-xs font-black tracking-wider">G</span>
            </div>
            <span className="text-sm font-bold text-[var(--n-text,#F1F4F9)]">GUILD AI</span>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
          <SidebarNav />
          <div className="px-4 py-4 border-t border-[var(--n-divider,#1F3A66)] flex-shrink-0">
            <p className="text-xs text-[var(--n-muted,#9FB1C8)] leading-relaxed">
              知恵を、金塊に。
            </p>
          </div>
        </aside>

        {/* ── Right column ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Mobile header */}
          <header className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-[var(--n-divider,#1F3A66)] bg-[var(--n-bg,#0A192F)]/95 backdrop-blur-sm z-40 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#1F3A66] to-[var(--n-gold,#D4AF37)]">
                <span className="text-white text-[10px] font-black">G</span>
              </div>
              <span className="text-sm font-bold text-[var(--n-text,#F1F4F9)]">GUILD AI</span>
            </div>
            <ThemeToggle />
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
            {children}
          </div>

          <BottomNav />

          {/* ＋のこす FAB — nameraka: mobile center, desktop bottom-right */}
          <Link
            href="/bank"
            aria-label="ノートをのこす"
            className="fixed bottom-24 left-1/2 -translate-x-1/2 lg:left-auto lg:right-8 lg:bottom-8 lg:translate-x-0 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl font-bold text-sm bg-gradient-to-r from-[#1F3A66] via-[#2A5298] to-[var(--n-gold,#D4AF37)] text-white hover:opacity-90 active:scale-95 transition-all duration-220 [data-theme=pro]_&:hidden [data-theme=kawaii]_&:hidden"
          >
            <span className="text-lg leading-none">＋</span>
            <span>のこす</span>
          </Link>
        </div>

        <OnboardingGuide />

        {/* ShimaenagaGuide — kawaii theme only */}
        <div className="kawaii-only">
          <ShimaenagaGuide />
        </div>

      </body>
    </html>
  );
}
