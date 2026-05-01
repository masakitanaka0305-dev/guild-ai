import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, AlertCircle, Plug } from "lucide-react";
import { MOCK_PROJECTS, getProject } from "@/lib/projects";
import { computeMatchingScore, getDemoOwnedMds } from "@/lib/matching";
import { pickBestFitMd } from "@/lib/md-pickfit";
import { calcNet, formatJpy } from "@/lib/payout-sim";
import { getCompetition, RANK_COLOR } from "@/lib/competitor-stats";
import { PlugInApply } from "@/components/PlugInApply";
import { ClampDescription } from "@/components/ui/ClampDescription";
import { BackArrow } from "@/components/ui/BackArrow";
import { SectionCard } from "@/components/ui/SectionCard";
import { ConnectedIntelligenceAssets } from "@/components/ui/ConnectedIntelligenceAssets";

export function generateStaticParams() {
  return MOCK_PROJECTS.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const project = getProject(params.id);
  return { title: project ? `${project.title} | GUILD AI` : "案件 | GUILD AI" };
}

const STATUS_LABEL: Record<string, string> = {
  applied:   "エージェント派遣中",
  executing: "実行中",
  settling:  "精算中",
  settled:   "完了",
};

function MatchScore({ score, matchedReqs, totalReqs }: {
  score: number; matchedReqs: number; totalReqs: number;
}) {
  return (
    <div
      role="img"
      aria-label={`マッチ率 ${score}%`}
      data-testid="matching-score"
      className="flex flex-col items-center gap-1"
    >
      <span className="text-cyan-400 metric-prime">{score}%</span>
      <p className="text-slate-400 text-xs">マッチ {matchedReqs} / {totalReqs} 件</p>
    </div>
  );
}

