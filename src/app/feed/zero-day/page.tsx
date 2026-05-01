import Link from "next/link";
import { getZeroDayEvents } from "@/lib/zero-day";
import type { ZeroDayEvent } from "@/lib/zero-day";

const PRIORITY_LABEL: Record<string, string> = {
  critical: "緊急",
  high:     "重要",
  medium:   "通常",
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-[var(--primary,#06B6D4)] text-white",
  high:     "bg-amber-500 text-white",
  medium:   "bg-blue-500 text-white",
};

function EventCard({ event }: { event: ZeroDayEvent }) {
  const isCovered = event.status === "covered";
  const date = new Date(event.occurredAt);
  const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

  return (
    <article className="section-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLOR[event.priority] ?? "bg-gray-100 text-gray-700"}`}>
              {PRIORITY_LABEL[event.priority] ?? event.priority}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
              isCovered
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-600"
            }`}>
              {isCovered ? "対応MD公開中" : "未学習 — 募集中"}
            </span>
            <span className="text-[10px] text-slate-400 tabular-nums">{dateStr}</span>
          </div>

          <h2 className="text-sm font-bold text-white leading-snug mb-1">{event.title}</h2>
          <p className="text-xs text-text-primary leading-relaxed mb-3">{event.description}</p>

          {isCovered && event.coveredBy && (
            <div className="rounded-xl border border-green-100 bg-green-50/60 p-3 mb-3">
              <p className="text-[10px] font-semibold text-green-700 mb-1">対応MDあり</p>
              <Link
                href={`/asset/${event.coveredBy.guildId}`}
                className="text-xs font-semibold text-[var(--primary,#06B6D4)] hover:underline"
              >
                {event.coveredBy.title} →
              </Link>
              <p className="text-[10px] text-slate-400 mt-0.5">
                登録から {Math.floor(event.coveredBy.registeredAgoSec / 3600)}時間{Math.floor((event.coveredBy.registeredAgoSec % 3600) / 60)}分
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!isCovered && (
              <Link
                href={`/sell?topic=${encodeURIComponent(event.topic)}`}
                className="rounded-lg bg-[var(--primary,#06B6D4)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
              >
                対応MDを出品する →
              </Link>
            )}
            {isCovered && (
              <Link
                href={`/sell?topic=${encodeURIComponent(event.topic)}`}
                className="rounded-lg border border-kaki/30 bg-kaki/5 px-3 py-1.5 text-xs font-semibold text-kaki hover:bg-kaki/10 transition-colors"
              >
                改善版を出品する
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export const metadata = {
  title: "ゼロデイフィード — GUILD AI",
  description: "エンジニアが今すぐ知るべき未対応の技術変化をリアルタイムで配信。対応MDを出品して報酬を得よう。",
};

export default function ZeroDayFeedPage() {
  const events = getZeroDayEvents(true);
  const recruitingCount = events.filter((e) => e.status === "recruiting").length;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      <Link href="/" className="text-xs text-slate-400 hover:text-kaki transition-colors">
        ← ホームに戻る
      </Link>

      <div className="mt-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white">ゼロデイフィード</h1>
          {recruitingCount > 0 && (
            <span className="rounded-full bg-[var(--primary,#06B6D4)] px-2.5 py-0.5 text-xs font-bold text-white">
              {recruitingCount} 件 募集中
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400">
          エンジニアが今すぐ知るべき未対応の技術変化。
          対応MDを出品して、最速回答者になろう。
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="section-card p-3 text-center">
          <p className="text-[10px] text-slate-400 mb-0.5">合計</p>
          <p className="text-lg font-extrabold tabular-nums text-white">{events.length}</p>
        </div>
        <div className="section-card p-3 text-center">
          <p className="text-[10px] text-slate-400 mb-0.5">対応済み</p>
          <p className="text-lg font-extrabold tabular-nums text-green-600">
            {events.filter((e) => e.status === "covered").length}
          </p>
        </div>
        <div className="section-card p-3 text-center">
          <p className="text-[10px] text-slate-400 mb-0.5">募集中</p>
          <p className="text-lg font-extrabold tabular-nums text-[var(--primary,#06B6D4)]">
            {recruitingCount}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Business CTA */}
      <div
        className="mt-8 rounded-2xl p-6 text-center"
        style={{ background: "linear-gradient(135deg, #1A3A6B 0%, #2D6BB5 100%)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">法人向け</p>
        <h2 className="text-lg font-bold text-white mb-1">ゼロデイアラートを受け取る</h2>
        <p className="text-sm text-white/70 mb-4">
          優先度の高い技術変化を最速でチームに届けます。
        </p>
        <Link
          href="/business"
          className="inline-block rounded-xl bg-[var(--n-gold,#D4AF37)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          法人プランを見る →
        </Link>
      </div>
    </main>
  );
}
