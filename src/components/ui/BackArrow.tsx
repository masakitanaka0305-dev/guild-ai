import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Back arrow used as the leading affordance on detail pages.
 *
 * Pure geometry + cyan stroke — no character art, no animation.
 * Sits at min-h-[44px] / min-w-[44px] to satisfy the iOS Mercari-grade
 * tap-target rule on mobile.
 */
export interface BackArrowProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackArrow({
  href,
  label = "戻る",
  className = "",
}: BackArrowProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      data-testid="back-arrow"
      className={
        "inline-flex items-center justify-center min-h-[44px] min-w-[44px] " +
        "rounded-full text-[#22D3EE] hover:bg-white/5 active:bg-white/10 " +
        "outline-none focus:outline focus:outline-2 focus:outline-cyan-400 " +
        className
      }
    >
      <ArrowLeft strokeWidth={2.25} className="w-5 h-5 stroke-cyan-400" />
    </Link>
  );
}
