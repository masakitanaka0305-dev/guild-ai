"use client";

import { useState, useId } from "react";
import {
  getMicroBalance,
  setAutoWithdraw,
  setThreshold,
  triggerWithdraw,
} from "@/lib/shima-ledger";
import { useUserId } from "@/components/AuthProvider";

const THRESHOLD_OPTIONS = [1_000, 3_000, 10_000] as const;

export function MicroWalletPanel() {
  const userId = useUserId();
  const [balance, setBalance] = useState(() => getMicroBalance(userId));
  const progressId = useId();
  const switchId = useId();

  const progressPct = Math.min(100, (balance.displayJpy / balance.threshold) * 100);

  const handleToggleAuto = () => {
    const updated = setAutoWithdraw(userId, !balance.autoWithdraw);
    setBalance(updated);
  };

  const handleThreshold = (val: number) => {
    const updated = setThreshold(userId, val);
    setBalance(updated);
  };

  const handleWithdraw = () => {
    const updated = triggerWithdraw(userId);
    setBalance(updated);
  };

  const formatted = formatDisplay(balance.totalMilliJpy);

  return (
    <div className="bg-[var(--n-surface-2,#F5F3EE)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl px-5 py-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[var(--n-text,#1A1714)]">端数残高</p>
        <p className="text-xs text-[var(--n-muted,#6B6456)]">端数（ミリ円）の残高</p>
      </div>

      {/* Main balance display */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-2xl font-extrabold tabular-nums text-[var(--n-text,#1A1714)] mb-3"
      >
        {formatted}
      </p>

      {/* Progress bar: next auto-withdrawal */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-[var(--n-muted,#6B6456)]">次の自動出金まで</p>
          <p className="text-[10px] text-[var(--n-muted,#6B6456)] tabular-nums">
            ¥{balance.threshold.toLocaleString("ja-JP")}
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
          aria-label={`端数出金まで ${Math.round(progressPct)}%`}
          id={progressId}
          className="h-1.5 w-full bg-[var(--n-divider,rgba(0,0,0,0.08))] rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-[var(--n-gold,#D4AF37)] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Threshold selector */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[10px] text-[var(--n-muted,#6B6456)] shrink-0">出金ライン：</p>
        <div className="flex gap-1.5">
          {THRESHOLD_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleThreshold(opt)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                balance.threshold === opt
                  ? "bg-[var(--n-text,#1A1714)] text-white"
                  : "bg-white border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] hover:border-[var(--n-text,#1A1714)]"
              }`}
            >
              ¥{(opt / 1_000).toFixed(0)}k
            </button>
          ))}
        </div>
      </div>

      {/* Auto-withdraw toggle + manual withdraw */}
      <div className="flex items-center justify-between">
        <label htmlFor={switchId} className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-[10px] text-[var(--n-muted,#6B6456)]">自動出金</span>
          <button
            id={switchId}
            type="button"
            role="switch"
            aria-checked={balance.autoWithdraw}
            onClick={handleToggleAuto}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              balance.autoWithdraw ? "bg-[var(--n-positive,#0E9F4F)]" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                balance.autoWithdraw ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-[10px] font-semibold text-[var(--n-text,#1A1714)]">
            {balance.autoWithdraw ? "ON" : "OFF"}
          </span>
        </label>

        {balance.displayJpy > 0 && (
          <button
            type="button"
            onClick={handleWithdraw}
            className="text-[10px] font-semibold text-[var(--primary,#06B6D4)] hover:underline transition-colors"
          >
            いま出金する
          </button>
        )}
      </div>
    </div>
  );
}

function formatDisplay(milliJpy: number): string {
  const jpy = milliJpy / 1_000;
  const intPart = Math.floor(jpy).toLocaleString("ja-JP");
  const frac = (jpy % 1).toFixed(3).slice(1);
  return `¥${intPart}${frac}`;
}
