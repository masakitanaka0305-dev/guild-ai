"use client";

import { useState, useCallback } from "react";
import {
  generateShareText,
  buildXShareUrl,
  buildLineShareUrl,
  nativeShare,
  canUseNativeShare,
  type ShareContext,
} from "@/lib/social-share";

interface ShareButtonProps {
  context: ShareContext;
  url?: string;
  seed?: number;
  className?: string;
  compact?: boolean;
}

export function ShareButton({ context, url, seed, className = "", compact = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const shareText = generateShareText(context, seed);
  const pageUrl = url ?? (typeof window !== "undefined" ? window.location.href : "https://guild-ai.vercel.app");

  const handleCopy = useCallback(() => {
    const full = `${shareText}\n${pageUrl}`;
    navigator.clipboard.writeText(full).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareText, pageUrl]);

  const handleNative = useCallback(async () => {
    const shared = await nativeShare(shareText, pageUrl, "GUILD AI");
    if (!shared) setShowPanel(true);
  }, [shareText, pageUrl]);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <a
          href={buildXShareUrl(shareText, pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Xでシェア"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-kuroko/5 transition-colors active:scale-[0.97]"
        >
          <XLogo />
          シェア
        </a>
        <a
          href={buildLineShareUrl(shareText, pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LINEでシェア"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#00B900]/30 bg-[#00B900]/5 px-3 py-1.5 text-xs font-semibold text-[#00B900] hover:bg-[#00B900]/10 transition-colors active:scale-[0.97]"
        >
          <LineLogo />
          LINE
        </a>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="テキストをコピー"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-kuroko/5 transition-colors active:scale-[0.97]"
        >
          {copied ? "✓" : "コピー"}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preview of share text */}
      <div className="rounded-xl bg-kuroko/5 border border-white/10 px-4 py-3">
        <p className="text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-widest">シェア文</p>
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{shareText}</p>
      </div>

      {/* Share buttons row */}
      <div className="flex flex-wrap gap-2">
        <a
          href={buildXShareUrl(shareText, pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Xでシェアする"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-kuroko/5 transition-colors active:scale-[0.97]"
        >
          <XLogo />
          Xでシェア
        </a>

        <a
          href={buildLineShareUrl(shareText, pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LINEでシェアする"
          className="inline-flex items-center gap-2 rounded-xl border border-[#00B900]/30 bg-[#00B900]/5 px-4 py-2.5 text-sm font-semibold text-[#00B900] hover:bg-[#00B900]/10 transition-colors active:scale-[0.97]"
        >
          <LineLogo />
          LINEで送る
        </a>

        {typeof window !== "undefined" && canUseNativeShare() ? (
          <button
            type="button"
            onClick={handleNative}
            aria-label="共有する"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-kuroko/5 transition-colors active:scale-[0.97]"
          >
            共有
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="テキストをコピーする"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-kuroko/5 transition-colors active:scale-[0.97]"
          >
            {copied ? "✓ コピー済み" : "コピーする"}
          </button>
        )}

        {showPanel && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="テキストをコピーする"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-kuroko/5 transition-colors"
          >
            {copied ? "✓ コピー済み" : "コピーする"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inline brand logos ────────────────────────────────────────────────────────

function XLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LineLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.952 11.816C19.952 7.427 15.527 3.856 10.079 3.856S.206 7.427.206 11.816c0 3.938 3.49 7.236 8.2 7.862.32.069.754.21.864.483.099.248.065.637.032.888 0 0-.115.695-.14.842-.043.248-.198.97.849.529 1.047-.44 5.65-3.328 7.706-5.7 1.42-1.558 2.235-3.147 2.235-4.904z" />
    </svg>
  );
}
