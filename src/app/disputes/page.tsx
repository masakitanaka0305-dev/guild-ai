"use client";

import { useState } from "react";
import Link from "next/link";
import {
  openDispute, autoResolve, getDisputes,
  type ClaimType, type Dispute,
} from "@/lib/dispute-resolver";

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  "payment-dispute":   "支払いトラブル",
  "quality-dispute":   "品質クレーム",
  "ownership-dispute": "権利トラブル",
  "plagiarism":        "剽窃申告",
};

const VERDICT_LABELS = {
  "creator-wins": "クリエイター側の勝訴",
  "buyer-wins":   "購入者側の勝訴",
  "split":        "折半解決",
  "escalated":    "人手審査にエスカレーション",
};

const STATUS_STYLE: Record<string, string> = {
  "open":          "bg-yellow-50 text-yellow-700 border-yellow-200",
  "auto-resolved": "bg-green-50 text-green-700 border-green-200",
  "escalated":     "bg-red-50 text-red-600 border-red-200",
  "closed":        "bg-gray-50 text-slate-400 border-gray-200",
};

const DEMO_HANDLE = "demo-user";

export default function DisputesPage() {
  const [claimType, setClaimType] = useState<ClaimType>("quality-dispute");
  const [guildId, setGuildId] = useState("");
  const [respondent, setRespondent] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>(() => getDisputes(DEMO_HANDLE));
  const [error, setError] = useState("");

  function refresh() {
    setDisputes([...getDisputes(DEMO_HANDLE)]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guildId.trim() || !respondent.trim() || !description.trim()) {
      setError("すべての項目を入力してください");
      return;
    }
    setError("");
    setSubmitting(true);
    const d = openDispute({
      claimType,
      guildId: guildId.trim(),
      claimantHandle: DEMO_HANDLE,
      respondentHandle: respondent.trim(),
      description: description.trim(),
    });
    const resolved = autoResolve(d.id);
    void resolved;
    setGuildId(""); setRespondent(""); setDescription("");
    setSubmitting(false);
    refresh();
  }

  function handleResolve(id: string) {
    autoResolve(id);
    refresh();
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto pb-24">
      <Link href="/" className="text-xs text-slate-400 hover:underline mb-4 inline-block">
        ← ホームに戻る
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">紛争解決センター</h1>
        <p className="text-sm text-slate-400 mt-1">
          AI が自動審査。多くの案件は24時間以内に解決されます。
        </p>
      </div>

      {/* New dispute form */}
      <section className="section-card p-5 mb-6">
        <h2 className="text-sm font-bold text-white mb-4">新規申請</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">クレームの種類</label>
            <select
              value={claimType}
              onChange={(e) => setClaimType(e.target.value as ClaimType)}
              className="w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kaki/30"
              aria-label="クレームの種類"
            >
              {(Object.entries(CLAIM_TYPE_LABELS) as [ClaimType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold text-text-primary">
            対象 GUILD-ID
            <input
              type="text"
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              placeholder="GUILD:XXXX-XXXX-XXXX"
              className="rounded-xl border border-white/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kaki/30"
              aria-label="対象 GUILD-ID"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-text-primary">
            相手方のハンドル名
            <input
              type="text"
              value={respondent}
              onChange={(e) => setRespondent(e.target.value)}
              placeholder="@username"
              className="rounded-xl border border-white/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kaki/30"
              aria-label="相手方のハンドル名"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-text-primary">
            詳細
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="トラブルの詳細を記入してください"
              className="rounded-xl border border-white/10 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-kaki/30"
              aria-label="詳細"
            />
          </label>

          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#4C1D95] py-3 text-sm font-bold text-white hover:bg-red-600 active:scale-95 transition disabled:opacity-60"
          >
            {submitting ? "審査中…" : "申請する（AI が即時審査）"}
          </button>
        </form>
      </section>

      {/* Dispute history */}
      <section>
        <h2 className="text-sm font-bold text-white mb-3">申請履歴 ({disputes.length}件)</h2>
        {disputes.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">申請履歴はありません</p>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="section-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-white">{CLAIM_TYPE_LABELS[d.claim.claimType]}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{d.id} · {d.claim.guildId}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLE[d.status]}`}>
                    {d.status === "open" ? "審査中" :
                     d.status === "auto-resolved" ? "解決済" :
                     d.status === "escalated" ? "エスカレ" : "完了"}
                  </span>
                </div>
                <p className="text-xs text-text-primary line-clamp-2 mb-2">{d.claim.description}</p>
                {d.verdict && (
                  <p className="text-[11px] font-semibold text-accent-green">
                    判定: {VERDICT_LABELS[d.verdict]}
                  </p>
                )}
                {d.reasoning && (
                  <p className="text-[10px] text-slate-400 mt-1">{d.reasoning}</p>
                )}
                {d.status === "open" && (
                  <button
                    onClick={() => handleResolve(d.id)}
                    className="mt-2 text-xs text-[var(--primary,#4C1D95)] font-semibold hover:underline"
                  >
                    今すぐ審査 →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
