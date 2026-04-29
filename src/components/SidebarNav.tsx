"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",      label: "ホーム", exact: true  },
  { href: "/bank",  label: "投稿",   exact: false },
  { href: "/jobs",  label: "案件",   exact: false },
  { href: "/guild", label: "運用",   exact: false },
];

const BOTTOM_ITEMS = [
  { href: "/",      label: "ホーム", icon: "home",  exact: true  },
  { href: "/bank",  label: "投稿",   icon: "save",  exact: false },
  { href: "/jobs",  label: "案件",   icon: "brief", exact: false },
  { href: "/guild", label: "運用",   icon: "bank",  exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const cls = `w-5 h-5 ${active ? "stroke-[var(--n-primary,#E64545)]" : "stroke-[var(--n-muted,#6B6456)]"}`;
  if (type === "home") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
  if (type === "save") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  );
  if (type === "brief") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  );
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto flex flex-col">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-all duration-220 active:scale-[0.98] rounded-2xl ${
              active
                ? "bg-[var(--n-primary,#E64545)]/10 text-[var(--n-primary,#E64545)] font-bold"
                : "text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] hover:text-[var(--n-text,#1A1714)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      {/* Subtle footer links — enterprise + global scout */}
      <div className="mt-auto pt-4 border-t border-[var(--n-divider,rgba(0,0,0,0.08))] mx-1 flex flex-col gap-1">
        <Link
          href="/marketplace/pro"
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-xl transition-colors ${
            isActive(pathname, "/marketplace/pro", false)
              ? "text-[var(--n-primary,#E64545)]"
              : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
          }`}
        >
          <span>🏢</span> 法人検索
        </Link>
        <Link
          href="/scout"
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-xl transition-colors ${
            isActive(pathname, "/scout", false)
              ? "text-[var(--n-primary,#E64545)]"
              : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
          }`}
        >
          <span>🌐</span> Global Scout
        </Link>
      </div>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインナビゲーション"
      className="lg:hidden border-t border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[var(--n-bg,#FAFAF7)] grid grid-cols-5 h-16 flex-shrink-0"
    >
      {/* left 2 tabs */}
      {BOTTOM_ITEMS.slice(0, 2).map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1 min-h-[52px] active:scale-[0.97] transition-colors ${
              active ? "text-[var(--n-primary,#E64545)]" : "text-[var(--n-muted,#6B6456)]"
            }`}
          >
            <TabIcon type={item.icon} active={active} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {active && <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-[var(--n-primary,#E64545)]" />}
          </Link>
        );
      })}
      {/* FAB slot — center placeholder */}
      <div aria-hidden="true" />
      {/* right 2 tabs */}
      {BOTTOM_ITEMS.slice(2).map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1 min-h-[52px] active:scale-[0.97] transition-colors ${
              active ? "text-[var(--n-primary,#E64545)]" : "text-[var(--n-muted,#6B6456)]"
            }`}
          >
            <TabIcon type={item.icon} active={active} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {active && <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-[var(--n-primary,#E64545)]" />}
          </Link>
        );
      })}
    </nav>
  );
}
