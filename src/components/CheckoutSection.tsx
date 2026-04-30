"use client";

import { useState, useCallback } from "react";
import { purchaseAction } from "@/app/actions/checkout";
import type { PaymentMethod, Currency } from "@/types";
import { ShareButton } from "@/components/ShareButton";

interface CheckoutSectionProps {
  assetId: string;
  assetTitle: string;
  price: number;
  onSuccess?: (apiKey: string, receiptUrl?: string, txHash?: string) => void;
}

type FlowState =
  | { kind: "idle" }
  | { kind: "jpyc-connecting" }
  | { kind: "onramp-loading" }
  | { kind: "processing" }
  | { kind: "success"; apiKey: string; receiptUrl?: string; txHash?: string }
  | { kind: "error"; message: string };

function PaymentTile({
  id, icon, label, sublabel, selected, onSelect, badge, prominent,
}: {
  id: PaymentMethod; icon: string; label: string; sublabel: string;
  selected: boolean; onSelect: (id: PaymentMethod) => void; badge?: string; prominent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      aria-label={label}
      className={`relative flex min-h-[56px] w-full flex-col items-start justify-center rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.98] ${
        prominent
          ? selected
            ? "border-kaki bg-kaki/10 ring-2 ring-kaki/40 shadow-sm"
            : "border-kaki/30 bg-kaki/5 hover:border-kaki/60"
          : selected
          ? "border-kaki bg-kaki/5 ring-1 ring-kaki/30"
          : "border-white/10 bg-white hover:border-kaki/40"
      }`}
    >
      {badge && (
        <span className="absolute top-2 right-2 rounded-full bg-accent-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-green">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none">{icon}</span>
        <span className={`font-semibold text-white ${prominent ? "text-base" : "text-sm"}`}>{label}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-400 leading-tight">{sublabel}</p>
    </button>
  );
}

function OnrampModal({ amount, onClose }: { amount: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-white">クレカでデジタル円を購入して支払う</h3>
        <p className="mt-1 text-sm text-slate-400">クレジットカードでデジタル円を購入し、即時に決済します</p>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/10 bg-[#162035] px-4 py-3">
            <p className="text-xs text-slate-400">購入金額</p>
            <p className="mt-1 text-2xl font-bold text-white tabular-nums">
              ¥{amount.toLocaleString("ja-JP")}
            </p>
            <p className="text-xs text-slate-400">日本円と同じ価値のデジタル円で支払われます</p>
          </div>
          <div className="rounded-xl border border-kaki/20 bg-kaki/5 px-4 py-3">
            <p className="text-xs text-kaki font-medium">
              デジタル円は日本円とほぼ同じ価値で、安全に保管できる安心の電子マネーです
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#162035] px-4 py-3">
            <p className="text-xs text-slate-400 mb-1">カード番号（モック）</p>
            <p className="text-base font-mono text-white">**** **** **** 4242</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="キャンセル"
            className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-[#E2E8F0] hover:bg-kuroko/5 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="購入して支払う"
            className="flex-1 btn-primary !py-3"
          >
            購入して支払う
          </button>
        </div>
      </div>
    </div>
  );
}

const SETUP_STEPS = [
  "① 購入内容を確認中…",
  "② お仕事の準備中…",
  "③ アクセスキーを発行中…",
];

function SetupChecklist({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useState(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    SETUP_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i + 1), (i + 1) * 400));
    });
    timers.push(setTimeout(onDone, SETUP_STEPS.length * 400 + 200));
    return () => timers.forEach(clearTimeout);
  });

  return (
    <div className="mt-4 rounded-xl border border-kaki/20 bg-kaki/5 px-4 py-4 space-y-2">
      {SETUP_STEPS.slice(0, step + 1).map((msg, i) => (
        <p key={msg} className="flex items-center gap-2 text-sm text-[#E2E8F0]">
          <span className={i < step ? "text-accent-green" : "text-kaki animate-pulse"}>
            {i < step ? "✓" : "⟳"}
          </span>
          {msg}
        </p>
      ))}
    </div>
  );
}

// Tile definitions — card is listed first for reorder logic
const CARD_TILE = { id: "card" as PaymentMethod,   icon: "💳", label: "クレジットカード（日本円）",       sublabel: "Visa / Mastercard — 即時決済",               payoutCurrency: "JPY" as Currency };
const OTHER_TILES: Array<{ id: PaymentMethod; icon: string; label: string; sublabel: string; badge?: string; payoutCurrency: Currency }> = [
  { id: "bank",   icon: "🏦", label: "銀行振込",              sublabel: "振込確認後にお渡しします",               payoutCurrency: "JPY" },
  { id: "jpyc",   icon: "💰", label: "残高で払う（デジタル円）", sublabel: "保有残高から即時決済", badge: "残高あり", payoutCurrency: "JPYC" },
  { id: "onramp", icon: "⚡", label: "残高がない方はこちら",   sublabel: "クレカでデジタル円を購入して支払う",       payoutCurrency: "JPYC" },
];

