import type { ReactNode } from "react";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { GuestInit } from "@/components/GuestInit";
import { SwRegister } from "@/components/SwRegister";
import { SessionProvider } from "@/components/SessionProviderWrapper";

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
    <html lang="ja" data-anim="off" className={`${notoSansJP.variable} bg-slate-950 text-slate-100`}>
      <head />
      <body className="bg-slate-950 text-slate-100 min-h-screen h-screen h-dvh flex overflow-hidden font-sans antialiased">
        <SessionProvider>
          <AuthProvider>
            {/* Sets localStorage.guild_authed="1" for all visitors (auth postponed to v2) */}
            <GuestInit />
            {/* Registers /sw.js in idle time for offline support */}
            <SwRegister />
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
