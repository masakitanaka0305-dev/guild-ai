"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shimaenaga } from "@/components/Shimaenaga";
import { Confetti } from "@/components/Confetti";
import { RankBadge } from "@/components/RankBadge";
import { RatingPlate } from "@/components/RatingPlate";
import { GoldenSeal } from "@/components/GoldenSeal";
import { MOCK_JOBS, checkJobEligibility, applyToJob, getApplications } from "@/lib/jobs";
import { getWeapons } from "@/lib/weapons";
import { playPassbookChime } from "@/lib/sound";
import { useTactile } from "@/hooks/useTactile";
import type { Weapon, Job } from "@/types";

// ─── Kawaii hint bubble ──────────────────────────────────────────────────────

function HintBubble({ hint, weaponTitle }: { hint: string; weaponTitle?: string }) {
  const [open, setOpen] = useState(false);
  const msg = weaponTitle ? `この武器（${weaponTitle}）が あれば クリアできるよ！` : hint;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-[10px] text-ink-muted hover:text-gold transition-colors" aria-label="シマエナガのヒントをみる">
        <Shimaenaga variant="wave" size="xs" mode="avatar" aria-hidden />
        <span>ヒント</span>
      </button>
      {open && (
        <div className="absolute bottom-7 left-0 z-20 w-52 rounded-2xl bg-white border-2 border-gold-soft shadow-lg p-3 text-xs text-ink leading-snug">
          <div className="flex items-start gap-2">
            <Shimaenaga variant="trust" size="xs" mode="avatar" className="shrink-0 mt-0.5" />
            <p>{msg}</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold text-white text-[10px] flex items-center justify-center" aria-label="ヒントをとじる">×</button>
          <div className="mt-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#F2DFA0] ml-3" />
        </div>
      )}
    </div>
  );
}

// ─── Kawaii job card ─────────────────────────────────────────────────────────

