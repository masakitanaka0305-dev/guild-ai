"use client";

import { useState } from "react";
import type { GeneratedSchemas } from "@/lib/schema-generator";
import { toOpenApiSpec } from "@/lib/schema-generator";

interface Props {
  guildId: string;
  title: string;
  schemas: GeneratedSchemas;
  compact?: boolean;
}

type Tab = "input" | "output" | "sample";

export function SchemaPanel({ guildId, title, schemas, compact = false }: Props) {
  const [tab, setTab] = useState<Tab>("input");

  const codeForTab: Record<Tab, string> = {
    input:  JSON.stringify(schemas.input, null, 2),
    output: JSON.stringify(schemas.output, null, 2),
    sample: JSON.stringify(schemas.examples[0] ?? {}, null, 2),
  };

  function handleExport() {
    const spec = toOpenApiSpec(guildId, title, schemas);
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${guildId}-openapi.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "input",  label: "入力スキーマ" },
    { key: "output", label: "出力スキーマ" },
    { key: "sample", label: "サンプル" },
  ];

  return (
    <div className={`bg-white border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl overflow-hidden shadow-sm ${compact ? "" : "mt-4"}`}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--n-divider,rgba(0,0,0,0.08))]">
        {!compact && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--n-muted,#6B6456)] mb-1">
            ノーコードで API 連携できます
          </p>
        )}
        <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">
          {compact ? "自動生成された入出力仕様" : "自動生成された入出力仕様"}
        </p>
      </div>

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="スキーマ表示タブ"
        className="flex border-b border-[var(--n-divider,rgba(0,0,0,0.08))]"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls={`schema-panel-${key}`}
            id={`schema-tab-${key}`}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--n-primary,#0000CC)] focus-visible:ring-inset ${
              tab === key
                ? "text-[var(--n-primary,#0000CC)] border-b-2 border-[var(--n-primary,#0000CC)]"
                : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Code pane */}
      <div
        id={`schema-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`schema-tab-${tab}`}
        className={compact ? "max-h-48 overflow-y-auto" : "max-h-72 overflow-y-auto"}
      >
        <pre
          aria-label={`${tab === "input" ? "入力" : tab === "output" ? "出力" : "サンプル"}スキーマ JSON`}
          className="bg-slate-50 text-slate-800 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed m-2"
        >
          <code>{codeForTab[tab]}</code>
        </pre>
      </div>

      {/* Export button */}
      {!compact && (
        <div className="px-5 py-3 border-t border-[var(--n-divider,rgba(0,0,0,0.08))]">
          <button
            type="button"
            onClick={handleExport}
            className="w-full h-9 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-xs font-semibold text-[var(--n-muted,#6B6456)] hover:bg-[var(--n-surface-2,#F5F3EE)] hover:text-[var(--n-text,#1A1714)] transition-all"
          >
            OpenAPI 形式で書き出す
          </button>
        </div>
      )}
    </div>
  );
}
