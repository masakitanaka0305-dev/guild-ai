"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── 3-tab navigation: 探す / 出す / 稼ぐ ────────────────────────────────────

const NAV_ITEMS = [
  { href: "/projects",   label: "探す", icon: "search" },
  { href: "/onboarding", label: "出す", icon: "plus"   },
  { href: "/guild",      label: "稼ぐ", icon: "bank"   },
];

function isActive(pathname: string, href: string) {
  if (href === "/projects") return pathname === "/" || pathname === "/projects" || pathname.startsWith("/projects/");
  return pathname === href || pathname.startsWith(href + "/");
}

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const cls = `w-5 h-5 ${active ? "stroke-[var(--n-primary,#E64545)]" : "stroke-[var(--n-muted,#6B6456)]"}`;
  if (type === "search") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  if (type === "plus") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
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
                ? "bg-[var(--n-primary,#E64545)]/10 text-[var(--n-primary,#E64545)] font-bold"
                : "text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] hover:text-[var(--n-text,#1A1714)]"
            }`}
          >
            <TabIcon type={item.icon} active={active} />
            {item.label}
          </Link>
        );
      })}
      {/* Sub-navigation: enterprise + scout */}
      <div className="mt-auto pt-4 border-t border-[var(--n-divider,rgba(0,0,0,0.08))] mx-1 flex flex-col gap-1">
        <Link
          href="/marketplace/pro"
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-xl transition-colors ${
            isActive(pathname, "/marketplace/pro")
              ? "text-[var(--n-primary,#E64545)]"
              : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
          }`}
        >
          <span>🏢</span> 法人検索
        </Link>
        <Link
          href="/disputes"
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-xl transition-colors ${
            isActive(pathname, "/disputes")
              ? "text-[var(--n-primary,#E64545)]"
              : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
          }`}
        >
          <span>⚖️</span> 紛争解決
        </Link>
        <Link
          href="/scout"
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-xl transition-colors ${
            isActive(pathname, "/scout")
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
      role="tablist"
      aria-label="メインナビゲーション"
      className="lg:hidden border-t border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[var(--n-bg,#FAFAF7)] grid grid-cols-3 h-16 flex-shrink-0"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const isMid = item.href === "/onboarding";
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={active}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1 min-h-[52px] active:scale-[0.97] transition-colors ${
              active ? "text-[var(--n-primary,#E64545)]" : "text-[var(--n-muted,#6B6456)]"
            } ${isMid ? "relative" : ""}`}
          >
            {/* Center tab (出す) has elevated pill */}
            {item.href === "/onboarding" ? (
              <span className={`w-10 h-10 rounded-full flex items-center justify-center ${
                active ? "bg-[var(--n-primary,#E64545)]" : "bg-[var(--n-primary,#E64545)]"
              } shadow-md`}>
                <TabIcon type={item.icon} active />
              </span>
            ) : (
              <TabIcon type={item.icon} active={active} />
            )}
            <span className={`text-[10px] font-medium ${item.href === "/onboarding" ? "text-[var(--n-primary,#E64545)] font-bold" : ""}`}>
              {item.label}
            </span>
            {active && item.href !== "/onboarding" && (
              <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-[var(--n-primary,#E64545)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