export function CheckoutSection({ assetId, assetTitle: _assetTitle, price, onSuccess }: CheckoutSectionProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [flow, setFlow] = useState<FlowState>({ kind: "idle" });
  const [showOnrampModal, setShowOnrampModal] = useState(false);
  const [showSetupChecklist, setShowSetupChecklist] = useState(false);

  const allTiles = [CARD_TILE, ...OTHER_TILES];
  const selectedTile = allTiles.find((t) => t.id === selectedMethod)!;

  const handleMethodSelect = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method);
    setFlow({ kind: "idle" });
    if (method === "jpyc") {
      setFlow({ kind: "jpyc-connecting" });
      setTimeout(() => setFlow({ kind: "idle" }), 1000);
    }
  }, []);

  const handlePurchase = useCallback(async () => {
    if (selectedMethod === "onramp") {
      setShowOnrampModal(true);
      return;
    }
    setFlow({ kind: "processing" });
    await new Promise((r) => setTimeout(r, 600));
    const out = await purchaseAction({
      assetId,
      amountJpy: price,
      method: selectedMethod,
      payoutCurrency: selectedTile.payoutCurrency,
    });
    if (out.status !== "settled") {
      setFlow({ kind: "error", message: out.message });
      return;
    }
    setShowSetupChecklist(true);
    setFlow({ kind: "success", apiKey: out.apiKey, receiptUrl: out.receiptUrl, txHash: out.txHash });
    onSuccess?.(out.apiKey, out.receiptUrl, out.txHash);
  }, [assetId, price, selectedMethod, selectedTile.payoutCurrency, onSuccess]);

  const handleOnrampClose = useCallback(() => {
    setShowOnrampModal(false);
    setFlow({ kind: "onramp-loading" });
    setTimeout(async () => {
      const out = await purchaseAction({ assetId, amountJpy: price, method: "onramp", payoutCurrency: "JPYC" });
      if (out.status === "settled") {
        setShowSetupChecklist(true);
        setFlow({ kind: "success", apiKey: out.apiKey, txHash: out.txHash });
        onSuccess?.(out.apiKey, undefined, out.txHash);
      } else {
        setFlow({ kind: "error", message: out.message });
      }
    }, 700);
  }, [assetId, price, onSuccess]);

  if (flow.kind === "success") {
    return (
      <section className="mt-4 section-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-accent-green text-xl" aria-hidden>✓</span>
          <h2 className="text-base font-bold text-white">購入完了 — スキル資産を取得しました</h2>
        </div>
        <div className="rounded-xl border border-accent-green/20 bg-accent-green/5 px-4 py-3 space-y-1">
          <p className="text-xs text-slate-400">アクセスキー</p>
          <p className="font-mono text-xs text-white break-all">{flow.apiKey}</p>
        </div>
        {flow.receiptUrl && (
          <p className="mt-2 text-sm text-slate-400">領収書: <span className="text-kaki underline">{flow.receiptUrl}</span></p>
        )}
        {flow.txHash && (
          <p className="mt-2 text-sm text-slate-400">取引ID: <span className="font-mono text-xs">{flow.txHash}</span></p>
        )}
        {showSetupChecklist && (
          <SetupChecklist onDone={() => setShowSetupChecklist(false)} />
        )}
        {/* Share purchase */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">購入をシェアする</p>
          <ShareButton context={{ type: "purchase_done", assetId }} seed={0} compact />
        </div>
        <div className="mt-4">
          <a href="/dashboard" className="btn-primary !py-2 !text-sm">マイページで確認 →</a>
        </div>
      </section>
    );
  }

  return (
    <>
      {showOnrampModal && <OnrampModal amount={price} onClose={handleOnrampClose} />}

      <section className="mt-4 section-card p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-400">お値段</p>
            <p className="text-3xl font-bold text-white mt-0.5">
              ¥{price.toLocaleString("ja-JP")}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-kaki/30 bg-kaki/10 px-3 py-1 text-xs font-semibold text-kaki">
            AIエージェント対応
          </span>
        </div>

        <p className="text-sm font-semibold text-[#E2E8F0] mb-3">お支払い方法を選択</p>

        {/* Card — full-width prominent top tile */}
        <PaymentTile
          {...CARD_TILE}
          selected={selectedMethod === "card"}
          onSelect={handleMethodSelect}
          prominent
        />

        {/* Other 3 tiles in row */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {OTHER_TILES.map((tile) => (
            <PaymentTile
              key={tile.id}
              {...tile}
              selected={selectedMethod === tile.id}
              onSelect={handleMethodSelect}
            />
          ))}
        </div>

        {flow.kind === "jpyc-connecting" && (
          <p className="mt-2 text-sm text-kaki animate-pulse" role="status">残高を確認中…</p>
        )}
        {flow.kind === "onramp-loading" && (
          <p className="mt-2 text-sm text-kaki animate-pulse" role="status">購入処理中…</p>
        )}
        {flow.kind === "error" && (
          <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
            {flow.message}
          </p>
        )}

        <button
          type="button"
          onClick={handlePurchase}
          disabled={flow.kind === "processing" || flow.kind === "jpyc-connecting" || flow.kind === "onramp-loading"}
          aria-label="購入してアクセスキーを取得する"
          className="btn-primary w-full !py-4 mt-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {flow.kind === "processing" ? "決済処理中…" : flow.kind === "onramp-loading" ? "購入中…" : "購入してアクセスキーを取得する"}
        </button>

        <p className="mt-2 text-xs text-center text-slate-400">
          決済確認後にアクセスキーを発行します（安全な認証システムで保護）
        </p>
      </section>
    </>
  );
}
