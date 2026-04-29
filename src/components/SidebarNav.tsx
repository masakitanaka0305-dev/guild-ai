"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Nav item definitions ─────────────────────────────────────────────────────
// nameraka / pro (terminal) / kawaii labels — theme-aware at runtime
// 内部参照リンク：保管庫(/marketplace)・おさいふ通帳(/wallet) は footer から参照可

const NAV_ITEMS = [
  { href: "/",      namerakaLabel: "ホーム",       terminalLabel: "Home",                    kawaiiLabel: "🏠 ホーム",           exact: true  },
  { href: "/bank",  namerakaLabel: "のこす",        terminalLabel: "資産運用ターミナル",       kawaiiLabel: "🐦 シマエナガ銀行",   exact: false },
  { href: "/jobs",  namerakaLabel: "かせぐ",        terminalLabel: "Engagement Terminal",     kawaiiLabel: "💼 案件ボード",        exact: false },
  { href: "/guild", namerakaLabel: "マイ銀行",      terminalLabel: "Portfolio",               kawaiiLabel: "⚔️ 武器庫",           exact: false },
  { href: "/sell",  namerakaLabel: "はじめての提出", terminalLabel: "Lodge",                   kawaiiLabel: "➕ 登録（出品）",      exact: false },
  { href: "/wallet",namerakaLabel: "おさいふ",      terminalLabel: "Passbook",                kawaiiLabel: "💰 通帳・お知らせ",   exact: false },
];

const BOTTOM_ITEMS = [
  { href: "/",       namerakaLabel: "ホーム",  terminalLabel: "Home",      kawaiiLabel: "ホーム",  exact: true  },
  { href: "/bank",   namerakaLabel: "のこす",  terminalLabel: "Terminal",  kawaiiLabel: "🐦 銀行", exact: false },
  { href: "/jobs",   namerakaLabel: "かせぐ",  terminalLabel: "Engage",    kawaiiLabel: "💼 案件", exact: false },
  { href: "/guild",  namerakaLabel: "マイ銀行", terminalLabel: "Portfolio", kawaiiLabel: "⚔️ 武器庫", exact: false },
  { href: "/sell",   namerakaLabel: "のこす＋", terminalLabel: "Lodge",     kawaiiLabel: "➕ 登録", exact: false },
  { href: "/wallet", namerakaLabel: "おさいふ", terminalLabel: "Passbook",  kawaiiLabel: "💰 通帳", exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-all duration-200 active:scale-[0.98] rounded-2xl ${
              active
                ? "bg-[var(--n-gold-glow,rgba(212,175,55,0.15))] text-[var(--n-gold,#D4AF37)] font-bold"
                : "text-[var(--n-muted,#9FB1C8)] hover:bg-[var(--n-surface,rgba(14,34,64,0.6))] hover:text-[var(--n-text,#F1F4F9)]"
            }`}
          >
            {/* Pro label (data-theme=pro) */}
            <span className="hidden [data-theme=pro]_&:block font-mono text-xs uppercase tracking-widest">
              {item.terminalLabel}
            </span>
            {/* Kawaii label (data-theme=kawaii) */}
            <span className="hidden [data-theme=kawaii]_&:block">
              {item.kawaiiLabel}
            </span>
            {/* Nameraka label (default + data-theme=nameraka) */}
            <span className="[data-theme=pro]_&:hidden [data-theme=kawaii]_&:hidden">
              {item.namerakaLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden border-t border-[var(--n-divider,rgba(26,22,40,0.10))] bg-[var(--n-bg,#0A192F)] flex h-14 flex-shrink-0">
      {BOTTOM_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 py-1 active:scale-[0.98] transition-colors ${
              active
                ? "text-[var(--n-gold,#D4AF37)]"
                : "text-[var(--n-muted,#9FB1C8)]"
            }`}
          >
            {/* Pro label */}
            <span className="hidden [data-theme=pro]_&:block text-[9px] font-mono uppercase tracking-widest">
              {item.terminalLabel}
            </span>
            {/* Kawaii label */}
            <span className="hidden [data-theme=kawaii]_&:block text-[10px] font-medium">
              {item.kawaiiLabel}
            </span>
            {/* Nameraka label */}
            <span className="[data-theme=pro]_&:hidden [data-theme=kawaii]_&:hidden text-[10px] font-medium">
              {item.namerakaLabel}
            </span>
            {active && (
              <span className="absolute bottom-1.5 w-4 h-0.5 rounded-full bg-[var(--n-gold,#D4AF37)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
