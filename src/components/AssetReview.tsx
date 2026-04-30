"use client";

import { useState } from "react";

// ─── Deterministic seed helpers ───────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const DUMMY_REVIEWERS = ["田中 K.", "佐藤 M.", "鈴木 Y.", "高橋 R.", "伊藤 S.", "渡辺 T."];
const DUMMY_COMMENTS = [
  "実際に使ってみてとても便利でした。コードの品質が高く、すぐに自分のプロジェクトに組み込めました。",
  "ドキュメントが丁寧で、初めてでも迷わずに使えました。またリピートします。",
  "レスポンスが速く、思った以上にカスタマイズが簡単。コスパ最高でした。",
  "Sランクにふさわしい品質です。AIが評価するだけあって完成度が高い。",
  "APIの設計がきれいで、既存のシステムに違和感なく統合できました。",
];

interface DummyReview {
  reviewer: string;
  stars: number;
  comment: string;
  date: string;
}

function generateDummyReviews(assetId: string): DummyReview[] {
  return Array.from({ length: 3 }, (_, i) => {
    const s = djb2(`${assetId}_review_${i}`);
    return {
      reviewer: DUMMY_REVIEWERS[s % DUMMY_REVIEWERS.length],
      stars: (s % 2 === 0 ? 5 : 4),
      comment: DUMMY_COMMENTS[s % DUMMY_COMMENTS.length],
      date: `2026-04-${String((s % 28) + 1).padStart(2, "0")}`,
    };
  });
}

const STORAGE_KEY = (id: string) => `guild_review_${id}`;

interface StoredReview {
  stars: number;
  comment: string;
}

function loadStored(assetId: string): StoredReview | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(assetId));
    return raw ? (JSON.parse(raw) as StoredReview) : null;
  } catch { return null; }
}

// ─── Star picker ──────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="評価を選択">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}つ星`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition-transform active:scale-90 ${
            n <= (hovered || value) ? "text-kaki" : "text-slate-400"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AssetReviewProps {
  assetId: string;
}

export function AssetReview({ assetId }: AssetReviewProps) {
  const dummies = generateDummyReviews(assetId);

  const stored = typeof window !== "undefined" ? loadStored(assetId) : null;
  const [myStars, setMyStars] = useState(stored?.stars ?? 0);
  const [myComment, setMyComment] = useState(stored?.comment ?? "");
  const [submitted, setSubmitted] = useState(!!stored);
  const [localReviews, setLocalReviews] = useState<DummyReview[]>(
    stored ? [{ reviewer: "あなた", stars: stored.stars, comment: stored.comment, date: new Date().toISOString().slice(0, 10) }] : []
  );

  const allReviews = [...localReviews, ...dummies];
  const avgStars = allReviews.reduce((s, r) => s + r.stars, 0) / allReviews.length;
  const commentCount = allReviews.filter((r) => r.comment.length > 0).length;

  const handleSubmit = () => {
    if (myStars === 0) return;
    const review: DummyReview = { reviewer: "あなた", stars: myStars, comment: myComment, date: new Date().toISOString().slice(0, 10) };
    try {
      localStorage.setItem(STORAGE_KEY(assetId), JSON.stringify({ stars: myStars, comment: myComment }));
    } catch { /* ignore */ }
    setLocalReviews([review]);
    setSubmitted(true);
  };

  return (
    <section className="mt-4 section-card p-5" aria-label="ピアレビュー">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          ★ レビュー
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-kaki font-bold text-sm">{"★".repeat(Math.round(avgStars))}</span>
          <span className="text-xs text-slate-400">{avgStars.toFixed(1)} · {commentCount}件のコメント</span>
        </div>
      </div>

      {/* Existing reviews */}
      <ul className="space-y-3 mb-5">
        {allReviews.map((r, i) => (
          <li key={i} className="rounded-xl border border-white/10 bg-[#162035] px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">{r.reviewer}</span>
              <span className="text-kaki text-xs">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
            </div>
            {r.comment && (
              <p className="text-xs text-[#E2E8F0] leading-relaxed">{r.comment}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">{r.date}</p>
          </li>
        ))}
      </ul>

      {/* Submit form */}
      {!submitted ? (
        <div className="border-t border-white/10 pt-4 space-y-3">
          <p className="text-xs font-semibold text-[#E2E8F0]">★ を投じる</p>
          <StarPicker value={myStars} onChange={setMyStars} />
          <textarea
            rows={3}
            maxLength={140}
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="コメント（140字以内）"
            aria-label="レビューコメント"
            className="input-base resize-none w-full text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{myComment.length} / 140</span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={myStars === 0}
              aria-label="レビューを投稿する"
              className="btn-primary !py-1.5 !text-xs disabled:opacity-50"
            >
              投稿する
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-accent-green font-semibold">✓ レビューを投稿しました。ありがとうございます。</p>
          <p className="text-[10px] text-slate-400 mt-1">あなたの評価が信用スコアに反映されます。</p>
        </div>
      )}
    </section>
  );
}
