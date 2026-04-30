import Link from "next/link";
import { Hexagon } from "@/components/ui/Hexagon";

/**
 * EmptyState — the void as a quiet hex.
 *
 * Used when a list is genuinely empty (e.g. zero registered MDs).
 * Centered, role="status", with a single primary CTA. Geometry only —
 * no character art, no animation.
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      role="status"
      data-testid="empty-state"
      className={
        "flex flex-col items-center justify-center text-center px-6 py-12 " +
        "bg-[#162035] border border-white/10 rounded-2xl " +
        className
      }
    >
      <span aria-hidden className="mb-4">
        <Hexagon size={64} fill="transparent" stroke="#22D3EE" strokeWidth={1.5} />
      </span>
      <p className="text-base font-semibold text-white tracking-tight mb-1">
        {title}
      </p>
      {description && (
        <p className="text-xs text-slate-400 mb-4 max-w-xs">{description}</p>
      )}
      <Link
        href={ctaHref}
        aria-label={ctaLabel}
        className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-full bg-[#22D3EE] text-[#0B1121] text-sm font-bold hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-cyan-400"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
