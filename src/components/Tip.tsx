"use client";

import { useState, useId } from "react";

interface TipProps {
  text: string;
}

export function Tip({ text }: TipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="説明を見る"
        aria-describedby={id}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full text-gray-400 text-[11px] flex items-center justify-center border border-gray-300 hover:text-gray-600 hover:border-gray-400 transition-colors leading-none ml-1 flex-shrink-0"
      >
        ？
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[180px] bg-[#1A1714] text-white text-[11px] rounded-xl px-3 py-2 leading-relaxed z-50 shadow-lg transition-opacity duration-150 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {text}
      </span>
    </span>
  );
}
