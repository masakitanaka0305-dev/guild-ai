"use client";

import { useState } from "react";
import { getVerificationLog, REGION_LABELS, type LogEntry } from "@/lib/verification-log";

const OUTCOME_STYLE: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  fail:    "bg-red-100 text-red-700",
};

const OUTCOME_LABEL: Record<string, string> = {
  success: "成功",
  partial: "部分的",
  fail:    "失敗",
};

const ENV_LABEL: Record<string, string> = {
  prod:    "本番",
  staging: "ステージング",
  pilot:   "パイロット",
};

function LogRow({ entry }: { entry: LogEntry }) {
  const d = new Date(entry.ts);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return (
    <tr className="border-t border-white/10 hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors">
      <td className="py-2 px-3 text-xs text-slate-400 whitespace-nowrap tabular-nums">{dateStr}</td>
      <td className="py-2 px-3">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${OUTCOME_STYLE[entry.outcome] ?? ""}`}>
          {OUTCOME_LABEL[entry.outcome] ?? entry.outcome}
        </span>
      </td>
      <td className="py-2 px-3 text-xs text-[#E2E8F0]">{ENV_LABEL[entry.env] ?? entry.env}</td>
      <td className="py-2 px-3 text-xs tabular-nums text-[#E2E8F0] text-right">{entry.durationMs}ms</td>
      <td className="py-2 px-3 text-xs text-slate-400">{REGION_LABELS[entry.region] ?? entry.region}</td>
    </tr>
  );
}

export function VerificationLogSection({ guildId }: { guildId: string }) {
  const [expanded, setExpanded] = useState(false);
  const log = getVerificationLog(guildId);
  const { summary, entries } = log;
  const displayed = expanded ? entries : entries.slice(0, 5);

  return (
    <section className="mt-4 section-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          実行エビデンス
        </h2>
        <span
          role="status"
          aria-label={`成功率 ${summary.successRate} パーセント`}
          className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[10px] font-bold text-green-700"
        >
          成功率 {summary.successRate}%
        </span>
      </div>

      {/* 4-metric summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="section-card p-3 text-center">
          <p className="text-[10px] text-slate-400 mb-1">総実行回数</p>
          <p className="text-base font-extrabold tabular-nums text-white">{summary.totalRuns}</p>
        </div>
        <div className="section-card p-3 text-center">
          <p className="text-[10px] text-slate-400 mb-1">成功率</p>
          <p className="text-base font-extrabold tabular-nums text-white">{summary.successRate}%</p>
        </div>
        <div className="section-card p-3 text-center">
          <p className="text-[10px] text-slate-400 mb-1">最終成功</p>
          <p className="text-sm font-bold text-white truncate">
            {(() => {
              const d = new Date(summary.lastSuccessAt);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            })()}
          </p>
        </div>
        <div className="section-card p-3 text-center">
          <p className="text-[10px] text-slate-400 mb-1">環境数</p>
          <p className="text-base font-extrabold tabular-nums text-white">{summary.environments.length}</p>
        </div>
      </div>

      {/* Log table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm" aria-label="実行ログ">
          <caption className="sr-only">直近の実行ログ</caption>
          <thead>
            <tr className="bg-[var(--n-surface-2,#F5F3EE)]">
              <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">日時</th>
              <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">結果</th>
              <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">環境</th>
              <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-right">時間</th>
              <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">地域</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((entry, i) => (
              <LogRow key={`${entry.ts}-${i}`} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>

      {entries.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full text-center text-xs text-slate-400 hover:text-kaki transition-colors underline"
        >
          {expanded ? "折りたたむ ↑" : `もっと見る（残り ${entries.length - 5} 件）`}
        </button>
      )}

      <p className="mt-3 text-[10px] text-slate-400">
        過去30日間の実行記録。ハッシュはトランザクション参照用の識別子です。
      </p>
    </section>
  );
}
