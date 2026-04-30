import Link from "next/link";
import { messages } from "@/lib/microcopy";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="text-6xl" aria-hidden>🔍</div>
      </div>
      <h1 className="text-2xl font-bold text-white leading-snug max-w-sm">
        {messages.notFound.heading}
      </h1>
      <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
        {messages.notFound.body}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link href="/marketplace" className="btn-primary">
          {messages.notFound.ctaMarketplace}
        </Link>
        <Link href="/" className="btn-secondary">
          {messages.notFound.ctaHome}
        </Link>
      </div>
    </main>
  );
}
