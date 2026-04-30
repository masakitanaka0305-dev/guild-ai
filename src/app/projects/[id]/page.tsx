import { notFound } from "next/navigation";
import Link from "next/link";
import { MOCK_PROJECTS, getProject } from "@/lib/projects";
import { computeMatchingScore, getDemoOwnedMds } from "@/lib/matching";
import { calcNet, formatJpy } from "@/lib/payout-sim";
import { getCompetition, RANK_COLOR } from "@/lib/competitor-stats";

export function generateStaticParams() {
  return MOCK_PROJECTS.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const project = getProject(params.id);
  return { title: project ? `${project.title} | GUILD AI` : "案件 | GUILD AI" };
}

const STATUS_LABEL: Record<string, string> = {
  applied:   "応募中",
  executing: "実行中",
  settling:  "精算中",
  settled:   "完了",
};

function MatchingDonut({ score, matchedReqs, totalReqs }: {
  score: number; matchedReqs: number; totalReqs: number;
}) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const gap = circ - dash;
  const color = score >= 80 ? "#0E9F4F" : score >= 50 ? "#F59E0B" : "#E64545";

  return (
    <div
      role="img"
      aria-label={`マッチ率 ${score}%`}
      className="flex flex-col items-center gap-1"
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={circ / 4}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="900" fill={color}>
          {score}%
        </text>
      </svg>
      <p className="text-[10px] text-[var(--n-muted,#6B6456)]">
        マッチ {matchedReqs} / {totalReqs} 件
      </p>
    </div>
  );
}

const TIMELINE_STEPS = ["応募中", "実行中", "精算中", "完了"] as const;

