"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { BackArrow } from "@/components/ui/BackArrow";
import { HexRankBadge } from "@/components/ui/HexRankBadge";
import { gradeIntelligence } from "@/lib/grading";

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const showReveal = searchParams?.get("reveal") === "1";

  const [draft, setDraft] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [fields, setFields] = useState({ 課題: "", 本質: "", 鑑定: "", 出口: "" });
  const [title, setTitle] = useState("");
  const [consented, setConsented] = useState(false);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`draft:${owner}:${repo}`);
    if (stored) {
      const data = JSON.parse(stored);
      setDraft(data.draft);
      setContext(data.context);
      setFields({
        課題: data.draft?.課題 || "",
        本質: data.draft?.本質 || "",
        鑑定: data.draft?.鑑定 || "",
        出口: data.draft?.出口 || "",
      });
      setTitle(data.draft?.suggestedTitle || repo);
    } else {
      // fallback: fetch on load
      fetch("/api/repos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      }).then(r => r.json()).then(data => {
        setDraft(data.draft);
        setContext(data.context);
        setFields({ 課題: data.draft?.課題 || "", 本質: data.draft?.本質 || "", 鑑定: data.draft?.鑑定 || "", 出口: data.draft?.出口 || "" });
        setTitle(data.draft?.suggestedTitle || repo);
      });
    }
  }, [owner, repo]);

  async function handleMint() {
    if (!consented) return;
    setMinting(true);
    await fetch("/api/repos/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner, repo, draft: { ...draft, ...fields }, consentSig: "user-consented", title }),
    });
    setMinting(false);
    router.push("/guild");
  }

  if (!draft && !fields.課題) return <div className="p-8 text-[#E2E8F0]">Loading draft…</div>;

  const SECTIONS = ["課題", "本質", "鑑定", "出口"] as const;

  return (
    <main className="p-6 max-w-3xl mx-auto pb-32">
      <div className="-ml-2 mb-2 flex items-center gap-1">
        <BackArrow href="/onboarding/repos" label="コードベース選択に戻る" />
        <span className="text-xs text-slate-400">コードベース選択</span>
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-white mb-1">Edit & Mint — {owner}/{repo}</h1>
      {context && (
        <p className="text-xs text-[#E2E8F0] mb-6">
          {context.language} / {context.runtime} · {context.deps?.length ?? 0} deps
        </p>
      )}

      {/* Rank Reveal — first visit after the 鑑定中 wait. Static, no animation. */}
      {showReveal && draft && (() => {
        const md = `${title}\n\n${SECTIONS.map(k => `## ${k}\n${(fields as any)[k] || ""}`).join("\n\n")}`;
        const grade = gradeIntelligence({ mdText: md, hasRunningCode: true });
        return (
          <section
            data-testid="rank-reveal"
            className="rounded-2xl border border-cyan-400/30 bg-[#162035] p-6 mb-6 flex flex-col items-center text-center shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_24px_rgba(34,211,238,0.18)]"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">
              鑑定結果
            </p>
            <HexRankBadge rank={grade.rank} size={80} showSubLabel />
          </section>
        );
      })()}

      <div className="mb-4">
        <label className="text-xs text-[#E2E8F0] block mb-1" htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-[#162035] border border-[#22D3EE]/30 focus:border-[#22D3EE] text-[#E2E8F0] placeholder-slate-500 rounded-md px-3 py-2 text-sm outline-cyan-400"
        />
      </div>

      <div className="space-y-4 mb-6">
        {SECTIONS.map(key => (
          <div key={key}>
            <label htmlFor={key} className="text-xs text-[#E2E8F0] block mb-1">{key}</label>
            <textarea
              id={key}
              rows={3}
              value={fields[key]}
              onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
              className="w-full bg-[#162035] border border-[#22D3EE]/30 focus:border-[#22D3EE] text-[#E2E8F0] placeholder-slate-500 rounded-md px-3 py-2 text-sm outline-cyan-400 resize-y"
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 mb-6 cursor-pointer">
        <input type="checkbox" checked={consented} onChange={e => setConsented(e.target.checked)} className="accent-[#22D3EE]" />
        <span className="text-xs text-[#E2E8F0]">
          利用規約・権利譲渡規約に同意して登記します
        </span>
      </label>

      <div className="flex gap-3 items-center">
        <button
          onClick={handleMint}
          disabled={!consented || minting}
          className="px-6 py-3 bg-[#22D3EE] text-[#0B1121] font-bold rounded-full disabled:opacity-40 min-h-[44px] hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-cyan-400"
        >
          {minting ? "Minting…" : "Mint（精製）"}
        </button>
        <a href={`/onboarding`} className="text-xs text-[#E2E8F0] hover:text-white">
          ← やり直す
        </a>
      </div>
    </main>
  );
}
