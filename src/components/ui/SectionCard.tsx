import type { ReactNode } from "react";

interface SectionCardProps {
  /** Card heading shown in the top-left of the card. */
  title: ReactNode;
  /** Optional element rendered inline to the right of the title (badge, link). */
  trailing?: ReactNode;
  /** Body of the card. */
  children: ReactNode;
  /** Optional extra utility classes appended to the wrapper. */
  className?: string;
  /** Optional id used to link the heading via aria-labelledby. */
  id?: string;
}

/**
 * Unified card wrapper for /projects/[id] sections.
 *
 * Visual contract (Water Guild v3):
 *   - rounded-2xl border border-white/10 bg-[#162035]
 *   - p-5 sm:p-6, mb-4 spacing
 *   - Left rail: 4px cyan-400 vertical bar + pl-3 to align body
 *   - Heading: text-white font-semibold text-base sm:text-lg
 */
export function SectionCard({ title, trailing, children, className = "", id }: SectionCardProps) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      data-component="section-card"
      aria-labelledby={headingId}
      className={`rounded-2xl border border-white/10 bg-[#162035] p-5 sm:p-6 mb-4 ${className}`.trim()}
    >
      <div className="border-l-4 border-cyan-400 pl-3">
        <header className="flex items-center justify-between gap-3 mb-3">
          <h2
            id={headingId}
            className="text-white font-semibold text-base sm:text-lg leading-snug"
          >
            {title}
          </h2>
          {trailing}
        </header>
        <div>{children}</div>
      </div>
    </section>
  );
}
