"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── 2-tab navigation: 探す / 稼ぐ  +  center FAB: 出す ───────────────────────

const NAV_ITEMS = [
  { href: "/projects", label: "探す", icon: "search" },
  { href: "/guild",    label: "稼ぐ", icon: "bank"   },
];

const PRIMARY_ACTION = { href: "/onboarding", label: "出す", icon: "plus" };

function isActive(pathname: string, href: string) {
  if (href === "/projects") return pathname === "/" || pathname === "/projects" || pathname.startsWith("/projects/");
  return pathname === href || pathname.startsWith(href + "/");
}

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const cls = `w-5 h-5 ${active ? "stroke-[var(--primary,#06B6D4)]" : "stroke-[var(--n-muted,#6B6456)]"}`;
  if (type === "search") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  if (type === "plus") return (
    <svg className="w-6 h-6 stroke-white" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
  // bank / 稼ぐ
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav
      role="tablist"
      aria-label="メインナビゲーション"
      className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto flex flex-col"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={active}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-all duration-220 active:scale-[0.98] rounded-2xl ${
              active
                ? "bg-[var(--primary,#06B6D4)]/10 text-[var(--primary,#06B6D4)] font-bold"
                : "text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] hover:text-[var(--n-text,#1A1714)]"
            }`}
          >
            <TabIcon type={item.icon} active={active} />
            {item.label}
          </Link>
        );
      })}

      {/* Primary action: 出す — standalone highlighted card */}
      <Link
        href={PRIMARY_ACTION.href}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 mt-1 text-[13px] font-bold rounded-2xl bg-[var(--primary,#06B6D4)] text-white hover:bg-[#0891B2] active:scale-[0.98] transition-all duration-220 ${
          isActive(pathname, PRIMARY_ACTION.href) ? "opacity-90" : ""
        }`}
      >
        <span className="w-5 h-5 flex items-center justify-center">
          <svg className="w-4 h-4 stroke-white" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
        {PRIMARY_ACTION.label}
      </Link>

      {/* Sub-navigation: enterprise + scout */}
      <div className="mt-auto pt-4 border-t border-[var(--n-divider,rgba(0,0,0,0.08))] mx-1 flex flex-col gap-1">
        <Link
          href="/marketplace/pro"
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-xl transition-colors ${
            isActive(pathname, "/marketplace/pro")
              ? "text-[var(--primary,#06B6D4)]"
              : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
          }`}
        >
          <span>🏢</span> 法人検索
        </Link>
        <Link
          href="/disputes"
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-xl transition-colors ${
            isActive(pathname, "/disputes")
              ? "text-[var(--primary,#06B6D4)]"
              : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
          }`}
        >
          <span>⚖️</span> 紛争解決
        </Link>
        <Link
          href="/scout"
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-xl transition-colors ${
            isActive(pathname, "/scout")
              ? "text-[var(--primary,#06B6D4)]"
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
    <div className="lg:hidden flex-shrink-0 relative">
      {/* Center FAB — absolutely positioned, protruding above the bar */}
      <Link
        href={PRIMARY_ACTION.href}
        aria-label="出す"
        className="absolute left-1/2 -translate-x-1/2 -top-6 z-10 w-14 h-14 rounded-full bg-[var(--primary,#06B6D4)] text-white flex items-center justify-center shadow-xl text-2xl font-bold hover:bg-[#0891B2] active:scale-[0.95] transition-all duration-220"
      >
        ＋
      </Link>
      <nav
        role="tablist"
        aria-label="メインナビゲーション"
        className="border-t border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[var(--n-bg,#FAFAF7)] grid grid-cols-2 h-16"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={active}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1 active:scale-[0.97] transition-colors ${
                active ? "text-[var(--primary,#06B6D4)]" : "text-[var(--n-muted,#6B6456)]"
              }`}
            >
              <TabIcon type={item.icon} active={active} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-[var(--primary,#06B6D4)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
