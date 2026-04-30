"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { IntelDraft } from "@/lib/intel-parser";
import type { RepoContext } from "@/lib/repo-context";

interface AnalyzeResult {
  context: RepoContext;
  draft: IntelDraft;
  mock: boolean;
}

interface DepositResult {
  guildId: string;
  rank: string;
  floorPrice: number;
  listedAt: string;
  sourceUrl: string;
}

const SECTION_LABELS: { key: keyof Pick<IntelDraft, "課題" | "本質" | "鑑定" | "出口">; label: string; hint: string }[] = [
  { key: "課題", label: "課題", hint: "このコードが解決する具体的な問題・バグ・非効率" },
  { key: "本質", label: "本質", hint: "アルゴリズムの核心、工夫したロジック、設計の妙" },
  { key: "鑑定", label: "鑑定", hint: "動作環境の整合性、想定される信頼性と品質評価" },
  { key: "出口", label: "出口", hint: "再利用されるべき具体的なユースケース、適用シナリオ" },
];

export default function DraftPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const router = useRouter();
  const { owner, repo } = params;

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<IntelDraft | null>(null);
  const [title, setTitle] = useState("");
  const [consent, setConsent] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [deposited, setDeposited] = useState<DepositResult | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAnalysis = () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    // Fake progress bar
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(progressRef.current!); return 90; }
        return p + Math.random() * 8;
      });
    }, 300);

    fetch("/api/repos/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner, repo }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setResult(data);
        setDraft(data.draft);
        setTitle(data.draft.suggestedTitle ?? repo);
        setProgress(100);
      })
      .catch(e => setError(e.message))
      .finally(() => {
        clearInterval(progressRef.current!);
        setLoading(false);
      });
  };

  useEffect(() => {
    startAnalysis();
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeposit = async () => {
    if (!draft || !consent) return;
    setDepositing(true);
    try {
      const res = await fetch("/api/repos/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, draft, title, consentSig: `consent:${owner}:${repo}:${Date.now()}` }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDeposited(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDepositing(false);
    }
  };

  if (deposited) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)] mb-2">登記完了！</h1>
        <p className="text-[var(--n-muted,#6B6456)] mb-6">
          ランク <strong className="text-[var(--primary,#06B6D4)]">{deposited.rank}</strong> で
          フロア価格 <strong>¥{deposited.floorPrice.toLocaleString()}</strong> にて登記されました。
        </p>
        <div className="bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl p-4 text-left text-sm mb-6 font-mono break-all">
          {deposited.guildId}
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/onboarding/repos" className="px-4 py-2 rounded-xl border border-[var(--n-border,#E8E4DE)] text-sm">
            他のリポジトリを登記
          </Link>
          <Link href="/" className="px-4 py-2 rounded-xl bg-[var(--primary,#06B6D4)] text-white text-sm font-bold">
            ホームへ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--n-muted,#6B6456)] mb-6">
        <Link href="/onboarding" className="hover:underline">オンボーディング</Link>
        <span>›</span>
        <Link href="/onboarding/repos" className="hover:underline">リポジトリ選択</Link>
        <span>›</span>
        <span aria-current="step" className="text-[var(--n-text,#1A1714)] font-medium">AI 解析</span>
      </nav>

      {loading && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4 animate-spin inline-block">⚙</div>
          <h2 className="text-xl font-bold text-[var(--n-text,#1A1714)] mb-3">AI 解析中...</h2>
          <p className="text-sm text-[var(--n-muted,#6B6456)] mb-6">
            <code className="font-mono">{owner}/{repo}</code> のコードを読み解いています
          </p>
          <div className="w-full max-w-xs mx-auto h-2 bg-[var(--n-surface-2,#F5F3EE)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary,#06B6D4)] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="text-xs text-[var(--n-muted,#6B6456)] mt-2">{Math.round(progress)}%</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-500 font-medium mb-2">解析中にエラーが発生しました</p>
          <p className="text-sm text-[var(--n-muted,#6B6456)] mb-4">{error}</p>
          <button
            onClick={startAnalysis}
            className="px-4 py-2 rounded-xl bg-[var(--primary,#06B6D4)] text-white text-sm font-bold"
          >
            再解析する
          </button>
        </div>
      )}

      {!loading && !error && draft && result && (
        <div>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[var(--n-text,#1A1714)]">{owner}/{repo}</h1>
              {result.mock && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">デモ</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--n-muted,#6B6456)]">
              <span>{result.context.language}</span>
              <span>·</span>
              <span>{result.context.runtime}</span>
              <span>·</span>
              <span>依存 {result.context.deps.length} 件</span>
              {result.context.hasTests && <span className="text-green-600 font-medium">· テスト済み</span>}
              {result.context.hasReadme && <span className="text-blue-600 font-medium">· README あり</span>}
            </div>
          </div>

          {/* Title input */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-[var(--n-muted,#6B6456)] uppercase tracking-wide mb-1" htmlFor="title-input">
              アセットタイトル
            </label>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={40}
              className="w-full px-3 py-2 rounded-xl border border-[var(--n-border,#E8E4DE)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary,#06B6D4)] bg-white"
            />
          </div>

          {/* Tags */}
          {draft.suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {draft.suggestedTags.map(tag => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full bg-[var(--n-surface-2,#F5F3EE)] text-xs font-medium text-[var(--n-muted,#6B6456)]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 4 sections */}
          <div className="space-y-4 mb-6">
            {SECTION_LABELS.map(({ key, label, hint }) => (
              <div key={key} className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-border,#E8E4DE)] rounded-2xl p-4">
                <label
                  htmlFor={`section-${key}`}
                  className="block text-xs font-bold text-[var(--primary,#06B6D4)] uppercase tracking-wide mb-1"
                >
                  {label}
                </label>
                <p className="text-xs text-[var(--n-muted,#6B6456)] mb-2">{hint}</p>
                <textarea
                  id={`section-${key}`}
                  rows={3}
                  value={draft[key]}
                  onChange={e => setDraft(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
                  className="w-full text-sm text-[var(--n-text,#1A1714)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary,#06B6D4)] rounded-lg p-1 bg-transparent"
                />
              </div>
            ))}
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[var(--primary,#06B6D4)]"
            />
            <span className="text-sm text-[var(--n-muted,#6B6456)]">
              この内容を GUILD AI Intelligence Marketplace に登記することに同意します。登記後は公開されます。
            </span>
          </label>

          {/* CTA */}
          <button
            onClick={handleDeposit}
            disabled={!consent || depositing}
            className="w-full py-3 rounded-2xl bg-[var(--primary,#06B6D4)] text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0891B2] transition-colors"
          >
            {depositing ? "登記中..." : "承認して登記する"}
          </button>

          <button
            onClick={startAnalysis}
            className="w-full mt-3 text-center text-sm text-[var(--n-muted,#6B6456)] underline"
          >
            やり直す（再解析）
          </button>
        </div>
      )}
    </main>
  );
}
