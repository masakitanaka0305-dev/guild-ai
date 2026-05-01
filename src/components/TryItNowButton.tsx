"use client";

import { useState } from "react";
import { TIERS, getQuote, type TierPlan } from "@/lib/individual-tier";

interface Props {
  guildId: string;
}

const PLANS: TierPlan[] = ["hobby", "pro-indie", "enterprise"];

export function TryItNowButton({ guildId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--n-surface-2,#F5F3EE)] border border-[var(--n-divider,rgba(0,0,0,0.08))] px-4 py-2 text-sm font-bold text-[var(--n-text,#1A1714)] hover:border-[var(--primary,#6366F1)] hover:text-[var(--primary,#6366F1)] active:scale-[0.97] transition-all"
      >
        <span>⚡</span>
        ためしてみる
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="お試し枠の選択"
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto overscroll-contain">
            <div className="px-5 py-4 border-b border-[var(--n-divider,rgba(0,0,0,0.08))] flex items-center justify-between">
              <p className="font-bold text-[var(--n-text,#1A1714)]">ティア比較</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="閉じる"
                className="text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)] text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              {PLANS.map((plan) => {
                const tier = TIERS[plan];
                const quote = getQuote(plan, 0);
                const isHobby = plan === "hobby";
                return (
                  <div
                    key={plan}
                    className={`rounded-2xl border p-4 ${
                      isHobby
                        ? "border-[var(--n-positive,#0E9F4F)] bg-green-50"
                        : "border-[var(--n-divider,rgba(0,0,0,0.08))] bg-[var(--n-surface,#FFFFFF)]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-[var(--n-text,#1A1714)] text-sm">{tier.displayName}</p>
                        <p className="text-[10px] text-[var(--n-muted,#6B6456)]">{tier.note}</p>
                      </div>
                      <p className="text-right">
                        <span className="text-xl font-extrabold tabular-nums text-[var(--n-text,#1A1714)]">
                          {tier.monthlyJpy === 0 && plan !== "enterprise" ? "¥0" : plan === "enterprise" ? "従量" : `¥${tier.monthlyJpy.toLocaleString("ja-JP")}`}
                        </span>
                        {plan !== "enterprise" && <span className="text-[10px] text-[var(--n-muted,#6B6456)] ml-0.5">/ 月</span>}
                      </p>
                    </div>
                    <div className="flex gap-3 text-[10px] text-[var(--n-muted,#6B6456)]">
                      <span>{tier.includedCalls === Infinity ? "無制限" : `${tier.includedCalls.toLocaleString("ja-JP")} calls/月`}</span>
                      <span>・</span>
                      <span>{tier.ratePerMin.toLocaleString("ja-JP")} req/min</span>
                      <span>・</span>
                      <span className={tier.commercialOk ? "text-[var(--n-positive,#0E9F4F)] font-semibold" : "text-[#6366F1]"}>
                        {tier.commercialOk ? "商用 OK" : "商用不可"}
                      </span>
                    </div>
                    {isHobby && (
                      <button
                        type="button"
                        className="mt-3 w-full h-10 rounded-full bg-[var(--n-positive,#0E9F4F)] text-white text-xs font-bold hover:opacity-90 active:scale-[0.97] transition-all"
                        onClick={() => setOpen(false)}
                      >
                        Hobby 枠で無料トライアル開始
                      </button>
                    )}
                  </div>
                );
              })}

              <p className="text-center text-[10px] text-[var(--n-muted,#6B6456)] pt-1">
                GUILD-ID: <code className="font-mono">{guildId}</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
