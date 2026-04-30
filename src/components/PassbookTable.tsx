import type { PassbookTransaction } from "@/types";

interface PassbookTableProps {
  transactions: PassbookTransaction[];
}

// 日本の銀行通帳風レイアウト:
// 縦罫線（vertical rules）、行ベース取引明細、紙質感背景
export function PassbookTable({ transactions }: PassbookTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-400">
        取引履歴がありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10" style={{ background: "#FEFCF6" }}>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: "#F3EDD9", borderBottom: "2px solid rgba(26,22,40,0.18)" }}>
            <th className="py-2 px-3 text-left font-bold text-white/60 whitespace-nowrap" style={{ borderRight: "1px solid rgba(26,22,40,0.12)" }}>
              年月
            </th>
            <th className="py-2 px-3 text-left font-bold text-white/60 whitespace-nowrap" style={{ borderRight: "1px solid rgba(26,22,40,0.12)" }}>
              区分
            </th>
            <th className="py-2 px-3 text-left font-bold text-white/60 min-w-[120px]" style={{ borderRight: "1px solid rgba(26,22,40,0.12)" }}>
              お名前（たからもの）
            </th>
            <th className="py-2 px-3 text-right font-bold text-white/60 whitespace-nowrap">
              お受け取り
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <tr
              key={tx.id}
              style={{
                background: i % 2 === 0 ? "#FEFCF6" : "#FAF7EE",
                borderBottom: "1px solid rgba(26,22,40,0.07)",
              }}
            >
              <td
                className="py-2 px-3 text-slate-400 whitespace-nowrap tabular-nums"
                style={{ borderRight: "1px solid rgba(26,22,40,0.08)" }}
              >
                {tx.at.slice(0, 7)}
              </td>
              <td
                className="py-2 px-3 whitespace-nowrap"
                style={{ borderRight: "1px solid rgba(26,22,40,0.08)" }}
              >
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    tx.type === "card"
                      ? "bg-kaki/15 text-kaki"
                      : "bg-accent-green/15 text-accent-green"
                  }`}
                >
                  {tx.type === "card" ? "カード" : "JPYC"}
                </span>
              </td>
              <td
                className="py-2 px-3 text-white truncate max-w-[160px]"
                style={{ borderRight: "1px solid rgba(26,22,40,0.08)" }}
                title={tx.assetTitle}
              >
                {tx.assetTitle}
              </td>
              <td className="py-2 px-3 text-right font-bold tabular-nums text-accent-green whitespace-nowrap">
                +¥{tx.amount.toLocaleString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
