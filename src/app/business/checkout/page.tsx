"use client";

import { useState } from "react";
import Link from "next/link";

type Plan = "hobby" | "pro" | "enterprise";

const PLANS: Array<{
  id: Plan;
  name: string;
  price: string;
  calls: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    id: "hobby",
    name: "Hobby",
    price: "無料",
    calls: "1,000 calls/月",
    features: ["個人試作・学習向け", "商用不可", "サポート：コミュニティ"],
  },
  {
    id: "pro",
    name: "Pro Indie",
    price: "¥1,980/月",
    calls: "50,000 calls/月",
    features: ["個人事業主 OK", "企業転売 NG", "メールサポート"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "¥0.03/call",
    calls: "無制限 · 6,000 req/min",
    features: ["商用 OK", "SLA 99.99%", "専任サポート"],
  },
];

function luhn(n: string): boolean {
  const digits = n.replace(/\D/g, "").split("").map(Number).reverse();
  const sum = digits.reduce((acc, d, i) => {
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    return acc + d;
  }, 0);
  return sum % 10 === 0;
}

export default function BusinessCheckoutPage() {
  const [plan, setPlan] = useState<Plan>("pro");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleCardInput(v: string) {
    const clean = v.replace(/\D/g, "").slice(0, 16);
    setCardNumber(clean.replace(/(.{4})/g, "$1 ").trim());
  }

  function handleExpiryInput(v: string) {
    const clean = v.replace(/\D/g, "").slice(0, 4);
    setExpiry(clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length < 16 || !luhn(rawCard)) {
      setError("有効なカード番号を入力してください");
      return;
    }
    if (expiry.length < 5) { setError("有効期限を入力してください"); return; }
    if (cvc.length < 3)    { setError("CVC を入力してください"); return; }
    if (!name.trim())      { setError("カード名義を入力してください"); return; }
    setError("");
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 1200);
  }

  const selected = PLANS.find((p) => p.id === plan)!;

  if (done) {
    return (
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-lg mx-auto">
        <div className="section-card p-8 text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h1 className="text-xl font-bold text-white">{selected.name} プランへようこそ！</h1>
          <p className="text-sm text-slate-400">
            ご登録が完了しました。API キーを発行しダッシュボードで確認できます。
          </p>
          <Link
            href="/guild"
            className="inline-block rounded-xl bg-[var(--primary,#06B6D4)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            ダッシュボードへ →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-lg mx-auto pb-24">
      <Link href="/business" className="text-xs text-slate-400 hover:underline mb-4 inline-block">
        ← プラン一覧に戻る
      </Link>

      <h1 className="text-xl font-bold text-white mb-6">プランを選んで始める</h1>

      {/* Plan selector */}
      <div className="grid grid-cols-3 gap-2 mb-6" role="radiogroup" aria-label="プラン選択">
        {PLANS.map((p) => (
          <label
            key={p.id}
            className={`flex flex-col rounded-xl border-2 p-3 cursor-pointer transition-all ${
              plan === p.id
                ? "border-ai-action bg-[#1E293B]"
                : "border-white/10 bg-midnight-surface hover:border-ai-action/40"
            }`}
          >
            <input
              type="radio"
              name="plan"
              value={p.id}
              checked={plan === p.id}
              onChange={() => setPlan(p.id)}
              className="sr-only"
              aria-label={p.name}
            />
            {p.highlight && (
              <span className="text-[9px] font-bold text-[var(--primary,#06B6D4)] mb-1">人気</span>
            )}
            <p className="text-xs font-bold text-white">{p.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{p.price}</p>
            <p className="text-[10px] text-kaki font-semibold mt-1">{p.calls}</p>
          </label>
        ))}
      </div>

      {/* Features */}
      <div className="section-card p-4 mb-6">
        <p className="text-xs font-semibold text-white mb-2">{selected.name} の特典</p>
        <ul className="space-y-1">
          {selected.features.map((f) => (
            <li key={f} className="flex gap-2 text-xs text-text-primary">
              <span className="text-accent-green">✓</span>{f}
            </li>
          ))}
        </ul>
      </div>

      {/* CC form */}
      <form onSubmit={handleSubmit} className="section-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">お支払い情報（モック）</h2>

        <label className="flex flex-col gap-1 text-xs font-semibold text-text-primary">
          カード番号
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => handleCardInput(e.target.value)}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            maxLength={19}
            className="rounded-xl border border-white/10 bg-midnight-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-kaki/30 font-mono tracking-wider"
            aria-label="カード番号"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-text-primary">
            有効期限
            <input
              type="text"
              value={expiry}
              onChange={(e) => handleExpiryInput(e.target.value)}
              placeholder="MM/YY"
              maxLength={5}
              className="rounded-xl border border-white/10 bg-midnight-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-kaki/30 font-mono"
              aria-label="有効期限"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-text-primary">
            CVC
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="123"
              maxLength={3}
              className="rounded-xl border border-white/10 bg-midnight-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-kaki/30 font-mono"
              aria-label="CVC"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold text-text-primary">
          カード名義
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="TARO YAMADA"
            className="rounded-xl border border-white/10 bg-midnight-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-kaki/30 uppercase"
            aria-label="カード名義"
          />
        </label>

        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={processing}
          className="w-full rounded-xl bg-[#06B6D4] py-3 text-sm font-bold text-white hover:bg-red-600 active:scale-95 transition disabled:opacity-60"
        >
          {processing ? "処理中…" : `${selected.name} プランで始める`}
        </button>
        <p className="text-[10px] text-slate-400 text-center">
          ※ モックのため実際の決済は行われません
        </p>
      </form>
    </main>
  );
}
