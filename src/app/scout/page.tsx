import type { Metadata } from "next";
import Link from "next/link";
import { ScoutCalculator } from "./ScoutCalculator";

export const metadata: Metadata = {
  title: "GUILD AI — Turn Your GitHub Stars Into Real Income",
  description: "The only bank that converts your code into a perpetual royalty stream — built in Japan, paying in JPY/USD.",
  alternates: {
    languages: { en: "/scout", ja: "/" },
  },
  openGraph: {
    title: "Turn Your GitHub Stars Into Real Income — GUILD AI",
    description: "Submit once. Earn forever. Built in Japan.",
    type: "website",
  },
};

const FEATURED_BUILDERS = [
  {
    handle: "@han.dev",
    country: "🇰🇷",
    title: "TypeScript Utility Pack",
    rank: "A",
    earnedUsd: "$312",
    bio: "OSS contributor, 2.4k stars on GitHub",
  },
  {
    handle: "@sasha.k",
    country: "🇺🇦",
    title: "Async Python Pipeline",
    rank: "S",
    earnedUsd: "$780",
    bio: "Data engineer, specializes in ETL pipelines",
  },
  {
    handle: "@noah.io",
    country: "🇺🇸",
    title: "Go Microservice Template",
    rank: "A",
    earnedUsd: "$245",
    bio: "Backend dev, open-source advocate",
  },
];

const WHY_JAPAN = [
  {
    icon: "⚡",
    title: "Fast Entity Setup",
    body: "Register a business entity in Japan in under 5 business days. Legal protections for digital creators are among the strongest globally.",
  },
  {
    icon: "💴",
    title: "Stable JPY Payouts",
    body: "Receive royalties in JPY (1:1 with yen) or USD (×1.2 premium). Zero volatility unlike crypto platforms.",
  },
  {
    icon: "🛡",
    title: "IP Protection Built-in",
    body: "Every submission gets a JP-origin digital signature and Merkle-chain lineage record. Your work is yours, permanently.",
  },
  {
    icon: "🏦",
    title: "Creator Tax Benefit",
    body: "Japan's creator economy framework allows tech IP royalties to qualify for preferential tax treatment under certain conditions.",
  },
];

export default function ScoutPage() {
  return (
    <main className="min-h-screen bg-[#0A0F1E] text-white" lang="en">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-20 text-center sm:px-12 lg:px-24">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, #2D6BB5 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B5860A] mb-4">
            GUILD AI — Built in Japan
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Turn Your GitHub Stars
            <br />
            Into <span className="text-[#B5860A]">Real Income.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            The only bank that converts your code into a perpetual royalty stream —
            built in Japan, paying in JPY/USD.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sell"
              className="inline-flex items-center justify-center rounded-2xl bg-[#06B6D4] px-8 py-4 text-base font-bold text-white hover:bg-red-600 transition-colors active:scale-95"
            >
              Open My Account
            </Link>
            <Link
              href="/business"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Contact Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3 Steps ── */}
      <section className="px-6 py-16 sm:px-12 lg:px-24" aria-label="How it works">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How it works — <span className="text-[#B5860A]">3 steps</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "📥",
                title: "Submit",
                body: "Paste your GitHub repo URL. Our AI scans your README, extracts your best assets, and creates a listing in 60 seconds.",
              },
              {
                step: "02",
                icon: "🔍",
                title: "Verify",
                body: "AI auditor scores your submission on quality, originality, and execution depth. Top code earns S-rank.",
              },
              {
                step: "03",
                icon: "💴",
                title: "Earn",
                body: "Every API call on your asset generates a royalty. Ancestors get auto-paid too — build once, earn forever.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <p className="text-5xl font-black text-white/10 absolute top-4 right-5 select-none">
                  {s.step}
                </p>
                <p className="text-3xl mb-3">{s.icon}</p>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Calculator ── */}
      <section className="px-6 py-16 sm:px-12 lg:px-24 bg-white/5" role="form" aria-label="Income calculator">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            How much could <span className="text-[#B5860A]">your stars</span> earn?
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            Enter your GitHub star count and we&apos;ll estimate monthly royalties.
          </p>
          <ScoutCalculator />
        </div>
      </section>

      {/* ── Why Japan? ── */}
      <section className="px-6 py-16 sm:px-12 lg:px-24" aria-label="Why Japan">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why <span className="text-[#B5860A]">Japan</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {WHY_JAPAN.map((w) => (
              <div
                key={w.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 flex gap-4"
              >
                <span className="text-3xl flex-shrink-0">{w.icon}</span>
                <div>
                  <h3 className="font-bold mb-1">{w.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{w.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Builders ── */}
      <section className="px-6 py-16 sm:px-12 lg:px-24 bg-white/5" aria-label="Featured builders">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Featured <span className="text-[#B5860A]">Builders</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURED_BUILDERS.map((b) => (
              <div
                key={b.handle}
                className="rounded-2xl border border-white/10 bg-[#0D1426] p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D6BB5] to-[#B5860A] flex items-center justify-center text-lg">
                    {b.country}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{b.handle}</p>
                    <p className="text-[11px] text-gray-500">{b.bio}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-1">{b.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.rank === "S" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                    {b.rank} Rank
                  </span>
                  <span className="text-sm font-bold text-[#B5860A]">{b.earnedUsd}/mo</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-600">
            * Handles are composites. Earnings are illustrative estimates based on simulator.
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-6 py-20 sm:px-12 lg:px-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
          Your code is already working.
          <br />
          <span className="text-[#B5860A]">Make it pay you.</span>
        </h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Join builders from 30+ countries who registered their knowledge with GUILD AI.
        </p>
        <Link
          href="/sell"
          className="inline-flex items-center justify-center rounded-2xl bg-[#06B6D4] px-10 py-5 text-lg font-bold text-white hover:bg-red-600 transition-colors active:scale-95"
        >
          Open My Account →
        </Link>
      </section>
    </main>
  );
}
