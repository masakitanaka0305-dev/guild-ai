import { notFound } from "next/navigation";
import Link from "next/link";
import { RankShield } from "@/components/RankShield";
import { ComplexityMeter } from "@/components/ComplexityMeter";
import { AreaChart } from "@/components/AreaChart";
import { LearnFromMasterButton } from "@/components/LearnFromMasterButton";
import {
  getDailyUsage, getWeeklyUsage, getLifetimeUsage,
  getDeltas, getLockUnlockedRewards, getUsageHistory,
} from "@/lib/api-usage";
import { getComplexityBreakdown } from "@/lib/complexity-score";
import { getMasterStats } from "@/lib/master-reputation";

const KNOWN_HANDLES = ["alice", "bob", "carol", "dave", "eve"];

export function generateStaticParams() {
  return KNOWN_HANDLES.map((handle) => ({ handle }));
}

function Monogram({ handle }: { handle: string }) {
  const initials = handle.slice(0, 2).toUpperCase();
  const hue = (handle.charCodeAt(0) * 37 + handle.charCodeAt(1 % handle.length) * 13) % 360;
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0 select-none"
      style={{ backgroundColor: `hsl(${hue},55%,38%)` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export default function HandleProfilePage({ params }: { params: { handle: string } }) {
  const { handle } = params;
  if (!KNOWN_HANDLES.includes(handle)) notFound();

  const daily    = getDailyUsage(handle);
  const weekly   = getWeeklyUsage(handle);
  const lifetime = getLifetimeUsage(handle);
  const deltas   = getDeltas(handle);
  const lock     = getLockUnlockedRewards(handle);
  const history  = getUsageHistory(handle);
  const cx       = getComplexityBreakdown(handle);
  const master   = getMasterStats(handle);
  const ranks: Array<"S" | "A" | "B"> = ["S", "A", "B"];
  const rank = ranks[Math.abs(handle.charCodeAt(0)) % 3];

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8 pb-24 sm:pb-12">
      <h1 className="sr-only">プロフィール: {handle}</h1>

      <Link href="/marketplace" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline mb-4 inline-block">
        ← マーケットプレイスに戻る
      </Link>

      {/* Identity */}
      <div className="flex items-center gap-3 mb-6">
        <Monogram handle={handle} />
        <div>
          <p className="font-bold text-lg text-[var(--n-text,#1A1714)]">@{handle}</p>
          <p className="text-xs text-[var(--n-muted,#6B6456)]">GUILD AI クリエイター</p>
        </div>
        <div className="ml-auto">
          <RankShield rank={rank} size={48} />
        </div>
      </div>

      {/* Revenue summary */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-3">公開収益サマリ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {[
            { label: "本日", jpy: daily.jpy,    calls: daily.calls,    delta: deltas.dailyPct },
            { label: "今週", jpy: weekly.jpy,   calls: weekly.calls,   delta: deltas.weeklyPct },
            { label: "累計", jpy: lifetime.jpy, calls: lifetime.calls, delta: undefined },
          ].map(({ label, jpy, calls, delta }) => (
            <div key={label} className="bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-[var(--n-muted,#6B6456)] mb-1">{label}</p>
              <p className="text-lg font-extrabold tabular-nums text-[var(--n-text,#1A1714)]">
                ¥{jpy.toLocaleString("ja-JP")}
              </p>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">{calls.toLocaleString("ja-JP")} コール</p>
              {delta !== undefined && (
                <span className={`text-[10px] font-bold ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {delta >= 0 ? "+" : ""}{delta}%
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="h-12 rounded-2xl overflow-hidden bg-[var(--n-surface-2,#F5F3EE)] px-2 py-1">
          <AreaChart data={history} title={`${handle} の直近30日API利用料推移`} />
        </div>
      </section>

      {/* Complexity */}
      <section className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-3">実績スコア</h2>
        <div className="flex items-center gap-4 mb-3">
          <RankShield rank={rank} size={48} />
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-lg font-black tabular-nums">{cx.jobsCompleted}</p>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">完了案件</p>
            </div>
            <div>
              <p className="text-lg font-black tabular-nums">¥{lock.jpy.toLocaleString("ja-JP")}</p>
              <p className="text-[10px] text-[var(--n-gold,#D4AF37)]">Lock 報酬</p>
            </div>
          </div>
        </div>
        <ComplexityMeter score={cx.score} label={cx.label} />
      </section>

      {/* Master Reputation Card */}
      <section className="bg-[var(--n-text,#1A1714)] rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-[var(--n-gold,#D4AF37)]" />
          <p className="text-sm font-bold text-[var(--n-gold,#D4AF37)]">師匠スコア</p>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--n-gold,#D4AF37)]/20 text-[var(--n-gold,#D4AF37)]">
            {master.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xl font-black tabular-nums text-white">{master.citationCount}</p>
            <p className="text-[10px] text-[#9890A8]">被引用</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black tabular-nums text-white">{master.discipleCount}</p>
            <p className="text-[10px] text-[#9890A8]">弟子</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black tabular-nums text-[var(--n-gold,#D4AF37)]">{master.collectiveScore}</p>
            <p className="text-[10px] text-[#9890A8]">集合知スコア</p>
          </div>
        </div>

        {/* Master score bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-[#9890A8]">マスタースコア</span>
            <span className="tabular-nums font-bold text-[var(--n-gold,#D4AF37)]">{master.masterScore} / 1000</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--n-gold,#D4AF37)]"
              style={{ width: `${(master.masterScore / 1000) * 100}%` }}
            />
          </div>
        </div>

        <LearnFromMasterButton handle={handle} />
      </section>
    </main>
  );
}
