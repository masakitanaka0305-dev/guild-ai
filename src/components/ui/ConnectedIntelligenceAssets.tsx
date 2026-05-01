// GUILD AI — Connected Intelligence Assets
//
// Surfaces the cross between the user's selected MD asset and the
// project's requirements as a static "the AI is already wired in"
// status card. Belongs above the Apply CTA on /projects/[id].

import { Plug } from "lucide-react";

interface ConnectedIntelligenceAssetsProps {
  /** The MD guild id wired into the project (e.g. "md_observability"). */
  mdGuildId: string;
}

export function ConnectedIntelligenceAssets({ mdGuildId }: ConnectedIntelligenceAssetsProps) {
  // The endpoint shape mirrors the AtoA contract: every MD becomes a
  // routable agent endpoint at /api/atoa/[guildId]. Static text — the
  // whole card is decorative until the agent actually fires.
  const endpoint = `/api/atoa/${mdGuildId}`;
  return (
    <section
      data-testid="connected-intelligence-assets"
      data-component="connected-intelligence-assets"
      aria-labelledby="connected-intel-heading"
      className="rounded-2xl border border-white/10 bg-midnight-surface border-l-4 border-l-brand-primary p-5 sm:p-6 mb-4"
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <h2
          id="connected-intel-heading"
          className="text-white font-semibold text-base sm:text-lg leading-snug inline-flex items-center gap-2"
        >
          <Plug aria-hidden className="w-4 h-4 stroke-brand-primary" />
          Connected Intelligence Assets
        </h2>
      </header>

      <dl className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <dt className="text-slate-400 w-20 shrink-0">Status</dt>
          <dd>
            <span
              data-testid="cia-status-ready"
              className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 px-2 py-0.5 text-xs rounded-full"
            >
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ready
            </span>
          </dd>
        </div>

        <div className="flex items-center gap-2">
          <dt className="text-slate-400 w-20 shrink-0">Agent</dt>
          <dd className="inline-flex items-center gap-1.5 text-brand-primary">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            Synced (from MD Assets)
          </dd>
        </div>

        <div className="flex items-center gap-2">
          <dt className="text-slate-400 w-20 shrink-0">Endpoint</dt>
          <dd className="font-mono text-slate-400 text-xs truncate">{endpoint}</dd>
        </div>
      </dl>

      <p className="mt-3 text-slate-300 text-xs leading-relaxed">
        このプロジェクトには、あなたの「エンジニア・エージェント（仮）」が並行して接続されます。
      </p>

      <div
        aria-hidden
        className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-slate-400"
      >
        <span>接続中</span>
        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/70" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40" />
      </div>
    </section>
  );
}
