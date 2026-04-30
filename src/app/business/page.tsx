"use client";

import { useState } from "react";
import Link from "next/link";
import { getZeroDayEvents, ZERO_DAY_OPTOUT_KEY } from "@/lib/zero-day";

export default function BusinessPage() {
  const events = getZeroDayEvents(true);
  const [alertEnabled, setAlertEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ZERO_DAY_OPTOUT_KEY) !== "1";
  });

  const handleToggleAlert = () => {
    const next = !alertEnabled;
    setAlertEnabled(next);
    if (typeof window !== "undefined") {
      if (next) {
        localStorage.removeItem(ZERO_DAY_OPTOUT_KEY);
      } else {
        localStorage.setItem(ZERO_DAY_OPTOUT_KEY, "1");
      }
    }
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      <Link href="/" className="text-xs text-[#9890A8] hover:text-kaki transition-colors">
        ← ホームに戻る
      </Link>

      {/* B2B Solution CTA — カタログ + 事前提案 */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/business/catalog"
          className="section-card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--n-primary,#E64545)] flex items-center justify-center flex-shrink-0 text-white text-lg">
            📦
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">ソリューションカタログ</p>
            <p className="text-xs text-[var(--n-muted,#6B6456)] mt-0.5">業種別 AI パッケージ 10 種、ROI 試算付き</p>
          </div>
          <span className="text-[var(--n-muted,#6B6456)] text-sm">→</span>
        </Link>
        <Link
          href="/business/presale"
          className="section-card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1A3A6B] flex items-center justify-center flex-shrink-0 text-white text-lg">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">AI 事前提案</p>
            <p className="text-xs text-[var(--n-muted,#6B6456)] mt-0.5">課題を入力 → MD バンドル + 見積もりを自動生成</p>
          </div>
          <span className="text-[var(--n-muted,#6B6456)] text-sm">→</span>
        </Link>
      </div>

      {/* Hero */}
      <div
        className="mt-6 rounded-2xl p-8 text-center"
        style={{ background: "linear-gradient(135deg, #1A3A6B 0%, #2D6BB5 100%)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">法人向け</p>
        <h1 className="text-2xl font-bold text-white mb-2">
          ゼロデイアラート
        </h1>
        <p className="text-sm text-white/70 mb-6 max-w-sm mx-auto leading-relaxed">
          エンジニアが今すぐ対応すべき技術変化を、最速でチームに届けます。
          汎用 AI が学習する前に、現場の専門家が書いた対応 MD を入手しましょう。
        </p>

        {/* Alert toggle */}
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-5 py-3 backdrop-blur-sm">
          <span className="text-sm font-semibold text-white">アラートを受け取る</span>
          <button
            type="button"
            role="switch"
            aria-checked={alertEnabled}
            aria-label="ゼロデイアラートの切替"
            onClick={handleToggleAlert}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/60 ${
              alertEnabled ? "bg-[var(--n-gold,#D4AF37)]" : "bg-white/20"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                alertEnabled ? "translate-x-[26px]" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className={`text-xs font-semibold ${alertEnabled ? "text-[var(--n-gold,#D4AF37)]" : "text-white/40"}`}>
            {alertEnabled ? "ON" : "OFF"}
          </span>
        </div>
      </div>

      {/* Value props */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: "⚡", title: "最速配信", desc: "汎用 AI が学習する前に対応情報を入手" },
          { icon: "🔍", title: "現場の知見", desc: "実運用で得た判断基準と対処パターン" },
          { icon: "🛡️", title: "リスク軽減", desc: "重大度別の優先順位付きで提供" },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="section-card p-4 text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-sm font-bold text-kuroko mb-1">{title}</p>
            <p className="text-xs text-[#9890A8] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Latest zero-day preview */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-kuroko">最新のゼロデイ情報</h2>
          <Link href="/feed/zero-day" className="text-xs text-[var(--n-primary,#E64545)] hover:underline font-semibold">
            すべて見る →
          </Link>
        </div>
        <div className="space-y-2">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="section-card p-3 flex items-start gap-3">
              <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                event.priority === "critical" ? "bg-[var(--n-primary,#E64545)] text-white" :
                event.priority === "high"     ? "bg-amber-500 text-white" :
                                                "bg-blue-500 text-white"
              }`}>
                {event.priority === "critical" ? "緊急" : event.priority === "high" ? "重要" : "通常"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-kuroko truncate">{event.title}</p>
                <p className="text-[10px] text-[#9890A8] mt-0.5 line-clamp-1">{event.description}</p>
              </div>
              <span className={`shrink-0 rounded-full text-[10px] px-2 py-0.5 ${
                event.status === "covered"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {event.status === "covered" ? "対応済" : "募集中"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan CTA */}
      <div className="mt-8 section-card p-6 text-center">
        <h2 className="text-base font-bold text-kuroko mb-1">チームプランで始める</h2>
        <p className="text-sm text-[#9890A8] mb-4 leading-relaxed">
          月額定額で全ゼロデイアラートを受信。
          Slack・Teams 連携、API 配信にも対応。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/business/checkout"
            className="inline-block rounded-xl bg-[var(--n-primary,#E64545)] px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            プランを選んで始める →
          </Link>
          <Link
            href="/marketplace/pro"
            className="inline-block rounded-xl border border-kuroko/20 px-8 py-3 text-sm font-bold text-kuroko hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
          >
            法人検索・相談
          </Link>
        </div>
        <p className="mt-3 text-[10px] text-[#9890A8]">初月無料 · クレジットカード不要（モック）</p>
      </div>
    </main>
  );
}
