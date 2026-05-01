import Link from "next/link";
import { HexRankBadge } from "@/components/ui/HexRankBadge";
import { getSRankLeaderboard } from "@/lib/leaderboard";

export const metadata = {
  title: "伝説の知能ギルド — GUILD AI",
  description:
    "S ランク保持者一覧。市場価値トップ1%の知能を貯め込んだ運用者たち。",
};

export default function LeaderboardPage() {
  const entries = getSRankLeaderboard();

  return (
    <main className="bg-[#0B1121] text-white min-h-screen min-h-dvh px-5 sm:px-8 py-8 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-white font-semibold text-2xl tracking-tight">
          伝説の知能ギルド
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          Hall of Fame — S ランク保持者一覧
        </p>
      </header>

      <ol
        data-testid="leaderboard"
        aria-label="S ランク保持者リスト"
        className="space-y-3"
      >
        {entries.map((e, i) => (
          <li
            key={e.handle}
            data-testid="leaderboard-entry"
            data-rank={e.rank}
            className="rounded-2xl border border-white/10 bg-[#162035] border-l-4 border-l-[#FDE047]/70 p-4"
          >
            <Link
              href={`/profile/${e.handle}`}
              className="flex items-center gap-4 focus:outline focus:outline-2 focus:outline-cyan-400 rounded-xl"
            >
              <span className="shrink-0 w-10 text-center text-slate-400 font-mono tabular-nums">
                #{i + 1}
              </span>
              <HexRankBadge rank="S" size={48} />
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold truncate">{e.title}</p>
                <p className="mt-0.5 text-xs text-slate-400 truncate">
                  @{e.handle} · <span className="font-mono">{e.category}</span>
                </p>
              </div>
              <p
                data-testid="leaderboard-cumulative"
                className="text-cyan-400 metric-prime shrink-0"
              >
                ¥{e.cumulativeJpy.toLocaleString("ja-JP")}
              </p>
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-center text-[11px] text-slate-400">
        累計報酬は累積ロイヤリティ（モック）の合計値です。
      </p>
    </main>
  );
}
