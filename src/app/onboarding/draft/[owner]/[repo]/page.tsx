"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;

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

  if (!draft && !fields.課題) return <div className="p-8 text-slate-400">Loading draft…</div>;

  const SECTIONS = ["課題", "本質", "鑑定", "出口"] as const;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-1">Edit & Mint — {owner}/{repo}</h1>
      {context && (
        <p className="text-xs text-slate-400 mb-6">
          {context.language} / {context.runtime} · {context.deps?.length ?? 0} deps
        </p>
      )}

      <div className="mb-4">
        <label className="text-xs text-slate-400 block mb-1" htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-md px-3 py-2 text-sm outline-cyan-500"
        />
      </div>

      <div className="space-y-4 mb-6">
        {SECTIONS.map(key => (
          <div key={key}>
            <label htmlFor={key} className="text-xs text-slate-400 block mb-1">{key}</label>
            <textarea
              id={key}
              rows={3}
              value={fields[key]}
              onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-md px-3 py-2 text-sm outline-cyan-500 resize-y"
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 mb-6 cursor-pointer">
        <input type="checkbox" checked={consented} onChange={e => setConsented(e.target.checked)} className="accent-cyan-500" />
        <span className="text-xs text-slate-300">
          利用規約・権利譲渡規約に同意して登記します
        </span>
      </label>

      <div className="flex gap-3 items-center">
        <button
          onClick={handleMint}
          disabled={!consented || minting}
          className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-40 min-h-[44px]"
        >
          {minting ? "Minting…" : "Mint（登記）"}
        </button>
        <a href={`/onboarding`} className="text-xs text-slate-400 hover:text-slate-200">
          ← やり直す
        </a>
      </div>
    </main>
  );
}