function ProjectTimeline({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex items-center gap-0 w-full" aria-label="進捗タイムライン">
      {TIMELINE_STEPS.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <li key={label} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={`flex-1 h-0.5 ${done || active ? "bg-[var(--n-primary,#E64545)]" : "bg-[var(--n-divider,rgba(0,0,0,0.12))]"}`} />
              )}
              <div
                aria-current={active ? "step" : undefined}
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black transition-colors ${
                  done ? "bg-[var(--n-primary,#E64545)] text-white"
                  : active ? "bg-[var(--n-primary,#E64545)] text-white ring-2 ring-[var(--n-primary,#E64545)] ring-offset-1"
                  : "bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)]"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${done ? "bg-[var(--n-primary,#E64545)]" : "bg-[var(--n-divider,rgba(0,0,0,0.12))]"}`} />
              )}
            </div>
            <span className={`text-[9px] font-bold text-center leading-tight mt-0.5 ${active ? "text-[var(--n-primary,#E64545)]" : "text-[var(--n-muted,#6B6456)]"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) notFound();

  // Demo owned MDs for visualization (in production, fetch from user's portfolio)
  const ownedMds = getDemoOwnedMds("demo-user");
  const matching = computeMatchingScore(ownedMds, project);
  const competition = getCompetition(project.id, project.applicantCount);

  // Net payout calculation (demo: assume all missing MDs rented for 40h)
  const rentalFees = matching.missingMds.map(
    (m) => project.rentalFeeHourlyJpy * 40 * m.weight,
  );
  const payout = calcNet({
    grossJpy: project.grossRewardJpy,
    rentalFees,
    platformFeePct: project.platformFeePct,
  });

  const timelineStep = 0; // "応募中" — demo shows first step

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/projects" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline">
        ← 案件一覧に戻る
      </Link>

      {/* Header */}
      <div className="mt-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--n-muted,#6B6456)] bg-[var(--n-surface-2,#F5F3EE)] px-2 py-0.5 rounded-full">
            {project.industry}
          </span>
          <span className="text-[10px] font-bold text-[var(--n-positive,#0E9F4F)] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {project.status === "open" ? "募集中" : STATUS_LABEL[project.status]}
          </span>
        </div>
        <h1 className="text-xl font-black text-[var(--n-text,#1A1714)] leading-snug">
          {project.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--n-muted,#6B6456)] leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Main 2-column layout (mobile: stacked, PC: left+right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: main content ── */}
        <div className="flex-1 space-y-5">

          {/* Tech stack */}
          <div className="section-card p-5">
            <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-3">技術スタック</p>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((t) => (
                <span
                  key={t}
                  className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-text,#1A1714)] border border-[var(--n-divider,rgba(0,0,0,0.08))]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Why you match */}
          <div className="section-card p-5">
            <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-3">
              なぜマッチしているか
            </p>
            <ul className="space-y-2">
              {matching.matchDetails.map(({ req, matched, ownedRank }) => (
                <li key={req.id} className="flex items-center gap-2 text-xs">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                    matched ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-400"
                  }`}>
                    {matched ? "✓" : "✗"}
                  </span>
                  <span className={matched ? "text-[var(--n-text,#1A1714)]" : "text-[var(--n-muted,#6B6456)]"}>
                    {req.label}
                    {matched && ownedRank && (
                      <span className="ml-1 font-bold text-[var(--n-primary,#E64545)]">[{ownedRank}]</span>
                    )}
                    {!matched && (
                      <span className="ml-1 text-[var(--n-muted,#6B6456)]">（未所持 — 要 {req.rankMin}+）</span>
                    )}
                  </span>
                  {req.weight === 3 && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded">必須</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* SES Challenge */}
          {project.sesChallenge && (
            <div className="section-card p-5 border-l-4 border-amber-400">
              <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-1.5">
                現場課題
              </p>
              <p className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed">
                {project.sesChallenge}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="section-card p-5">
            <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-4">進捗タイムライン</p>
            <ProjectTimeline currentStep={timelineStep} />
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-full lg:w-72 space-y-4">

          {/* Matching Score Donut */}
          <div className="section-card p-5 flex flex-col items-center gap-2">
            <p className="text-xs font-bold text-[var(--n-text,#1A1714)] self-start">
              Matching Score
            </p>
            <MatchingDonut
              score={matching.score}
              matchedReqs={matching.matchedReqs}
              totalReqs={matching.totalReqs}
            />
          </div>

          {/* Net Payout Simulation */}
          <div className="section-card p-5">
            <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-3">Net Payout</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[var(--n-muted,#6B6456)]">
                <span>Gross 報酬</span>
                <span className="font-bold">{formatJpy(payout.grossJpy)}</span>
              </div>
              {payout.totalRentalJpy > 0 && (
                <div className="flex justify-between text-[var(--n-muted,#6B6456)]">
                  <span>Rental Required</span>
                  <span className="text-amber-600 font-bold">−{formatJpy(payout.totalRentalJpy)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--n-muted,#6B6456)]">
                <span>Platform Fee ({project.platformFeePct}%)</span>
                <span className="text-[var(--n-muted,#6B6456)] font-bold">−{formatJpy(payout.platformFeeJpy)}</span>
              </div>
              <div className="border-t border-[var(--n-divider,rgba(0,0,0,0.08))] pt-1.5 flex justify-between">
                <span className="font-bold text-[var(--n-text,#1A1714)]">手取り</span>
                <span className="text-base font-black text-[var(--n-positive,#0E9F4F)]">
                  {formatJpy(payout.netJpy)}
                </span>
              </div>
            </div>
          </div>

          {/* Rental Required */}
          {matching.missingMds.length > 0 && (
            <div className="section-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[var(--n-text,#1A1714)]">Rental Required</p>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  未所持 {matching.missingMds.length} 件
                </span>
              </div>
              <div className="space-y-3">
                {matching.missingMds.map((md) => (
                  <div key={md.id} className="rounded-xl bg-[var(--n-surface-2,#F5F3EE)] p-3">
                    <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-1">{md.label}</p>
                    <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-2">
                      要 {md.rankMin}+ ・重要度 {"★".repeat(md.weight)}{"☆".repeat(3 - md.weight)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border border-[var(--n-primary,#E64545)] text-[var(--n-primary,#E64545)] hover:bg-[var(--n-primary,#E64545)] hover:text-white transition-colors"
                      >
                        Rent ¥{project.rentalFeeHourlyJpy.toLocaleString("ja-JP")}/h
                      </button>
                      <button
                        type="button"
                        className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)] border border-[var(--n-divider,rgba(0,0,0,0.12))] hover:bg-[var(--n-divider,rgba(0,0,0,0.08))] transition-colors"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-[var(--n-primary,#E64545)] text-white text-sm font-bold py-3 hover:opacity-90 transition-opacity"
              >
                レンタルして応募
              </button>
            </div>
          )}

          {matching.missingMds.length === 0 && (
            <button
              type="button"
              className="w-full section-card p-4 bg-[var(--n-primary,#E64545)] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              この案件に応募する
            </button>
          )}

          {/* Competition */}
          <div className="section-card p-5">
            <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-3">Competition</p>
            <p className="text-2xl font-black text-[var(--n-text,#1A1714)]">
              {competition.totalApplicants}
              <span className="text-xs font-bold text-[var(--n-muted,#6B6456)] ml-1">名応募中</span>
            </p>
            <div className="flex gap-3 mt-3">
              {(["S", "A", "B"] as const).map((rank) => (
                <div key={rank} className="flex flex-col items-center">
                  <span
                    className="text-sm font-black"
                    style={{ color: RANK_COLOR[rank] }}
                  >
                    {rank}
                  </span>
                  <span className="text-xs font-bold text-[var(--n-text,#1A1714)]">
                    {competition.byRank[rank]}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-2">
              競合上位: <span className="font-bold">{competition.leadingRank}ランク</span>
            </p>
          </div>

          {/* Key stats */}
          <div className="section-card p-5">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--n-muted,#6B6456)]">期限</span>
                <span className="font-bold text-[var(--n-text,#1A1714)]">{project.deadline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--n-muted,#6B6456)]">クライアント</span>
                <span className="font-bold text-[var(--n-text,#1A1714)]">@{project.clientHandle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--n-muted,#6B6456)]">必要 MD 数</span>
                <span className="font-bold text-[var(--n-text,#1A1714)]">{project.requiredMdInterfaces.length} 件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
