"use client";

import { useState } from "react";
import { scanRepo, validateGithubUrl, type SuggestedAsset } from "@/lib/repo-scanner";

export function BulkDepositSection() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [assets, setAssets] = useState<SuggestedAsset[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleScan() {
    if (!validateGithubUrl(url)) {
      setError("GitHub リポジトリ URL を入力してください（例: https://github.com/user/repo）");
      return;
    }
    setError("");
    setScanning(true);
    setTimeout(() => {
      const result = scanRepo(url);
      setAssets(result.suggestedAssets);
      setSelected(new Set(result.suggestedAssets.map((a) => a.pathHint)));
      setScanning(false);
    }, 600);
  }

  function toggle(pathHint: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pathHint)) next.delete(pathHint);
      else next.add(pathHint);
      return next;
    });
  }

  function handleDeposit() {
    setDone(true);
  }

  const chosenCount = selected.size;

  return (
    <div className="mt-6 rounded-2xl border border-kaki/20 bg-kaki/5 p-5">
      <h3 className="text-sm font-bold text-white mb-1">GitHub からまとめて預ける</h3>
      <p className="text-xs text-slate-400 mb-4">
        リポジトリ URL を入力してスキャン → 資産を一括登録
      </p>

      {done ? (
        <div role="status" className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-sm font-bold text-green-700">✅ {chosenCount} 件の資産を一括登録しました</p>
          <button
            onClick={() => { setDone(false); setAssets([]); setUrl(""); }}
            className="mt-2 text-xs text-slate-400 underline"
          >
            もう一度
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="flex-1 rounded-xl border border-white/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kaki/30"
              aria-label="GitHub リポジトリ URL"
            />
            <button
              onClick={handleScan}
              disabled={scanning}
              aria-busy={scanning}
              className="flex-shrink-0 rounded-xl bg-[#06B6D4] px-4 py-2 text-sm font-bold text-white hover:bg-red-600 active:scale-95 transition disabled:opacity-60"
            >
              {scanning ? "…" : "スキャン開始"}
            </button>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600 mb-2">{error}</p>
          )}

          {/* Scanning animation */}
          {scanning && (
            <div className="h-1 w-full bg-kaki/20 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-kaki animate-pulse rounded-full" style={{ width: "60%" }} />
            </div>
          )}

          {assets.length > 0 && (
            <>
              <p className="text-xs font-semibold text-white mb-2">
                抽出された資産：{assets.length} 件
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {assets.map((a) => (
                  <label
                    key={a.pathHint}
                    className={`flex items-start gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                      selected.has(a.pathHint)
                        ? "border-kaki bg-kaki/5"
                        : "border-white/10 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(a.pathHint)}
                      onChange={() => toggle(a.pathHint)}
                      className="mt-0.5 accent-kaki"
                      aria-label={a.title}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{a.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{a.pathHint}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      a.rank === "S" ? "bg-yellow-100 text-yellow-700" :
                      a.rank === "A" ? "bg-red-100 text-red-600" : "bg-gray-100 text-slate-400"
                    }`}>
                      {a.rank}
                    </span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleDeposit}
                disabled={chosenCount === 0}
                className="w-full rounded-xl bg-[#06B6D4] py-3 text-sm font-bold text-white hover:bg-red-600 active:scale-95 transition disabled:opacity-40"
              >
                選んだ {chosenCount} 件の資産をまとめて預ける
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
