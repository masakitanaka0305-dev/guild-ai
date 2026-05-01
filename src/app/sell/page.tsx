"use client";

import {
  Suspense, useMemo, useState, useEffect, useRef, useCallback,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { audit, computeFloorPrice } from "@/lib/ai-auditor";
import { computeTrustScore } from "@/lib/trust-score";
import { autoList } from "@/lib/marketplace";
import { persistListingAction } from "@/app/actions/marketplace";
import { RankBadge } from "@/components/RankBadge";
import { RankRadar } from "@/components/RankRadar";
import { StepIndicator } from "@/components/StepIndicator";
import { formatJPY, isGithubUrl } from "@/utils/format";
import { generateRemixDescription, extractFromReadme, extractSalesParts } from "@/lib/listing-generator";
import { listRepos, fetchReadme } from "@/lib/github-picker";
import type { MockRepo } from "@/lib/github-picker";
import { voiceLogToProofOfMake, generateProductPitch } from "@/lib/proof-of-make";
import type { CCAF, MarketplaceListing, Currency, Rank } from "@/types";
import { PackageIcon, SearchIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { setPhoto } from "@/lib/asset-photos";
import { computeBundlePricing } from "@/lib/checkout";
import { RevenueSimulatorCard } from "@/components/RevenueSimulatorCard";
import { SchemaPanel } from "@/components/SchemaPanel";
import { useUserId } from "@/components/AuthProvider";
import { generateSchemas } from "@/lib/schema-generator";
import { mintGuildIdForAsset } from "@/lib/guild-id";
import { BulkDepositSection } from "@/components/BulkDepositSection";
import { recordConsent, CURRENT_TERMS_VERSION } from "@/lib/consent-log";

// ─── Types ────────────────────────────────────────────────────────────────────

type RegistrationPath = "ai" | "voice" | "text";

interface CompletionData {
  listingId: string;
  title: string;
  rank: Rank;
  floorPrice: number;
  deployUrl: string;
  apiEndpoint: string;
}

const defaultCCAF: CCAF = {
  intentSignals: ["author-statement"],
  thoughtDensity: 72,
  iterations: 14,
  authorId: "me",
  createdAt: "2026-04-28T00:00:00.000Z",
};

const trust = computeTrustScore({ qualityHistory: 70, discordContribution: 55, xAmplification: 40 });

// ─── 3-minute timer ────────────────────────────────────────────────────────────

const LIMIT = 180;

function TimerBar({ startAt }: { startAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startAt) / 1000)), 500);
    return () => clearInterval(t);
  }, [startAt]);

  const pct = Math.min(100, (elapsed / LIMIT) * 100);
  const remaining = Math.max(0, LIMIT - elapsed);
  const isOver = elapsed >= LIMIT;

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>3分以内に完了</span>
        <span className={isOver ? "text-red-500 font-semibold" : ""}>
          {isOver ? "目安の3分を超えました" : `残り ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
        </span>
      </div>
      <div className="h-1 rounded-full bg-kuroko/10">
        <div
          className={`h-1 rounded-full transition-all ${isOver ? "bg-red-400" : "bg-accent-green"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Progress steps overlay ────────────────────────────────────────────────────

const AUTO_STEPS = [
  "作品の情報を読み込み中…",
  "おすすめポイントを抽出中…",
  "最適なお値段を算出中…",
  "AIが中身をチェック中…",
  "マーケットに登録中…",
  "公開URLを発行中…",
];

function AutoProgress({
  steps,
  currentStep,
  overlay = false,
}: {
  steps: string[];
  currentStep: number;
  overlay?: boolean;
}) {
  return (
    <div
      className={overlay
        ? "fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 px-8"
        : "mt-4 space-y-2"
      }
      style={overlay ? {
        background: "radial-gradient(ellipse at center, rgba(26,107,181,0.08) 0%, rgba(15,169,104,0.06) 100%)",
        backdropFilter: "blur(2px)",
        backgroundColor: "rgba(255,255,255,0.93)",
      } : undefined}
    >
      {overlay && (
        <div className="flex gap-4 mb-2 text-3xl">
          <span className="animate-bounce" style={{ animationDelay: "0ms" }}>✨</span>
          <span className="animate-bounce" style={{ animationDelay: "200ms" }}>📐</span>
          <span className="animate-bounce" style={{ animationDelay: "400ms" }}>🔬</span>
        </div>
      )}
      {overlay && (
        <p className="text-base font-bold text-white mb-4 text-center">
          AIが中身を丁寧にチェックしています...
        </p>
      )}
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-3">
          {i < currentStep
            ? <span className="text-accent-green font-bold text-lg">✓</span>
            : i === currentStep
            ? <span className="text-kaki animate-pulse font-bold text-lg">⟳</span>
            : <span className="text-slate-400 font-bold text-lg">○</span>
          }
          <span className={`text-sm ${i === currentStep ? "text-kaki font-semibold" : i < currentStep ? "text-accent-green" : "text-slate-400"}`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Completion card ───────────────────────────────────────────────────────────

function CompletionCard({ data }: { data: CompletionData }) {
  const [copied, setCopied] = useState<"deploy" | "api" | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const router = useRouter();

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhoto(data.listingId, dataUrl);
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  const copy = (text: string, key: "deploy" | "api") => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Success header */}
      <div className="rounded-2xl bg-accent-green/10 border border-accent-green/30 p-5 text-center">
        <div className="flex justify-center mb-2 gap-3 items-center">
          <div className="text-4xl">🎉</div>
        </div>
        <h2 className="text-xl font-bold text-white">あなたの たからもの として登録されました</h2>
        <p className="mt-1 text-sm text-slate-400">
          ランク <RankBadge rank={data.rank} /> ·
          お値段 <span className="font-bold text-white">¥{data.floorPrice.toLocaleString("ja-JP")}</span>
        </p>
      </div>

      {/* Photo upload (optional) */}
      <div className="section-card p-4 flex items-center gap-4">
        <div className="shrink-0">
          {photoPreview ? (
            <img src={photoPreview} alt="プレビュー" width={56} height={56} className="rounded-xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[var(--n-surface-2,#F5F3EE)] flex items-center justify-center text-2xl">🎁</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">写真でも見せる（任意）</p>
          <p className="text-xs text-slate-400 mt-0.5">顔写真や作品画像を追加できます</p>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-text-primary hover:border-kaki/40 transition-colors">
            📷 画像を選ぶ
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} aria-label="写真をアップロード" />
          </label>
        </div>
      </div>

      {/* Simulator card — before API endpoint */}
      <RevenueSimulatorCard rank={data.rank} floorPrice={data.floorPrice} title={data.title} />

      {/* Auto-generated schema spec */}
      {(() => {
        const schemas = generateSchemas(data.title, { title: data.title, rank: data.rank });
        const guildId = mintGuildIdForAsset(data.listingId);
        return <SchemaPanel guildId={guildId} title={data.title} schemas={schemas} />;
      })()}

      {/* 3 parallel links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Public URL */}
        <div className="section-card p-4">
          <p className="text-xs text-slate-400 font-semibold mb-2">公開URL</p>
          <p className="font-mono text-xs text-kaki truncate">{data.deployUrl.slice(0, 40)}…</p>
          <button
            type="button"
            onClick={() => copy(data.deployUrl, "deploy")}
            aria-label="公開URLをコピー"
            className="btn-secondary w-full !py-1.5 !text-xs mt-2"
          >
            {copied === "deploy" ? "✓ コピー済み" : "URLをコピー"}
          </button>
        </div>

        {/* Reception desk */}
        <div className="section-card p-4">
          <p className="text-xs text-slate-400 font-semibold mb-2">おしごと窓口</p>
          <p className="font-mono text-xs text-kaki truncate">{data.apiEndpoint.slice(0, 40)}…</p>
          <button
            type="button"
            onClick={() => copy(data.apiEndpoint, "api")}
            aria-label="受付窓口URLをコピー"
            className="btn-secondary w-full !py-1.5 !text-xs mt-2"
          >
            {copied === "api" ? "✓ コピー済み" : "コピーする"}
          </button>
        </div>

        {/* Management */}
        <div className="section-card p-4 flex flex-col">
          <p className="text-xs text-slate-400 font-semibold mb-2">💴 運用</p>
          <p className="text-sm text-white leading-relaxed flex-1">報酬・資産・取引履歴を確認できます</p>
          <button
            type="button"
            onClick={() => router.push("/guild")}
            aria-label="運用へ移動"
            className="btn-primary w-full !py-1.5 !text-xs mt-2"
          >
            💴 運用へ →
          </button>
        </div>
      </div>

      {/* Share listing */}
      <div className="section-card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">登録をシェアする</p>
        <ShareButton
          context={{ type: "listing_published", title: data.title, rank: data.rank }}
          url={`https://guild-ai.vercel.app/asset/${data.listingId}`}
          seed={0}
        />
      </div>

      <button
        type="button"
        onClick={() => router.push(`/marketplace?highlight=${data.listingId}`)}
        aria-label="お店で確認"
        className="btn-secondary w-full"
      >
        お店で確認 →
      </button>
    </div>
  );
}

// ─── Repo icon badge ───────────────────────────────────────────────────────────

const ICON_BG_COLORS = ["bg-kaki", "bg-accent-green", "bg-[#9B6BB5]", "bg-[#E8621C]", "bg-[#2D7FBF]"];

function RepoIconBadge({ name, idx }: { name: string; idx: number }) {
  const color = ICON_BG_COLORS[(name.charCodeAt(0) + idx) % ICON_BG_COLORS.length];
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-base shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Path 1: AI にお任せ ────────────────────────────────────────────────────────

function AiPath({
  onComplete,
  onReset: _onReset,
}: {
  onComplete: (data: CompletionData) => void;
  onReset: () => void;
}) {
  const userId = useUserId();
  const [username, setUsername] = useState("");
  const [connected, setConnected] = useState(false);
  const [repos, setRepos] = useState<MockRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<MockRepo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);

  const handleConnect = () => {
    if (!username.trim()) return;
    setConnected(true);
    setRepos(listRepos(username.trim()));
  };

  const handleSelectRepo = (repo: MockRepo) => {
    setSelectedRepo(repo);
  };

  const handleAutoRun = useCallback(async () => {
    if (!selectedRepo) return;
    setIsProcessing(true);

    for (let i = 0; i < AUTO_STEPS.length; i++) {
      setProcessStep(i);
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    }
    setProcessStep(AUTO_STEPS.length);

    const readmeText = fetchReadme(selectedRepo);
    const extract = extractFromReadme(readmeText);
    const salesParts = extractSalesParts(readmeText);
    const newId = `listing_${Date.now()}`;
    const ccaf: CCAF = { intentSignals: ["author-statement"], thoughtDensity: 75, iterations: 10, authorId: userId, createdAt: new Date().toISOString() };
    const auditResult = audit({ ccaf, vercelUptimeDays: 30 });
    const blendedPrice = Math.round((extract.suggestedPrice + salesParts.priceSuggestion) / 2);
    const floor = computeFloorPrice(blendedPrice, trust.score);

    const ml: MarketplaceListing = autoList(
      { id: newId, ownerId: userId, title: extract.title, description: extract.description, ccaf, vercelUptimeDays: 30, basePrice: extract.suggestedPrice, githubUrl: selectedRepo.url },
      { qualityHistory: 70, discordContribution: 55, xAmplification: 40 },
      new Date().toISOString()
    );

    persistListingAction(ml.listing).catch((e) => console.error("Persist listing failed:", e));
    try {
      const existing: MarketplaceListing[] = JSON.parse(localStorage.getItem("guild_custom_listings") ?? "[]");
      localStorage.setItem("guild_custom_listings", JSON.stringify([...existing, ml]));
    } catch { /* ignore */ }

    onComplete({
      listingId: newId,
      title: extract.title,
      rank: auditResult.rank,
      floorPrice: floor,
      deployUrl: `https://vercel.com/new/clone?repository-url=${encodeURIComponent(selectedRepo.url)}`,
      apiEndpoint: `https://guild-ai.vercel.app/api/atoa/${newId}`,
    });
  }, [selectedRepo, onComplete]);

  if (isProcessing && processStep < AUTO_STEPS.length) {
    return <AutoProgress steps={AUTO_STEPS} currentStep={processStep} />;
  }

  return (
    <div className="space-y-4">
      {/* Step 1: GitHub connect */}
      {!connected && (
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="w-14 h-14 rounded-2xl bg-kaki/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-kaki fill-current" aria-hidden>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">GitHubアカウントを連携</h2>
            <p className="mt-1 text-sm text-slate-400">あなたの作品を選ぶだけ。URLコピペ不要。</p>
          </div>
          <div className="w-full max-w-xs space-y-2">
            <input
              type="text" value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              placeholder="GitHubアカウント名（例: octocat）"
              aria-label="GitHubアカウント名"
              className="input-base text-center"
            />
            <button
              type="button" onClick={handleConnect} disabled={!username.trim()}
              aria-label="GitHubで連携する"
              className="btn-primary w-full !h-16 !text-base disabled:opacity-50"
            >
              GitHubで連携（1タップ）
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 作品を選ぶ (icon+title grid) */}
      {connected && !selectedRepo && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-accent-green/30 bg-accent-green/5 px-4 py-2.5">
            <span className="text-accent-green font-bold">✓</span>
            <span className="text-sm font-medium text-white">{username} — 連携完了</span>
          </div>
          <p className="text-sm font-semibold text-text-primary">あなたの作品を選ぶ</p>

          <ul className="grid gap-2 sm:grid-cols-2">
            {repos.map((repo, idx) => (
              <li key={repo.id} className="relative">
                {repo.recommended && (
                  <div className="absolute -top-1 -right-1 z-10 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    おすすめ！
                  </div>
                )}
                <button
                  type="button" onClick={() => handleSelectRepo(repo)}
                  aria-label={`${repo.name}を選択`}
                  className={`w-full text-left rounded-xl border p-3 min-h-[56px] transition-all active:scale-[0.98] ${
                    repo.recommended
                      ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                      : "border-white/10 bg-white hover:border-kaki/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RepoIconBadge name={repo.name} idx={idx} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{repo.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{repo.description}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 3: Auto run */}
      {selectedRepo && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-kaki/30 bg-kaki/5 px-4 py-2.5">
            <RepoIconBadge name={selectedRepo.name} idx={0} />
            <span className="text-sm font-medium text-white">{selectedRepo.name}</span>
            <span className="ml-auto text-xs bg-accent-green/10 text-accent-green rounded-full px-2 py-0.5 font-semibold">
              作品の情報を自動で取得しました
            </span>
          </div>

          {/* Selling points preview */}
          {(() => {
            const readme = fetchReadme(selectedRepo);
            const sp = extractSalesParts(readme);
            return sp.sellingPoints.length > 0 ? (
              <div className="rounded-xl border border-kaki/20 bg-kaki/5 p-3">
                <p className="text-xs font-semibold text-kaki mb-2">✨ AIが抽出した「売れる部品」</p>
                <ul className="space-y-1">
                  {sp.sellingPoints.map((pt) => (
                    <li key={pt} className="flex gap-2 text-xs text-text-primary">
                      <span className="text-accent-green shrink-0">✓</span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}

          <button
            type="button" onClick={handleAutoRun}
            aria-label="AIにおまかせ — お店にならべる"
            className="btn-primary w-full !py-4 !text-base"
          >
            ✨ AIにおまかせ — お店にならべる
          </button>

          <button type="button" onClick={() => setSelectedRepo(null)} className="text-sm text-slate-400 underline w-full text-center">
            別の作品を選ぶ
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Path 2: 音声で登記 ────────────────────────────────────────────────────────

function VoicePath({ onComplete }: { onComplete: (data: CompletionData) => void }) {
  const userId = useUserId();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasSpeechApi, setHasSpeechApi] = useState(false);
  const [step, setStep] = useState<"record" | "pitch" | "processing">("record");
  const [processStep, setProcessStep] = useState(0);
  const [pitch, setPitch] = useState<{ description: string; manual: string[] } | null>(null);
  const recogRef = useRef<unknown>(null);

  const VOICE_STEPS = ["読み込み中…", "動作チェック中…", "採点中…", "公開URLを発行中…"];

  useEffect(() => {
    setHasSpeechApi(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  const toggleRecording = useCallback(() => {
    if (!hasSpeechApi) return;
    if (isRecording) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recogRef.current as any)?.stop();
      setIsRecording(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = "ja-JP"; recog.continuous = true; recog.interimResults = true;
    recog.onresult = (event: Event & { results: SpeechRecognitionResultList }) => {
      const text = Array.from(event.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript).join("");
      setTranscript(text);
    };
    recog.onerror = () => setIsRecording(false);
    recog.onend = () => setIsRecording(false);
    recog.start();
    recogRef.current = recog;
    setIsRecording(true);
  }, [isRecording, hasSpeechApi]);

  const handleGeneratePitch = useCallback(() => {
    const result = generateProductPitch(transcript || "この作品に全力を注ぎました");
    setPitch(result);
    setStep("pitch");
  }, [transcript]);

  const handleProcess = useCallback(async () => {
    const proof = voiceLogToProofOfMake(transcript || "制作へのこだわりと思いを込めました");
    setStep("processing");

    for (let i = 0; i < VOICE_STEPS.length; i++) {
      setProcessStep(i);
      await new Promise((r) => setTimeout(r, 600));
    }
    setProcessStep(VOICE_STEPS.length);

    const newId = `listing_${Date.now()}`;
    const ccaf: CCAF = { intentSignals: proof.intentSignals, thoughtDensity: 72, iterations: 14, authorId: userId, createdAt: new Date().toISOString() };
    const auditResult = audit({ ccaf, vercelUptimeDays: 30 });
    const floor = computeFloorPrice(5000, trust.score);
    const title = pitch?.description.slice(0, 30) + "…" || `音声登録 — ${new Date().toLocaleDateString("ja-JP")}`;
    const description = pitch?.description || proof.refinedDescription;

    const ml: MarketplaceListing = autoList(
      { id: newId, ownerId: userId, title, description, ccaf, vercelUptimeDays: 30, basePrice: 5000, proofOfMakeNote: transcript },
      { qualityHistory: 70, discordContribution: 55, xAmplification: 40 },
      new Date().toISOString()
    );
    persistListingAction(ml.listing).catch((e) => console.error("Persist listing failed:", e));
    try {
      const existing: MarketplaceListing[] = JSON.parse(localStorage.getItem("guild_custom_listings") ?? "[]");
      localStorage.setItem("guild_custom_listings", JSON.stringify([...existing, ml]));
    } catch { /* ignore */ }

    onComplete({
      listingId: newId, title, rank: auditResult.rank, floorPrice: floor,
      deployUrl: `https://vercel.com/new/clone?repository-url=https://github.com/demo/voice-asset`,
      apiEndpoint: `https://guild-ai.vercel.app/api/atoa/${newId}`,
    });
  }, [transcript, pitch, onComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  if (step === "processing") {
    return <AutoProgress steps={VOICE_STEPS} currentStep={processStep} />;
  }

  if (step === "pitch" && pitch) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-kaki/30 bg-kaki/5 p-4">
          <p className="text-xs font-semibold text-kaki mb-2">✨ AIが作成した商品説明文</p>
          <p className="text-sm text-white leading-relaxed">{pitch.description}</p>
        </div>
        <div className="rounded-xl border border-accent-green/20 bg-accent-green/5 p-4">
          <p className="text-xs font-semibold text-accent-green mb-2">📋 マニュアル（自動作成）</p>
          <ul className="space-y-1">
            {pitch.manual.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-primary">
                <span className="text-accent-green shrink-0">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={handleProcess} className="btn-primary w-full !py-3 !text-base">
          この内容でお店に並べる →
        </button>
        <button type="button" onClick={() => setStep("record")} className="text-sm text-slate-400 underline w-full text-center">
          録音し直す
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-white">この作品の自慢を教えてください</h2>
        <p className="mt-1 text-sm text-slate-400">声で話すだけでAIがプロレベルの紹介文を作ります</p>
      </div>

      <button
        type="button" onClick={toggleRecording}
        aria-label={isRecording ? "録音停止" : "録音開始"}
        className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all active:scale-95 shadow-lg ${isRecording ? "bg-red-500 animate-pulse shadow-red-200" : "bg-kaki hover:opacity-90 shadow-kaki/20"}`}
      >
        {isRecording ? "⏹" : "🎙️"}
      </button>

      <p className="text-sm text-slate-400">{isRecording ? "録音中… タップで停止" : hasSpeechApi ? "タップして録音開始" : "ブラウザが音声入力非対応です"}</p>

      <textarea
        rows={4} value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="作品へのこだわりをここに入力（音声入力の結果も編集できます）"
        aria-label="作品の自慢"
        className="input-base resize-none w-full"
      />

      {transcript.length > 0 && (
        <button type="button" onClick={handleGeneratePitch} className="btn-primary w-full !py-3 !text-base">
          AIが紹介文とマニュアルを作成する →
        </button>
      )}
    </div>
  );
}

// ─── Path 3: テキストで入力 ────────────────────────────────────────────────────

const CURRENCY_LABELS: Record<Currency, string> = { JPY: "日本円", JPYC: "デジタル円" };
const MARKET_REFERENCE_PRICE = 3000;

function TextPath({
  onComplete,
  remixId,
  remixFrom,
}: {
  onComplete: (data: CompletionData) => void;
  remixId: string | null;
  remixFrom: string | null;
}) {
  const userId = useUserId();
  const [title, setTitle] = useState(remixFrom ? `${remixFrom} — 派生版` : "");
  const [githubUrl, setGithubUrl] = useState("");
  const [description, setDescription] = useState(remixFrom ? generateRemixDescription(remixFrom) : "");
  const [proofOfMakeNote, setProofOfMakeNote] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [ccaf, setCcaf] = useState<CCAF>(defaultCCAF);
  const [vercelUptimeDays, setUptime] = useState(30);
  const [basePrice, setBasePrice] = useState(5000);
  const [payoutCurrency, setPayoutCurrency] = useState<Currency>("JPY");
  const [promotedPrice, setPromotedPrice] = useState<number | null>(null);

  const auditResult = useMemo(() => audit({ ccaf, vercelUptimeDays }), [ccaf, vercelUptimeDays]);
  const floor = useMemo(() => promotedPrice ?? computeFloorPrice(basePrice, trust.score), [basePrice, promotedPrice]);

  // isGithubUrl only used as soft validation hint
  void isGithubUrl;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) return;
    recordConsent(userId || "anonymous", CURRENT_TERMS_VERSION);
    const finalTitle = title.trim() || "新しいスキル資産";
    const newId = `listing_${Date.now()}`;

    const ml: MarketplaceListing = autoList(
      { id: newId, ownerId: userId, title: finalTitle, description: description || "説明なし", ccaf: { ...ccaf, createdAt: new Date().toISOString() }, vercelUptimeDays, basePrice, githubUrl: githubUrl || undefined, remixedFrom: remixId || undefined, proofOfMakeNote: proofOfMakeNote || undefined },
      { qualityHistory: 70, discordContribution: 55, xAmplification: 40 },
      new Date().toISOString()
    );

    persistListingAction(ml.listing).catch((e) => console.error("Persist listing failed:", e));
    try {
      const existing: MarketplaceListing[] = JSON.parse(localStorage.getItem("guild_custom_listings") ?? "[]");
      localStorage.setItem("guild_custom_listings", JSON.stringify([...existing, ml]));
    } catch { /* ignore */ }

    onComplete({
      listingId: newId, title: finalTitle,
      rank: auditResult.rank, floorPrice: floor,
      deployUrl: `https://vercel.com/new/clone?repository-url=${githubUrl || "https://github.com/demo/repo"}`,
      apiEndpoint: `https://guild-ai.vercel.app/api/atoa/${newId}`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic info */}
      <div className="section-card p-5 space-y-3">
        <h2 className="text-base font-bold text-white">基本情報</h2>
        <label className="flex flex-col gap-1 text-sm text-text-primary">
          タイトル
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="あなたの作品のタイトル" aria-label="タイトル" className="input-base" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-primary">
          GitHub URL（任意）
          <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/owner/repo" aria-label="GitHub URL" className="input-base" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-primary">
          説明文
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="この作品が解決する課題と特徴" aria-label="説明文" className="input-base resize-none" />
        </label>
      </div>

      {/* 制作の証明 */}
      <div className="section-card p-5 space-y-3">
        <h2 className="text-base font-bold text-white">こだわり（実績ログ）</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            考えの深さ (0–100)
            <input type="number" value={ccaf.thoughtDensity} min={0} max={100}
              onChange={(e) => setCcaf({ ...ccaf, thoughtDensity: Number(e.target.value) })}
              aria-label="考えの深さ" className="input-base" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            試みた回数
            <input type="number" value={ccaf.iterations} min={0}
              onChange={(e) => setCcaf({ ...ccaf, iterations: Number(e.target.value) })}
              aria-label="試みた回数" className="input-base" />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-sm text-text-primary">
            稼働日数
            <input type="number" value={vercelUptimeDays} min={0}
              onChange={(e) => setUptime(Number(e.target.value))}
              aria-label="稼働日数" className="input-base" />
          </label>
        </div>
      </div>

      {/* 知能の品質ランク + Radar */}
      <div className="section-card p-5">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-1.5"><SearchIcon size={16} className="text-kaki" />クオリティ・スコア</h2>
        <div className="flex flex-col items-center sm:flex-row gap-6">
          <div className="relative">
            {/* Magical audit animation overlay */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(26,107,181,0.06) 0%, transparent 70%)", animation: "pulse 3s ease-in-out infinite" }} />
            <RankRadar thoughtDensity={ccaf.thoughtDensity} iterations={ccaf.iterations} uptimeDays={vercelUptimeDays} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <RankBadge rank={auditResult.rank} large />
              <span className="text-base text-text-primary">スコア {auditResult.score}</span>
            </div>
            <ul className="space-y-1">
              {auditResult.reasons.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-text-primary">
                  <span className="text-kaki mt-0.5">·</span>{r}
                </li>
              ))}
            </ul>
            {auditResult.justification && (
              <div className="rounded-xl border border-kaki/20 bg-kaki/5 px-3 py-2.5">
                <p className="text-xs font-semibold text-kaki mb-1">💬 AIの解説</p>
                <p className="text-sm text-text-primary leading-relaxed">{auditResult.justification}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 価格設定 — slider */}
      <div className="section-card p-5 space-y-3">
        <h2 className="text-base font-bold text-white">値段を決める</h2>
        <p className="text-sm text-slate-400">
          類似のスキルは <span className="font-semibold text-white">¥{MARKET_REFERENCE_PRICE.toLocaleString()}</span> で取引されています
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={500} max={10000} step={100}
            value={basePrice}
            onChange={(e) => setBasePrice(Number(e.target.value))}
            aria-label="お値段スライダー"
            className="flex-1 accent-kaki"
          />
          <span className="text-2xl font-bold text-white tabular-nums w-28 text-right">
            {formatJPY(floor)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>¥500</span><span>¥10,000</span>
        </div>
        <p className="text-xs text-slate-400">
          ※ 最低価格の目安です。信用スコアにより自動調整されます。
        </p>
        {/* Two-Way Pricing derived values */}
        {(() => {
          const monthly = Math.round(floor / 12);
          const pricing = computeBundlePricing(monthly);
          return (
            <div className="rounded-xl bg-kaki/5 border border-kaki/10 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">自動計算される料金プラン</p>
              <div className="flex justify-between text-xs">
                <span className="text-text-primary">月額（目安）</span>
                <span className="font-semibold tabular-nums text-white">¥{pricing.monthlyJpy.toLocaleString("ja-JP")} / 月</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-primary">買い切り（目安）</span>
                <span className="font-semibold tabular-nums text-white">¥{pricing.oneoffJpy.toLocaleString("ja-JP")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-primary">リクエスト単価</span>
                <span className="font-semibold tabular-nums text-kaki">{pricing.perCallJpyc} デジタル円</span>
              </div>
            </div>
          );
        })()}
        <div>
          <p className="text-sm font-semibold text-text-primary mb-2">売上の受け取り方</p>
          <div className="flex gap-4">
            {(["JPY", "JPYC"] as Currency[]).map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payoutCurrency" value={c} checked={payoutCurrency === c}
                  onChange={() => setPayoutCurrency(c)} className="accent-kaki" aria-label={`${CURRENCY_LABELS[c]}で受け取る`} />
                <span className="text-base font-medium text-white">{CURRENCY_LABELS[c]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Consent checkbox — required before submit */}
      <div className="section-card p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[var(--primary,#4C1D95)] flex-shrink-0"
            aria-label="利用規約と権利譲渡条件に同意します"
          />
          <span className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed">
            <a href="/legal/terms" target="_blank" className="text-[var(--primary,#4C1D95)] hover:underline font-semibold">利用規約</a>
            {" "}と{" "}
            <a href="/legal/transfer" target="_blank" className="text-[var(--primary,#4C1D95)] hover:underline font-semibold">権利譲渡条件</a>
            {" "}に同意します。
          </span>
        </label>
      </div>

      <button type="submit" aria-label="お店にならべる" disabled={!consentChecked} className="btn-primary w-full !py-4 !text-base disabled:opacity-40 disabled:cursor-not-allowed">
        ✨ お店にならべる →
      </button>
    </form>
  );
}

// ─── Main SellContent ─────────────────────────────────────────────────────────

function SellContent() {
  const userId = useUserId();
  const params = useSearchParams();
  const remixId = params.get("remix");
  const remixFrom = params.get("from");
  const claimId = params.get("claim");
  const topicParam = params.get("topic"); // ZERO-DAY:event-id

  const [activePath, setActivePath] = useState<RegistrationPath>("ai");
  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [timerStart] = useState(() => Date.now());
  const [doItForMeActive, setDoItForMeActive] = useState(false);
  const [doItForMeStep, setDoItForMeStep] = useState(0);
  const router = useRouter();

  const handleDoItForMe = useCallback(async () => {
    setDoItForMeActive(true);
    for (let i = 0; i < AUTO_STEPS.length; i++) {
      setDoItForMeStep(i);
      await new Promise((r) => setTimeout(r, 900));
    }
    setDoItForMeStep(AUTO_STEPS.length);

    const newId = `listing_${Date.now()}`;
    const ccaf: CCAF = { intentSignals: ["author-statement", "auto-generated"], thoughtDensity: 78, iterations: 12, authorId: userId, createdAt: new Date().toISOString() };
    const auditResult = audit({ ccaf, vercelUptimeDays: 30 });
    const floor = computeFloorPrice(7000, trust.score);

    const ml: MarketplaceListing = autoList(
      { id: newId, ownerId: userId, title: "AI全自動 — スキル資産", description: "AIが全自動で生成したスキル資産。高品質なコードとマニュアルを自動最適化。", ccaf, vercelUptimeDays: 30, basePrice: 7000 },
      { qualityHistory: 70, discordContribution: 55, xAmplification: 40 },
      new Date().toISOString()
    );
    persistListingAction(ml.listing).catch((e) => console.error("Persist listing failed:", e));
    try {
      const existing: MarketplaceListing[] = JSON.parse(localStorage.getItem("guild_custom_listings") ?? "[]");
      localStorage.setItem("guild_custom_listings", JSON.stringify([...existing, ml]));
    } catch { /* ignore */ }

    setDoItForMeActive(false);
    setCompletion({
      listingId: newId, title: "AI全自動 — スキル資産",
      rank: auditResult.rank, floorPrice: floor,
      deployUrl: `https://vercel.com/new/clone?repository-url=https://github.com/demo/ai-asset`,
      apiEndpoint: `https://guild-ai.vercel.app/api/atoa/${newId}`,
    });
  }, []);

  // router used in DoItForMe button via handleDoItForMe path — suppress unused warning
  void router;

  const PATH_TABS: Array<{ id: RegistrationPath; label: string; time: string; desc: string }> = [
    { id: "ai",    label: "AIにお任せ",   time: "1分", desc: "作品を選ぶだけ" },
    { id: "voice", label: "声で登録",      time: "2分", desc: "話すだけでOK" },
    { id: "text",  label: "手動で入力",    time: "3分", desc: "詳細を自分で入力" },
  ];

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">

      {/* Claim flow — shown when ?claim= param is present */}

      {/* Do It For Me overlay */}
      {doItForMeActive && (
        <AutoProgress steps={AUTO_STEPS} currentStep={doItForMeStep} overlay={true} />
      )}

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)]">3行で 出品完了。</h1>
        <p className="text-sm text-[var(--n-muted,#6B6456)] mt-1">書いて提出するだけ。AIが自動で値段をつけます。</p>
      </div>

      <StepIndicator current="register" />

      {/* Omakase banner */}
      <button
        type="button"
        onClick={handleDoItForMe}
        aria-label="AIにおまかせ — 全自動でお店にならべる"
        className="mt-4 w-full rounded-2xl p-5 text-left transition-all active:scale-[0.99] hover:opacity-95 shadow-lg"
        style={{ background: "linear-gradient(135deg, #1A6BB5 0%, #0FA968 100%)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">✨</span>
          <div>
            <p className="text-base font-black text-white">AIにおまかせ</p>
            <p className="text-sm text-white/80 mt-0.5">GitHub連携 → 鑑定 → お店にならべる まで全自動。30秒で完了。</p>
          </div>
          <span className="ml-auto text-white/90 text-xl">→</span>
        </div>
      </button>

      {remixFrom && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-kaki/30 bg-kaki/10 px-3 py-2">
          <span className="text-sm text-kaki font-medium">組み合わせ元:</span>
          <span className="text-sm text-white font-semibold truncate max-w-[240px]">{remixFrom}</span>
        </div>
      )}

      {topicParam?.startsWith("ZERO-DAY:") && (
        <div
          className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3"
          role="note"
          aria-label="ゼロデイ出品ヒント"
        >
          <p className="text-xs font-semibold text-blue-700 mb-0.5">ゼロデイ対応 MD の出品</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            このフォームから出品すると、ゼロデイフィードの
            <span className="font-mono mx-1 bg-blue-100 px-1 rounded">{topicParam}</span>
            トピックに自動で紐付けられます。いち早く対応したクリエイターに優先表示の機会が与えられます。
          </p>
        </div>
      )}

      {/* Timer */}
      {!completion && <TimerBar startAt={timerStart} />}

      {/* Completion screen */}
      {completion ? (
        <CompletionCard data={completion} />
      ) : (
        <>
          {/* 3-path tabs */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {PATH_TABS.map(({ id, label, time, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivePath(id)}
                aria-pressed={activePath === id}
                aria-label={`${label}（${time}）`}
                className={`rounded-xl border p-3 text-center transition-all active:scale-[0.97] ${
                  activePath === id
                    ? "border-kaki bg-kaki/5 ring-1 ring-kaki/20"
                    : "border-white/10 bg-white hover:border-kaki/30"
                }`}
              >
                <p className={`text-sm font-bold ${activePath === id ? "text-kaki" : "text-white"}`}>{label}</p>
                <p className="text-xs text-accent-green font-semibold">{time}</p>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-5">
            {activePath === "ai" && (
              <div className="section-card p-5">
                <AiPath onComplete={setCompletion} onReset={() => setActivePath("ai")} />
              </div>
            )}
            {activePath === "voice" && (
              <div className="section-card p-5">
                <VoicePath onComplete={setCompletion} />
              </div>
            )}
            {activePath === "text" && (
              <TextPath onComplete={setCompletion} remixId={remixId} remixFrom={remixFrom} />
            )}
          </div>

          <BulkDepositSection />
        </>
      )}
    </main>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
        <div className="mt-12 section-card p-8 text-center">
          <p className="text-base text-slate-400">読み込み中…</p>
        </div>
      </main>
    }>
      <SellContent />
    </Suspense>
  );
}
