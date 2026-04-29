"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { OwnershipRecord, Currency, Rank } from "@/types";
import { computeContributionRank } from "@/lib/contribution-rank";
import type { ContributionRank } from "@/lib/contribution-rank";
import { getAssetHealth } from "@/lib/asset-health";
import { getPassbookSnapshot, getMonthlyEarnings } from "@/lib/passbook";
import { getPassbookSnapshotAction } from "@/app/actions/passbook";
import { computeLeverage } from "@/lib/ses-leverage";
import { StepIndicator } from "@/components/StepIndicator";
import { NotificationBell } from "@/components/NotificationBell";
import { getNotifications, getUnreadCount } from "@/lib/notifications";
import { useLiveEarnings } from "@/lib/live-earnings";
import { SlotNumber } from "@/components/SlotNumber";
import { toggleMute } from "@/lib/sound";
import { PassbookTable } from "@/components/PassbookTable";
import { UserIcon, BanknoteIcon } from "@/components/icons";
import { RawDataPanel } from "@/components/RawDataPanel";
import { ShareButton } from "@/components/ShareButton";
import { getGithubGreenScore, getLearningProgress, applySkillBoost } from "@/lib/skill-sync";
import { ActivityPulse } from "@/components/ActivityPulse";
import { useUserId } from "@/components/AuthProvider";

// ─── Rank styling ─────────────────────────────────────────────────────────────

const RANK_STYLE: Record<ContributionRank, { bg: string; text: string }> = {
  Newcomer:      { bg: "bg-[#9890A8]/20", text: "text-[#9890A8]" },
  Riser:         { bg: "bg-kaki/20",      text: "text-kaki" },
  Creator:       { bg: "bg-kaki/40",      text: "text-kaki" },
  "Pro Creator": { bg: "bg-kaki",         text: "text-white" },
  Legendary:     { bg: "bg-kuroko",       text: "text-white" },
};

// ─── Currency display labels ────────────────────────────────────────────────────

const CURRENCY_LABELS: Record<Currency, string> = { JPY: "日本円", JPYC: "デジタル円" };

// ─── Mini stat bar ─────────────────────────────────────────────────────────────

