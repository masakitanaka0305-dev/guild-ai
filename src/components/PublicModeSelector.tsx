"use client";

import { useState } from "react";
import { VISIBILITY_MODES, type VisibilityMode } from "@/lib/blackbox";

interface Props {
  initialMode?: VisibilityMode;
}

export function PublicModeSelector({ initialMode = "open" }: Props) {
  const [mode, setMode] = useState<VisibilityMode>(initialMode);

  const selected = VISIBILITY_MODES.find((m) => m.mode === mode);

  return (
    <section className="mt-4 section-card p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9890A8] mb-4">
        公開モード
      </h2>

      <div
        role="radiogroup"
        aria-label="公開モードの選択"
        className="flex flex-col gap-2"
      >
        {VISIBILITY_MODES.map((info) => (
          <label
            key={info.mode}
            className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
              mode === info.mode
                ? info.mode === "encapsulated"
                  ? "border-red-400 bg-red-50 ring-1 ring-red-200"
                  : "border-kaki bg-kaki/5 ring-1 ring-kaki/20"
                : "border-kuroko/10 bg-white hover:border-kaki/20"
            }`}
          >
            <input
              type="radio"
              name="visibility-mode"
              value={info.mode}
              checked={mode === info.mode}
              onChange={() => setMode(info.mode)}
              className={`mt-0.5 ${info.mode === "encapsulated" ? "accent-red-500" : "accent-kaki"}`}
              aria-label={info.label}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${
                mode === info.mode
                  ? info.mode === "encapsulated" ? "text-red-600" : "text-kaki"
                  : "text-kuroko"
              }`}>
                {info.label}
              </p>
              <p className="text-xs text-[#9890A8] mt-0.5 leading-relaxed">{info.description}</p>
            </div>
          </label>
        ))}
      </div>

      {selected?.badge && (mode === "blackbox" || mode === "encapsulated") && (
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
          mode === "encapsulated"
            ? "border-yellow-400 bg-yellow-50"
            : "border-blue-200 bg-blue-50"
        }`}>
          <span className={`text-sm font-semibold ${mode === "encapsulated" ? "text-red-700" : ""}`}>
            {selected.badge}
          </span>
        </div>
      )}

      <p className="mt-3 text-[10px] text-[#9890A8] leading-relaxed">
        ※ モックです。実際の API 応答フィルタリングは `/api/note/[guildId]` で制御されます。
      </p>
    </section>
  );
}
