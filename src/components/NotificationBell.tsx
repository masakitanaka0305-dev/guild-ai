"use client";

import { useState } from "react";
import type { IncomeNotification } from "@/types";

interface NotificationBellProps {
  notifications: IncomeNotification[];
  unreadCount: number;
}

const TYPE_ICON: Record<string, string> = {
  job_income: "💰",
  royalty: "🎁",
  rank_up: "🏅",
  refund: "↩️",
};

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const effectiveUnread = Math.max(0, unreadCount - readIds.size);

  function handleOpen() {
    setOpen((prev) => !prev);
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    setReadIds(new Set(unread));
  }

  function formatTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return "今";
    if (diff < 60) return `${diff}分前`;
    return `${Math.floor(diff / 60)}時間前`;
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label={`通知 — 未読${effectiveUnread}件`}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {effectiveUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-kaki text-[10px] font-bold text-white">
            {effectiveUnread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-20 w-80 rounded-xl border border-white/10 bg-[#1A1530] shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-kami">お知らせ</h3>
              {effectiveUnread > 0 && (
                <span className="text-[11px] text-kaki">未読 {effectiveUnread}件</span>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {notifications.map((n) => {
                const isRead = n.read || readIds.has(n.id);
                return (
                  <li
                    key={n.id}
                    className={`px-4 py-3 flex gap-3 items-start ${isRead ? "opacity-60" : "bg-white/5"}`}
                  >
                    <span className="text-lg mt-0.5 shrink-0">{TYPE_ICON[n.type] ?? "📣"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-kami truncate">{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                      <p className="mt-1 text-[10px] text-[#6A607A]">{formatTime(n.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="px-4 py-2 border-t border-white/10">
              <button
                onClick={() => setOpen(false)}
                className="text-[11px] text-slate-400 hover:text-kaki transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