function StatBar({ value, color = "bg-kaki" }: { value: number; color?: string }) {
  return (
    <div className="mt-1 h-1.5 w-full rounded-full bg-kuroko/10">
      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

// ─── スキル成長カード ─────────────────────────────────────────────────────────

function SkillProgressBar({ value, color = "bg-kaki" }: { value: number; color?: string }) {
  return (
    <div className="mt-1.5 h-2 w-full rounded-full bg-kuroko/10">
      <div
        className={`h-2 rounded-full ${color} transition-all`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function SkillGrowthCard({ currentRank }: { currentRank: Rank }) {
  const userId = useUserId();
  const greenScore = getGithubGreenScore(userId);
  const learningProgress = getLearningProgress(userId);
  const boostedRank = applySkillBoost(currentRank, greenScore, learningProgress);
  const greenPct = Math.min(100, Math.round((greenScore / 70) * 100));
  const learnPct = Math.min(100, Math.round((learningProgress / 10) * 100));
  const overallPct = Math.round((greenPct + learnPct) / 2);
  const rankChanged = boostedRank !== currentRank;

  let hint: string;
  if (rankChanged) {
    hint = `あなたの活動が反映されています。現在の予測ランクは ${boostedRank} です。`;
  } else if (overallPct >= 80) {
    hint = `もう少しでランクが上がります（あと ${100 - overallPct}%）。GitHubへの継続的なコミットをお勧めします。`;
  } else {
    hint = `GitHubの活動と学習を続けることで、ランクアップが見込まれます（現在 ${overallPct}%）。`;
  }

  return (
    <div className="mt-5 section-card p-5">
      <h2 className="text-sm font-bold text-[#9890A8] uppercase tracking-widest mb-4">スキル成長</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-[#9890A8] font-semibold">GitHubの草</p>
          <p className="mt-1 text-2xl font-bold text-kuroko tabular-nums">{greenScore}<span className="text-sm text-[#9890A8]"> / 100</span></p>
          <SkillProgressBar value={greenScore} color="bg-accent-green" />
        </div>
        <div>
          <p className="text-xs text-[#9890A8] font-semibold">学習の進み</p>
          <p className="mt-1 text-2xl font-bold text-kuroko tabular-nums">{learningProgress}<span className="text-sm text-[#9890A8]"> / 20</span></p>
          <SkillProgressBar value={learnPct} color="bg-[#9B6BB5]" />
        </div>
        <div>
          <p className="text-xs text-[#9890A8] font-semibold">予測ランク</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${rankChanged ? "text-kaki" : "text-kuroko"}`}>
            {boostedRank} {rankChanged && <span className="text-sm text-kaki">↑</span>}
          </p>
          <SkillProgressBar value={overallPct} color={rankChanged ? "bg-kaki" : "bg-kuroko/30"} />
        </div>
      </div>
      <p className="mt-3 text-xs text-[#4A4464] leading-relaxed">{hint}</p>
    </div>
  );
}

// ─── 今月の通帳カード ─────────────────────────────────────────────────────────

function PassbookCard({ owned }: { owned: OwnershipRecord[] }) {
  const userId = useUserId();
  // Initial render: deterministic mock (no flash). After mount: replace with
  // DB-enriched snapshot via server action. Refetches if userId changes (login).
  const [snap, setSnap] = useState(() => getPassbookSnapshot(userId));
  useEffect(() => {
    setSnap(getPassbookSnapshot(userId));
    getPassbookSnapshotAction(userId).then(setSnap);
  }, [userId]);
  const monthly = getMonthlyEarnings(userId);
  const live = useLiveEarnings(userId);
  const prevBumpRef = useRef(0);
  const assetCount = owned.length || snap.assetCount;

  // Track AtoA bumps
  useEffect(() => {
    if (live.bumpCount > prevBumpRef.current) {
      prevBumpRef.current = live.bumpCount;
    }
  }, [live.bumpCount]);

  const maxTrust = Math.max(...snap.trustHistory, 1);

  return (
    <div className="mt-5 section-card p-5">
      <h2 className="text-sm font-bold text-[#9890A8] uppercase tracking-widest mb-4 flex items-center gap-1.5"><BanknoteIcon size={14} />今月の収益明細</h2>

      {/* Monthly earnings hero */}
      <div className="rounded-2xl bg-kuroko px-5 py-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-white/60">今月、あなたのスキルがAIに採用されて生み出した収益</p>
          {/* Live badge */}
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-green/20 px-2 py-0.5 text-[10px] font-bold text-accent-green">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" aria-hidden />
            ライブ
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <SlotNumber
            value={live.jpy}
            prefix="¥"
            duration={1400}
            className="text-3xl font-bold text-white tabular-nums"
          />
          <span className="text-sm text-accent-green font-semibold">先月比 +{monthly.momGrowthPct}%</span>
          {live.lastDelta > 0 && (
            <span className="text-xs text-accent-green font-semibold animate-fade-in">
              +¥{live.lastDelta}
            </span>
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-white/70">
          <span>AI採用件数 {monthly.aiJobs}件</span>
          <span>公開資産 {monthly.assetCount}点</span>
        </div>
        {/* Breakdown */}
        <div className="mt-3 space-y-1">
          {monthly.breakdown.map(({ label, amount }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-white/70">{label}</span>
              <span className="text-white font-semibold tabular-nums">¥{amount.toLocaleString("ja-JP")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">

        {/* Left: デジタル円 balance */}
        <div className="flex-1 rounded-xl bg-kaki/5 border border-kaki/20 px-4 py-4">
          <p className="text-xs text-[#9890A8]">デジタル円残高</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-bold text-kuroko tabular-nums">
              {snap.jpycBalance.toLocaleString("ja-JP")}
            </span>
            <span className="text-base text-[#9890A8]">円</span>
            <span className="ml-auto text-sm text-accent-green font-semibold">↑ +120</span>
          </div>
          <p className="text-sm text-[#9890A8] mt-0.5">≒ ¥{snap.jpycBalance.toLocaleString("ja-JP")}</p>
        </div>

        {/* Center: Trust Score + 7-day mini chart */}
        <div className="flex-1 rounded-xl bg-surface-inset border border-kuroko/10 px-4 py-4">
          <p className="text-xs text-[#9890A8]">信用スコア</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-kuroko tabular-nums">{snap.trustScore}</span>
            <span className="text-base text-[#9890A8]">/ 1000</span>
          </div>
          <div className="flex items-end gap-0.5 mt-3 h-8" aria-label="過去7日間の信用スコア推移">
            {snap.trustHistory.map((val, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-kaki/60"
                style={{ height: `${Math.max(8, (val / maxTrust) * 100)}%` }}
                title={`Day ${i + 1}: ${val}`}
              />
            ))}
          </div>
          <p className="text-xs text-[#9890A8] mt-1">過去7日間の推移</p>
        </div>

        {/* Right: Asset count + rank breakdown */}
        <div className="flex-1 rounded-xl bg-surface-inset border border-kuroko/10 px-4 py-4">
          <p className="text-xs text-[#9890A8]">登録済み資産</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-kuroko tabular-nums">{assetCount}</span>
            <span className="text-base text-[#9890A8]">件</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {([
              { label: "S", color: "bg-kaki", count: snap.rankBreakdown.S },
              { label: "A", color: "bg-zinc-400", count: snap.rankBreakdown.A },
              { label: "B", color: "bg-amber-700", count: snap.rankBreakdown.B },
            ] as const).map(({ label, color, count }) => (
              <div key={label} className="flex items-center gap-1" title={`ランク${label}: ${count}件`}>
                <span className={`w-2 h-2 rounded-full ${color}`} aria-hidden />
                <span className="text-xs text-[#9890A8] font-semibold">{label}</span>
                <span className="text-xs text-kuroko tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Pulse — 保有資産の鼓動 */}
      <div className="mt-4 pt-4 border-t border-kuroko/10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9890A8] mb-2">保有資産の鼓動</p>
        <ActivityPulse assetId="demo-user-wallet" />
      </div>

      {/* Share passbook milestone */}
      <div className="mt-4 pt-4 border-t border-kuroko/10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9890A8] mb-2">今月の成果をシェア</p>
        <ShareButton context={{ type: "passbook_milestone" }} seed={0} compact />
      </div>

      {/* Recent transactions — passbook style */}
      <div className="mt-4 pt-4 border-t border-kuroko/10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#9890A8]">おさいふ通帳</p>
        </div>
        <PassbookTable transactions={snap.recentTransactions} />
      </div>
    </div>
  );
}

// ─── SES Leverage chart ────────────────────────────────────────────────────────

function SesLeverageChart() {
  const salary = 500000;
  const royalties = [80000, 45000, 25000];
  const result = computeLeverage(salary, royalties);
  const { directLabor, royaltyIncome, projectedTrend } = result.breakdown;
  const total = directLabor + royaltyIncome + projectedTrend;

  const segments = [
    { label: "直接労働対価", value: directLabor, color: "bg-kaki" },
    { label: "還元（リワード）収入", value: royaltyIncome, color: "bg-accent-green" },
    { label: "予測トレンド", value: projectedTrend, color: "bg-kaki/30" },
  ];

  return (
    <div className="mt-4 section-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-base font-bold text-kuroko">SES レバレッジ</h2>
        <div className="group relative">
          <span className="w-4 h-4 rounded-full border border-kuroko/30 flex items-center justify-center text-[10px] text-[#9890A8] cursor-help" aria-label="SESレバレッジとは">?</span>
          <div className="hidden group-hover:block absolute left-6 top-0 z-10 w-64 rounded-xl border border-kuroko/15 bg-white px-3 py-2 text-xs text-[#4A4464] shadow-card leading-relaxed">
            SESレバレッジとは：あなたが登録した資産が会社の収益にかける乗数効果。還元（リワード）が積み上がるほど倍率が上がります。
          </div>
        </div>
      </div>
      <p className="text-sm text-[#9890A8] mb-4">登録済み資産が収益に与える乗数効果（法人向け）</p>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-bold text-kuroko tabular-nums">{result.multiplier}×</span>
        <span className="text-base text-accent-green font-semibold">レバレッジ</span>
      </div>

      <div className="space-y-3">
        {segments.map(({ label, value, color }) => {
          const pct = Math.round((value / total) * 100);
          return (
            <div key={label}>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-[#3A3664] flex items-center gap-1.5">
                  <span className={`inline-block w-2 h-2 rounded-sm ${color}`} aria-hidden />
                  {label}
                </span>
                <span className="font-semibold text-kuroko tabular-nums">¥{value.toLocaleString("ja-JP")}</span>
              </div>
              <div className="h-2 rounded-full bg-kuroko/10">
                <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-kuroko/10 flex justify-between text-sm">
        <span className="text-[#9890A8]">合計収入（予測含む）</span>
        <span className="font-bold text-kuroko tabular-nums">¥{result.totalIncome.toLocaleString("ja-JP")}</span>
      </div>
    </div>
  );
}

// ─── Gamification header ──────────────────────────────────────────────────────

function GamificationHeader({ owned }: { owned: OwnershipRecord[] }) {
  const rankResult = computeContributionRank({
    ownedCount: owned.length,
    salesCount: 0,
    listingCount: 0,
    apiCalls: owned.length * 3,
  });

  const style = RANK_STYLE[rankResult.rank];
  const isClose = rankResult.progress >= 70 && rankResult.nextRank !== null;

  return (
    <div className="mt-6 rounded-2xl border border-kaki/20 bg-kaki/5 p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>
              {rankResult.rank}
            </span>
            <p className="text-xs uppercase tracking-widest text-[#9890A8]">貢献ランク</p>
          </div>
          {rankResult.nextRank ? (
            <>
              <p className={`mt-2 text-base font-medium ${isClose ? "text-kaki" : "text-[#3A3664]"}`}>
                {isClose ? "あと一歩！ " : ""}{rankResult.nextRank} まで {100 - rankResult.progress}%
              </p>
              <div className="mt-1.5 h-2 w-full rounded-full bg-kuroko/10">
                <div className="h-2 rounded-full bg-kaki transition-all duration-500" style={{ width: `${rankResult.progress}%` }} />
              </div>
              <p className="mt-1 text-sm text-[#9890A8]">累計スコア {rankResult.score} pt</p>
            </>
          ) : (
            <p className="mt-2 text-base font-medium text-kaki">最高ランク達成！スキルエコノミーのパイオニア</p>
          )}
        </div>
        <div className="sm:max-w-[220px] rounded-xl border border-kaki/20 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-kaki font-semibold">AI レコメンド</p>
          <p className="mt-1.5 text-sm text-[#3A3664] leading-relaxed">{rankResult.nextAction}</p>
        </div>
      </div>
    </div>
  );
}

// ─── ワンタップで公開 checklist ───────────────────────────────────────────────

const PUBLISH_CHECKS = ["公開の設定を確認中…", "接続情報を生成中…", "公開URLを準備中…"];

function PublishChecklist() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step < PUBLISH_CHECKS.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 150);
      return () => clearTimeout(t);
    }
  }, [step]);
  return (
    <div className="absolute inset-0 z-10 rounded-2xl bg-white/95 flex flex-col items-center justify-center gap-1 text-sm text-[#3A3664]">
      {PUBLISH_CHECKS.slice(0, step + 1).map((msg) => (
        <p key={msg} className="flex items-center gap-1.5">
          <span className="text-accent-green">✓</span> {msg}
        </p>
      ))}
    </div>
  );
}

// ─── Asset card ───────────────────────────────────────────────────────────────

function AssetCard({ record }: { record: OwnershipRecord }) {
  const health = getAssetHealth(record.assetId);
  const [publishing, setPublishing] = useState(false);

  const handlePublish = useCallback(() => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      window.open(record.deployUrl, "_blank");
    }, 500);
  }, [record.deployUrl]);

  return (
    <li className="relative section-card p-5 hover:shadow-card-hover transition-shadow">
      {publishing && <PublishChecklist />}

      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-kaki/30 bg-kaki/10 px-2.5 py-0.5 text-xs font-semibold text-kaki">
          AI評価済み
        </span>
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
        </span>
        <span className="text-xs text-[#9890A8]">稼働中</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-kuroko text-base truncate">{record.assetTitle}</h2>
          <p className="mt-0.5 text-sm text-[#9890A8]">取得日: {new Date(record.acquiredAt).toLocaleDateString("ja-JP")}</p>
          <p className="mt-0.5 text-xs text-[#9890A8] font-mono truncate">{record.assetId}</p>
        </div>
        <button
          type="button"
          onClick={handlePublish}
          aria-label={`${record.assetTitle}をお店に並べる`}
          className="btn-primary shrink-0 text-sm !px-3 !py-3"
        >
          ⚡ ワンタップで公開
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <div className="flex justify-between text-sm text-[#3A3664]">
            <span>稼働率</span>
            <span className="tabular-nums font-medium">{health.uptimePercent}%</span>
          </div>
          <StatBar value={health.uptimePercent} color="bg-kaki" />
        </div>
        <div>
          <div className="flex justify-between text-sm text-[#3A3664]">
            <span>成功率</span>
            <span className="tabular-nums font-medium">{health.successRate}%</span>
          </div>
          <StatBar value={health.successRate} color="bg-accent-green" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-kuroko/10 flex flex-wrap items-center gap-3">
        <Link href={`/asset/${record.assetId}`} className="text-sm text-[#9890A8] hover:text-kaki transition-colors">
          資産詳細を見る →
        </Link>
        <Link
          href={`/sell?remix=${record.assetId}&from=${encodeURIComponent(record.assetTitle)}`}
          className="ml-auto text-sm border border-kuroko/20 text-[#3A3664] rounded-lg px-3 py-1.5 hover:bg-kuroko/5 active:scale-[0.97] transition-all"
          aria-label="この資産を組み合わせて登録"
        >
          組み合わせて登録
        </Link>
      </div>
    </li>
  );
}

// ─── Payout Preference ────────────────────────────────────────────────────────

function PayoutPreferencePanel() {
  const [currency, setCurrency] = useState<Currency>("JPY");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-5 section-card p-5">
      <h2 className="text-base font-semibold text-kuroko">売上の受け取り方</h2>
      <p className="mt-0.5 text-sm text-[#9890A8]">資産が売れたときの収益受け取り方法</p>
      <div className="mt-3 flex gap-4">
        {(["JPY", "JPYC"] as Currency[]).map((c) => (
          <label key={c} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="payoutCurrency" value={c} checked={currency === c}
              onChange={() => { setCurrency(c); setSaved(false); }} className="accent-kaki"
              aria-label={`${CURRENCY_LABELS[c]}で受け取る`} />
            <span className="text-base font-medium text-kuroko">{CURRENCY_LABELS[c]}</span>
            {c === "JPYC" && (
              <span className="text-xs text-accent-green bg-accent-green/10 rounded-full px-2 py-0.5">安心の電子マネー</span>
            )}
          </label>
        ))}
      </div>
      <button type="button" onClick={handleSave} className="mt-3 btn-secondary !py-1.5 !text-sm">
        {saved ? "✓ 保存しました" : "保存する"}
      </button>
    </div>
  );
}

// ─── Payment Stats mini-graph ─────────────────────────────────────────────────

function PaymentStats() {
  const data = [
    { label: "クレカ（日本円）", count: 3, color: "bg-kaki" },
    { label: "デジタル円残高",   count: 1, color: "bg-accent-green" },
    { label: "銀行振込",        count: 1, color: "bg-[#9890A8]" },
  ];
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="section-card p-4">
      <p className="text-xs uppercase tracking-widest text-[#9890A8]">支払い内訳</p>
      <div className="mt-3 space-y-2">
        {data.map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="shrink-0 text-sm text-[#3A3664] w-24 truncate">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-kuroko/10">
              <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="w-4 text-sm tabular-nums text-kuroko font-semibold shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const [owned, setOwned] = useState<OwnershipRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [corporateMode, setCorporateMode] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const userId = useUserId();
  const notifications = getNotifications(userId);
  const unreadCount = getUnreadCount(userId);

  function handleToggleMute() {
    const newMuted = toggleMute();
    setSoundMuted(newMuted);
    try { localStorage.setItem("guild_sound_muted", String(newMuted)); } catch { /* ignore */ }
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem("guild_sound_muted");
      if (stored === "true") { setSoundMuted(true); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const records: OwnershipRecord[] = JSON.parse(localStorage.getItem("guild_owned_assets") ?? "[]");
      setOwned(records);
    } catch {
      setOwned([]);
    }
  }, []);

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">

      <StepIndicator current="manage" />

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-kuroko leading-snug flex items-center gap-2"><UserIcon size={22} className="text-kaki" />💰 わたしの お財布</h1>
          <p className="mt-1 text-base text-[#9890A8] leading-relaxed">
            たからものの収益と信用スコアを一覧できます。
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Sound mute toggle */}
          <button
            onClick={handleToggleMute}
            aria-label={soundMuted ? "通知音をオンにする" : "通知音をオフにする"}
            className="p-2 rounded-full hover:bg-kuroko/5 transition-colors text-xl"
          >
            {soundMuted ? "🔕" : "🔔"}
          </button>
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          <Link href="/showcase" className="btn-secondary" aria-label="つくったものを見る">
            ✨ つくったもの →
          </Link>
        </div>
      </div>

      {!mounted ? (
        <div className="mt-12 section-card p-8 text-center">
          <p className="text-base text-[#9890A8]">読み込み中…</p>
        </div>
      ) : (
        <>
          {/* 今月の通帳 — always shown */}
          <PassbookCard owned={owned} />

          {/* スキル成長カード */}
          <SkillGrowthCard currentRank="B" />

          {/* Gamification header */}
          <GamificationHeader owned={owned} />

          {/* Summary stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="section-card p-4">
              <p className="text-xs uppercase tracking-widest text-[#9890A8]">登録済み資産</p>
              <p className="mt-1 text-2xl font-bold text-kuroko tabular-nums">{owned.length}</p>
            </div>
            <div className="section-card p-4">
              <p className="text-xs uppercase tracking-widest text-[#9890A8]">AI評価済み</p>
              <p className="mt-1 text-2xl font-bold text-kaki tabular-nums">{owned.length}</p>
            </div>
            <PaymentStats />
          </div>

          {/* SES Leverage — corporate mode toggle */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-sm font-medium text-[#3A3664]">法人モード</span>
            <button
              type="button"
              role="switch"
              aria-checked={corporateMode}
              aria-label="法人モードの切り替え"
              onClick={() => setCorporateMode((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${corporateMode ? "bg-kaki" : "bg-kuroko/20"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${corporateMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-[#9890A8]">SES レバレッジを表示</span>
          </div>

          {corporateMode && <SesLeverageChart />}

          {/* Payout preference */}
          <PayoutPreferencePanel />

          {/* Asset list */}
          {owned.length === 0 ? (
            <div className="mt-8 section-card p-8 text-center">
              <p className="text-base text-[#9890A8]">まだ保有資産がありません。</p>
              <p className="mt-1 text-sm text-[#9890A8]">マーケットでスキル資産を購入すると、ここに表示されます。</p>
              <Link href="/marketplace" className="btn-primary mt-5" aria-label="マーケットで資産を探す">
                マーケットを見る →
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {owned.map((record) => (
                <AssetCard key={record.assetId} record={record} />
              ))}
            </ul>
          )}

          {/* Raw Data タブ — エンジニア向け技術詳細 */}
          <RawDataPanel data={{
            ownedAssets: owned.map((r) => ({
              assetId: r.assetId,
              title: r.assetTitle,
              acquiredAt: r.acquiredAt,
              deployUrl: r.deployUrl,
            })),
            trustScoreInputs: {
              qualityHistory: 80,
              discordContribution: 60,
              xAmplification: 40,
            },
            contributionRank: computeContributionRank({
              ownedCount: owned.length,
              salesCount: 0,
              listingCount: 0,
              apiCalls: owned.length * 3,
            }),
            recentNotifications: notifications.slice(0, 10),
            atoaEndpoints: {
              catalog: "https://guild-ai.vercel.app/api/catalog",
              match: "https://guild-ai.vercel.app/api/match",
              execute: "https://guild-ai.vercel.app/api/atoa/[id]",
            },
          }} />
        </>
      )}
    </main>
  );
}