const TIMELINE_STEPS = ["エージェント派遣中", "実行中", "精算中", "完了"] as const;

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
                <div className={`flex-1 h-0.5 ${done || active ? "bg-[var(--primary,#06B6D4)]" : "bg-[var(--n-divider,rgba(0,0,0,0.12))]"}`} />
              )}
              <div
                aria-current={active ? "step" : undefined}
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black transition-colors ${
                  done ? "bg-[var(--primary,#06B6D4)] text-white"
                  : active ? "bg-[var(--primary,#06B6D4)] text-white ring-2 ring-[var(--primary,#06B6D4)] ring-offset-1"
                  : "bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)]"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${done ? "bg-[var(--primary,#06B6D4)]" : "bg-[var(--n-divider,rgba(0,0,0,0.12))]"}`} />
              )}
            </div>
            <span className={`text-[9px] font-bold text-center leading-tight mt-0.5 ${active ? "text-[var(--primary,#06B6D4)]" : "text-[var(--n-muted,#6B6456)]"}`}>
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

  // Net payout calculation — owned MDs get rentalFee=0; only missing MDs incur rental.
  const payout = calcNet({
    grossJpy: project.grossRewardJpy,
    ownedMds,
    requiredMds: project.requiredMdInterfaces,
    rentalFeeHourlyJpy: project.rentalFeeHourlyJpy,
    platformFeePct: project.platformFeePct,
  });
  const rentalCovered = payout.rentalFees.length === 0;
  const isUnderwater = payout.warning === "underwater";

  const timelineStep = 0; // "エージェント派遣中" — demo shows first step

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 pb-44 md:pb-8 max-w-4xl mx-auto">
      {/* Back */}
      <div className="-ml-2 -mt-2 mb-1 flex items-center gap-1">
        <BackArrow href="/projects" label="案件一覧に戻る" />
        <Link
          href="/projects"
          className="text-xs text-slate-400 hover:text-white"
        >
          案件一覧
        </Link>
      </div>

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
        <ClampDescription
          text={project.description}
          maxLines={3}
          className="mt-2"
        />
      </div>

      {/* Main 2-column layout (mobile: stacked, PC: left+right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: main content ── */}
        <div className="flex-1 space-y-5">

          {/* Tech stack */}
          <SectionCard id="tech-stack" title="技術スタック">
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((t) => (
                <span key={t} className="chip-tech font-mono">
                  {t}
                </span>
              ))}
            </div>
          </SectionCard>

          {/* Why you match */}
          <SectionCard id="why-match" title="なぜマッチしているか">
            <ul className="space-y-2">
              {matching.matchDetails.map(({ req, matched, ownedRank }) => (
                <li key={req.id} className="flex items-center gap-2 text-xs">
                  {matched ? (
                    <Check
                      aria-hidden
                      className="flex-shrink-0 w-4 h-4 stroke-cyan-400"
                    />
                  ) : (
                    <AlertCircle
                      aria-hidden
                      className="flex-shrink-0 w-4 h-4 stroke-amber-300"
                    />
                  )}
                  <span className={matched ? "text-white" : "text-slate-400"}>
                    {req.label}
                    {matched && ownedRank && (
                      <span className="ml-1 font-bold text-cyan-400">[{ownedRank}]</span>
                    )}
                    {!matched && (
                      <span className="ml-1 text-slate-400">（未所持 — 要 {req.rankMin}+）</span>
                    )}
                  </span>
                  {req.weight === 3 && (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-900/40 ring-1 ring-amber-400/30 px-1 rounded">必須</span>
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* SES Challenge */}
          {project.sesChallenge && (
            <SectionCard id="ses-challenge" title="現場課題">
              <ClampDescription text={project.sesChallenge} maxLines={3} />
            </SectionCard>
          )}

          {/* Timeline */}
          <SectionCard id="progress-timeline" title="進捗タイムライン">
            <ProjectTimeline currentStep={timelineStep} />
          </SectionCard>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-full lg:w-72 space-y-4">

          {/* Matching Score */}
          <div className="section-card p-5 flex flex-col items-center gap-2">
            <p className="text-xs font-bold text-[var(--n-text,#1A1714)] self-start">
              Matching Score
            </p>
            <MatchScore
              score={matching.score}
              matchedReqs={matching.matchedReqs}
              totalReqs={matching.totalReqs}
            />
          </div>

          {/* Connected Intelligence Assets — surfaces the picked MD agent
              wiring before the Apply CTA. Mobile renders inline above the
              sticky bar; desktop sits in the right rail. */}
          <ConnectedIntelligenceAssets
            mdGuildId={
              pickBestFitMd(ownedMds, project).mdId ?? ownedMds[0]?.id ?? "md_demo"
            }
          />

          {/* Plug-in Apply — fixed on mobile (thumb zone), regular card on md+ */}
          <div className="hidden md:block section-card p-5">
            <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mb-3">Apply</p>
            <PlugInApply projectId={project.id} underwater={isUnderwater} />
          </div>
          <div className="md:hidden">
            <PlugInApply projectId={project.id} sticky underwater={isUnderwater} />
          </div>

          {/* Net Payout Simulation */}
          <SectionCard id="net-payout" title="Net Payout">
            {isUnderwater && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-rose-400/40 bg-rose-900/30 px-3 py-2 text-[11px] text-rose-200"
              >
                この組み合わせでは手取りがマイナスになります。別の知能を選びましょう。
              </div>
            )}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Gross 報酬</span>
                <span className="font-bold text-white">{formatJpy(payout.grossJpy)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform Fee ({project.platformFeePct}%)</span>
                <span className="font-bold text-slate-300">−{formatJpy(payout.platformFeeJpy)}</span>
              </div>
              {rentalCovered ? (
                <div className="flex justify-between text-emerald-300">
                  <span>Rental ¥0（あなたのMDで充足）</span>
                  <span className="font-bold">¥0</span>
                </div>
              ) : (
                <div className="flex justify-between text-rose-300">
                  <span>Rental（不足分 {payout.rentalFees.length} 件）</span>
                  <span className="font-bold">−{formatJpy(payout.totalRentalJpy)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-1.5 flex items-baseline justify-between">
                <span className="font-bold text-white">手取り</span>
                <span className={isUnderwater ? "metric-prime text-rose-300" : "metric-prime"}>
                  {formatJpy(payout.netJpy)}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Competition */}
          <SectionCard id="competition" title="Competition">
            <p className="text-2xl font-black text-white">
              {competition.totalApplicants}
              <span className="text-xs font-bold text-slate-400 ml-1">名応募中</span>
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
                  <span className="text-xs font-bold text-white">
                    {Math.max(0, competition.byRank[rank])}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              競合上位: <span className="font-bold text-white">{competition.leadingRank}ランク</span>
            </p>
          </SectionCard>

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
