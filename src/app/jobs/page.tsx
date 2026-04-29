"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MOCK_JOBS, checkJobEligibility, applyToJob, getApplications } from "@/lib/jobs";
import { getWeapons } from "@/lib/weapons";
import { useTactile } from "@/hooks/useTactile";
import { Tip } from "@/components/Tip";
import type { Weapon } from "@/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyModal, setApplyModal] = useState<{ jobTitle: string; reward: number } | null>(null);
  const triggerPoyon = useTactile("poyon");

  useEffect(() => {
    setWeapons(getWeapons());
    const apps = getApplications();
    setAppliedIds(new Set(apps.map((a) => a.jobId)));
  }, []);

  function handleApply(jobId: string, reward: number) {
    const weapon = weapons[0];
    if (!weapon) return;
    applyToJob(jobId, weapon.id, reward);
    setAppliedIds((prev) => new Set([...prev, jobId]));
    triggerPoyon();
    const job = MOCK_JOBS.find((j) => j.id === jobId);
    setApplyModal({ jobTitle: job?.title ?? "案件", reward });
    setTimeout(() => setApplyModal(null), 2500);
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8">
      {/* Apply success modal */}
      {applyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-positive,#0E9F4F)]/30 rounded-3xl p-8 text-center max-w-xs mx-4 shadow-2xl animate-[slideInToast_220ms_ease-out]">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-[var(--n-positive,#0E9F4F)] font-bold text-lg mb-1">採用されました！</p>
            <p className="text-sm text-[var(--n-muted,#6B6456)] mb-3">「{applyModal.jobTitle}」</p>
            <p className="text-[var(--n-primary,#E64545)] font-black text-2xl tabular-nums">
              ¥{applyModal.reward.toLocaleString("ja-JP")} 着金
            </p>
          </div>
        </div>
      )}

      {/* ── かせぐ ヒーローブロック ─────────────────── */}
      <section className="mb-6 bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl px-5 py-4 shadow-sm">
        <h1 className="text-lg font-bold text-[var(--n-text,#1A1714)] mb-2">
          稼ぐ：あなたのノートが活きる案件を集めました
        </h1>
        <p className="text-sm text-[var(--n-muted,#6B6456)] leading-relaxed">
          ここでは AI エージェントや企業からの{" "}
          <span className="text-[#E64545] font-semibold">依頼</span>
          が並びます。マッチ度の高い案件を選んで、
          <span className="text-[#E64545] font-semibold">1 タップで応募</span>
          できます。
        </p>
      </section>

      <ul className="space-y-4 pb-24">
        {MOCK_JOBS.map((job) => {
          const eligibility = checkJobEligibility(weapons, job);
          const alreadyApplied = appliedIds.has(job.id);
          const seed = job.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
          const fit = 45 + (seed % 50);
          const fitLbl = fit >= 80 ? "ぴったり" : fit >= 50 ? "もう少し" : "これから";
          const fitCls = fit >= 80 ? "text-[var(--n-positive,#0E9F4F)]" : fit >= 50 ? "text-[var(--n-gold,#D4AF37)]" : "text-[var(--n-muted,#6B6456)]";
          const timeBucket = seed % 3 === 0 ? "今日中に終わる" : seed % 3 === 1 ? "今週中に終わる" : "いつでもOK";

          return (
            <li key={job.id} className={`bg-[var(--n-surface,#FFFFFF)] border rounded-3xl p-5 transition-all duration-220 ${
              eligibility.canApply && !alreadyApplied
                ? "border-[var(--n-primary,#E64545)]/30 hover:border-[var(--n-primary,#E64545)]/60 shadow-sm"
                : "border-[var(--n-divider,rgba(0,0,0,0.08))]"
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)] px-2 py-0.5 rounded-full">
                      {timeBucket}
                    </span>
                    <span className={`text-[10px] font-bold ${fitCls} inline-flex items-center`}>
                      マッチ度: {fitLbl}
                      <Tip text="あなたの登記済みノートとの相性です" />
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[var(--n-text,#1A1714)] leading-snug">{job.title}</h2>
                  <p className="text-xs text-[var(--n-muted,#6B6456)] mt-1 leading-relaxed line-clamp-2">{job.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-[var(--n-positive,#0E9F4F)] tabular-nums">¥{job.reward.toLocaleString("ja-JP")}</p>
                  <p className="text-[10px] text-[var(--n-muted,#6B6456)]">報酬</p>
                </div>
              </div>

              {/* Required badges */}
              {job.requiredTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {job.requiredTags.map((tag) => {
                    const owned = weapons.some((w) => w.tags.includes(tag));
                    return (
                      <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${owned ? "bg-[var(--n-positive,#0E9F4F)]/10 border-[var(--n-positive,#0E9F4F)]/30 text-[var(--n-positive,#0E9F4F)]" : "bg-[var(--n-surface-2,#F5F3EE)] border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)]"}`}>
                        {owned ? "✓" : "必要"} {tag}
                      </span>
                    );
                  })}
                </div>
              )}

              {alreadyApplied ? (
                <div className="rounded-2xl bg-[var(--n-positive,#0E9F4F)]/10 border border-[var(--n-positive,#0E9F4F)]/20 px-3 py-2 text-sm text-[var(--n-positive,#0E9F4F)] font-semibold text-center">
                  ✓ 応募済み — 着金しました
                </div>
              ) : eligibility.canApply ? (
                <button
                  type="button"
                  onClick={() => handleApply(job.id, job.reward)}
                  className="w-full py-3 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
                  aria-label={`${job.title}に応募する`}
                >
                  応募する
                </button>
              ) : (
                <div className="rounded-2xl bg-[var(--n-surface-2,#F5F3EE)] px-3 py-2 text-xs text-[var(--n-muted,#6B6456)] text-center">
                  🔒 {eligibility.hint} — <Link href="/bank" className="text-[var(--n-primary,#E64545)] hover:underline">のこすページへ</Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
