"use client";

import Link from "next/link";

export type StepId = "register" | "manage" | "distribute";

const STEPS: { id: StepId; num: string; label: string; href: string }[] = [
  { id: "register",   num: "①", label: "登記",  href: "/sell" },
  { id: "manage",     num: "②", label: "管理",  href: "/dashboard" },
  { id: "distribute", num: "③", label: "流通",  href: "/marketplace" },
];

export function StepIndicator({ current }: { current: StepId }) {
  return (
    <div className="flex items-center gap-1 text-xs flex-wrap">
      {STEPS.map((step, i) => {
        const active = step.id === current;
        return (
          <span key={step.id} className="flex items-center gap-1">
            <Link
              href={step.href}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                active
                  ? "bg-kaki text-white"
                  : "text-slate-400 hover:text-kaki"
              }`}
            >
              {step.num} {step.label}
            </Link>
            {i < STEPS.length - 1 && <span className="text-slate-400">→</span>}
          </span>
        );
      })}
    </div>
  );
}
