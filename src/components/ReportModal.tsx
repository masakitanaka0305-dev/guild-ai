"use client";

import { useState, useEffect, useRef } from "react";
import { sendReport, type ReportReason } from "@/lib/emergency-report";

const REASONS: ReportReason[] = ["Spam", "Plagiarism", "Illegal", "Other"];
const REASON_LABEL: Record<ReportReason, string> = {
  Spam: "スパム・広告",
  Plagiarism: "著作権侵害",
  Illegal: "違法コンテンツ",
  Other: "その他",
};

interface ReportModalProps {
  guildId: string;
  onClose: () => void;
}

export function ReportModal({ guildId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>("Spam");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const firstFocusRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    firstFocusRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendReport(guildId, "anonymous", reason, description);
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-sm bg-[var(--n-bg,#FAFAF7)] rounded-2xl shadow-2xl p-6">
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-1">レポートを受け付けました</p>
            <p className="text-xs text-[var(--n-muted,#6B6456)] mb-4">運営チームが確認します。ご協力ありがとうございます。</p>
            <button onClick={onClose} className="text-sm font-semibold text-[var(--primary,#6366F1)] hover:underline">
              閉じる
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 id="report-modal-title" className="text-sm font-bold text-[var(--n-text,#1A1714)]">
                不適切なコンテンツを報告
              </h2>
              <button onClick={onClose} aria-label="閉じる" className="text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)] text-lg leading-none">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--n-text,#1A1714)] mb-1">理由</label>
                <select
                  ref={firstFocusRef}
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="w-full rounded-lg border border-[var(--n-divider,rgba(0,0,0,0.12))] bg-[var(--n-surface-2,#F5F3EE)] px-3 py-2 text-sm text-[var(--n-text,#1A1714)] focus:outline-none focus:ring-2 focus:ring-[var(--primary,#6366F1)]"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{REASON_LABEL[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--n-text,#1A1714)] mb-1">詳細（任意）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="具体的な問題点をご記入ください"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--n-divider,rgba(0,0,0,0.12))] bg-[var(--n-surface-2,#F5F3EE)] px-3 py-2 text-sm text-[var(--n-text,#1A1714)] placeholder:text-[var(--n-muted,#6B6456)] focus:outline-none focus:ring-2 focus:ring-[var(--primary,#6366F1)] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-[var(--n-divider,rgba(0,0,0,0.12))] py-2 text-sm font-semibold text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[var(--primary,#6366F1)] py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                >
                  送信する
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