function JobCard({ job, weapons, appliedIds, onApply }: { job: Job; weapons: Weapon[]; appliedIds: Set<string>; onApply: (jobId: string, reward: number) => void }) {
  const eligibility = checkJobEligibility(weapons, job);
  const alreadyApplied = appliedIds.has(job.id);
  const cardClass = eligibility.canApply && !alreadyApplied ? "section-card p-5 border-2 border-gold job-gold-glow transition-all" : "section-card p-5 border border-ink/10 transition-all";

  return (
    <li className={cardClass + (!eligibility.canApply && !alreadyApplied ? " opacity-60" : "")}>
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest">{job.category}</span>
            <RankBadge rank={job.requiredRank} friendly />
          </div>
          <h2 className="mt-1 text-base font-bold text-ink leading-snug">{job.title}</h2>
          <p className="mt-1 text-sm text-ink-muted leading-relaxed line-clamp-2">{job.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black text-accent-green tabular-nums">¥{job.reward.toLocaleString("ja-JP")}</p>
          <p className="text-[10px] text-ink-muted">おだちん</p>
        </div>
      </div>
      {job.requiredTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {job.requiredTags.map((tag) => {
            const owned = weapons.some((w) => w.tags.includes(tag));
            return (
              <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${owned ? "bg-gold-light border-gold/40 text-[#7A5000]" : "bg-ink/5 border-ink/15 text-ink-muted"}`}>
                {owned ? "✓" : "まだない"} {tag}
              </span>
            );
          })}
        </div>
      )}
      {alreadyApplied ? (
        <div className="mt-2 rounded-2xl bg-accent-green/10 border border-accent-green/20 px-3 py-2 text-sm text-accent-green font-semibold text-center">✓ えらんでもらえた！ おだちんうけとりました</div>
      ) : eligibility.canApply ? (
        <button type="button" onClick={() => onApply(job.id, job.reward)} className="mt-2 w-full rounded-2xl bg-gradient-to-r from-gold to-timee-yellow text-[#7A5000] font-bold py-2.5 text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all" aria-label={`${job.title}にえらんでもらう`}>
          ⚔️ えらんでもらう →
        </button>
      ) : (
        <div className="mt-2 space-y-1.5">
          <div className="rounded-2xl bg-ink/5 border border-ink/10 px-3 py-2 text-xs text-ink-muted text-center">🔒 {eligibility.hint}</div>
          <div className="flex items-center justify-between">
            <HintBubble hint={eligibility.hint} weaponTitle={eligibility.matchedWeapon?.title} />
            <Link href="/bank" className="text-xs text-gold hover:underline">シマエナガ銀行でぶきをつくる →</Link>
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Terminal job row ────────────────────────────────────────────────────────

function JobRow({ job, weapons, appliedIds, onApply }: { job: Job; weapons: Weapon[]; appliedIds: Set<string>; onApply: (jobId: string, reward: number) => void }) {
  const eligibility = checkJobEligibility(weapons, job);
  const alreadyApplied = appliedIds.has(job.id);
  const yieldPct = job.requiredRank === "S" ? "18.4" : job.requiredRank === "A" ? "12.3" : "7.2";

  return (
    <tr className={`border-b border-[var(--divider,#2A2F38)] text-[11px] font-mono hover:bg-[var(--obsidian-2,#11141A)] transition-colors duration-100 ${!eligibility.canApply && !alreadyApplied ? "opacity-50" : ""}`}>
      <td className="px-3 py-2 text-[var(--text-primary,#E8EBF0)] max-w-[200px]">
        <div className="flex items-center gap-2">
          {eligibility.canApply && !alreadyApplied && <GoldenSeal size={24} />}
          <span className="truncate">{job.title}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-[var(--text-muted,#98A1B0)] hidden sm:table-cell">{job.category}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {job.requiredTags.length === 0 ? (
            <span className="text-[var(--text-muted,#98A1B0)]">—</span>
          ) : job.requiredTags.map((tag) => {
            const owned = weapons.some((w) => w.tags.includes(tag));
            return (
              <span key={tag} className={`px-1.5 py-0.5 rounded-[var(--radius-sm,2px)] text-[9px] border ${owned ? "border-[var(--t-gold,#D4AF37)] text-[var(--t-gold,#D4AF37)]" : "border-[var(--divider,#2A2F38)] text-[var(--text-muted,#98A1B0)]"}`}>
                {tag}
              </span>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-2 text-positive tabular-nums hidden sm:table-cell">{yieldPct}%</td>
      <td className="px-3 py-2 tabular-nums">
        {alreadyApplied ? (
          <span className="text-positive">● APPLIED</span>
        ) : eligibility.canApply ? (
          <span className="text-[var(--t-gold,#D4AF37)]">● ELIGIBLE</span>
        ) : (
          <span className="text-[var(--text-muted,#98A1B0)]">○ LOCKED</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {alreadyApplied ? (
          <span className="text-positive tabular-nums">+¥{job.reward.toLocaleString("ja-JP")}</span>
        ) : eligibility.canApply ? (
          <button
            type="button"
            onClick={() => onApply(job.id, job.reward)}
            className="px-3 py-1 text-[10px] font-bold bg-[var(--t-gold,#D4AF37)] text-[#0B0D10] rounded-[var(--radius-sm,2px)] hover:opacity-90 transition-opacity duration-100 uppercase tracking-widest"
            aria-label={`${job.title} に応募`}
          >
            APPLY
          </button>
        ) : (
          <Link href="/bank" className="text-[var(--text-muted,#98A1B0)] hover:text-[var(--t-gold,#D4AF37)] transition-colors duration-100">
            + Recipe
          </Link>
        )}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [confetti, setConfetti] = useState(false);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<string>("nameraka");
  const [applyModal, setApplyModal] = useState<{ jobTitle: string; reward: number } | null>(null);
  const triggerQuest = useTactile("quest");

  useEffect(() => {
    setMounted(true);
    setWeapons(getWeapons());
    const apps = getApplications();
    setAppliedIds(new Set(apps.map((a) => a.jobId)));

    const t = document.documentElement.getAttribute("data-theme") ?? "nameraka";
    setTheme(t);
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") ?? "nameraka");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const isPro = theme === "pro";
  const isNameraka = theme === "nameraka";
  const isTerminal = isPro; // legacy compat

  function handleApply(jobId: string, reward: number) {
    const weapon = weapons[0];
    if (!weapon) return;
    applyToJob(jobId, weapon.id, reward);
    setAppliedIds((prev) => new Set([...prev, jobId]));
    setLastReward(reward);
    playPassbookChime();
    triggerQuest();
    if (isNameraka) {
      const job = MOCK_JOBS.find((j) => j.id === jobId);
      setApplyModal({ jobTitle: job?.title ?? "案件", reward });
      setTimeout(() => setApplyModal(null), 2500);
    } else if (!isTerminal) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2000);
    }
  }

  const canApplyCount = mounted ? MOCK_JOBS.filter((j) => checkJobEligibility(weapons, j).canApply && !appliedIds.has(j.id)).length : 0;

  // ─── Nameraka layout (タイミー style) ────────────────────────────────────

  if (isNameraka) {
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

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)]">かせぐ</h1>
          <p className="text-sm text-[var(--n-muted,#6B6456)] mt-1">
            あいしょうの高い案件から、すぐ応募できます。
          </p>
        </div>

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
                      <span className={`text-[10px] font-bold ${fitCls}`}>
                        あいしょう: {fitLbl}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-[var(--n-text,#1A1714)] leading-snug">{job.title}</h2>
                    <p className="text-xs text-[var(--n-muted,#6B6456)] mt-1 leading-relaxed line-clamp-2">{job.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-[var(--n-positive,#0E9F4F)] tabular-nums">¥{job.reward.toLocaleString("ja-JP")}</p>
                    <p className="text-[10px] text-[var(--n-muted,#6B6456)]">おだちん</p>
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
                    この知恵で応募 →
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

  // ─── Pro layout ─────────────────────────────────────────────────────────

  if (isPro) {
    return (
      <main className="flex flex-col h-full min-h-0 bg-[var(--obsidian,#0B0D10)] text-[var(--text-primary,#E8EBF0)]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--divider,#2A2F38)] flex-shrink-0">
          <div>
            <h1 className="text-sm font-mono font-bold text-[var(--t-gold,#D4AF37)] uppercase tracking-widest">
              Engagement Terminal
            </h1>
            <p className="text-[10px] font-mono text-[var(--text-muted,#98A1B0)] mt-0.5">
              実行可能案件一覧 — 報酬ストリーム対応
            </p>
          </div>
          {mounted && (
            <div className="flex items-center gap-4 font-mono text-[10px]">
              <div>
                <span className="text-[var(--text-muted,#98A1B0)]">Recipes: </span>
                <span className="text-[var(--text-primary,#E8EBF0)] tabular-nums">{weapons.length}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted,#98A1B0)]">Eligible: </span>
                <span className="text-[var(--t-gold,#D4AF37)] tabular-nums">{canApplyCount}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted,#98A1B0)]">Applied: </span>
                <span className="text-positive tabular-nums">{appliedIds.size}</span>
              </div>
              {lastReward && (
                <div className="border border-positive rounded-[var(--radius-sm,2px)] px-2 py-0.5 text-positive">
                  +¥{lastReward.toLocaleString("ja-JP")} REWARD
                </div>
              )}
            </div>
          )}
        </div>

        {/* No recipes state */}
        {mounted && weapons.length === 0 && (
          <div className="m-5 border border-[var(--divider,#2A2F38)] rounded-[var(--radius-md,4px)] p-5 text-center">
            <p className="text-xs font-mono text-[var(--text-muted,#98A1B0)]">
              登録済みRecipeなし — 資産運用ターミナルでノートを提出してください
            </p>
            <Link href="/bank" className="inline-block mt-3 px-4 py-1.5 text-[10px] font-mono font-bold bg-[var(--t-gold,#D4AF37)] text-[#0B0D10] rounded-[var(--radius-md,4px)] uppercase tracking-widest">
              ASSET TERMINAL →
            </Link>
          </div>
        )}

        {/* Engagements table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[var(--obsidian,#0B0D10)] z-10">
              <tr className="border-b border-[var(--divider,#2A2F38)]">
                {["Title", "Domain", "Required Recipes", "Yield %", "Status", "Action"].map((h, i) => (
                  <th key={h} className={`px-3 py-2 text-left text-[9px] font-mono font-bold text-[var(--text-muted,#98A1B0)] uppercase tracking-widest ${i === 1 || i === 3 ? "hidden sm:table-cell" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_JOBS.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  weapons={weapons}
                  appliedIds={appliedIds}
                  onApply={handleApply}
                />
              ))}
            </tbody>
          </table>
        </div>
      </main>
    );
  }

  // ─── Kawaii layout ────────────────────────────────────────────────────────

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      <Confetti active={confetti} duration={1800} />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Shimaenaga variant="key" size="md" mode="avatar" className="shimaenaga-mascot" />
          <div>
            <h1 className="text-2xl font-bold text-ink">いまスグできる おねがい（クエスト）</h1>
            <p className="text-sm text-ink-muted">ぶきをそうびして かせごう</p>
          </div>
        </div>
        <Link href="/bank" className="rounded-2xl bg-gradient-to-r from-gold to-timee-yellow text-[#7A5000] font-bold px-4 py-2 text-sm shrink-0">
          + ぶきをつくる
        </Link>
      </div>

      {mounted && (
        <div className="section-card p-4 mb-5 flex flex-wrap gap-4 border border-gold-soft">
          <div><p className="text-xs text-ink-muted">もっているぶき</p><p className="text-xl font-bold text-ink tabular-nums">{weapons.length} ほん</p></div>
          <div><p className="text-xs text-ink-muted">できるクエスト</p><p className="text-xl font-bold text-gold tabular-nums">{canApplyCount} けん</p></div>
          <div><p className="text-xs text-ink-muted">おうぼずみ</p><p className="text-xl font-bold text-accent-green tabular-nums">{appliedIds.size} けん</p></div>
          {lastReward && (
            <div className="ml-auto flex items-center gap-2 rounded-2xl bg-accent-green/10 border border-accent-green/20 px-4 py-2">
              <span className="text-lg animate-bounce">🎉</span>
              <div><p className="text-xs text-accent-green font-semibold">おだちんゲット！</p><p className="text-base font-black text-accent-green tabular-nums">+¥{lastReward.toLocaleString("ja-JP")}</p></div>
            </div>
          )}
        </div>
      )}

      {mounted && weapons.length === 0 && (
        <div className="mb-5 section-card p-6 text-center border-2 border-dashed border-gold/30">
          <Shimaenaga variant="wave" size="md" mode="seal" className="mx-auto shimaenaga-mascot" />
          <h2 className="mt-3 text-base font-bold text-ink">ぶきがまだありません</h2>
          <p className="mt-1 text-sm text-ink-muted">シマエナガ銀行にノートをあずけるとぶきができます。</p>
          <Link href="/bank" className="rounded-2xl bg-gradient-to-r from-gold to-timee-yellow text-[#7A5000] font-bold px-5 py-2.5 text-sm mt-4 inline-block">銀行へいく →</Link>
        </div>
      )}

      <ul className="space-y-4">
        {MOCK_JOBS.map((job) => (
          <JobCard key={job.id} job={job} weapons={weapons} appliedIds={appliedIds} onApply={handleApply} />
        ))}
      </ul>
    </main>
  );
}
