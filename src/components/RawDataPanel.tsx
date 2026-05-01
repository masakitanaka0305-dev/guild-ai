"use client";

import { CodeIcon } from "@/components/icons";

interface RawDataPanelProps {
  data: object;
}

export function RawDataPanel({ data }: RawDataPanelProps) {
  const json = JSON.stringify(data, null, 2);

  return (
    <details
      data-raw="true"
      className="mt-4 group"
      onToggle={(e) => {
        try {
          localStorage.setItem(
            "guild_raw_data_open",
            String((e.currentTarget as HTMLDetailsElement).open)
          );
        } catch { /* ignore */ }
      }}
    >
      <summary className="flex items-center gap-1.5 text-[12px] text-slate-400 cursor-pointer hover:text-kaki transition-colors list-none select-none w-fit ml-auto">
        <CodeIcon size={12} />
        技術的な詳細を見る
      </summary>
      <div className="mt-3 rounded-xl border border-white/10 bg-midnight-surface p-4 text-xs font-mono">
        <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-text-primary">
          {json}
        </pre>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(json).catch(() => {});
          }}
          className="mt-3 text-[11px] border border-white/10 rounded px-2 py-1 hover:bg-kuroko/5 transition-colors"
        >
          JSONをコピー
        </button>
      </div>
    </details>
  );
}
