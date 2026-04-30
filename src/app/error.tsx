"use client";

import { useEffect } from "react";
import Link from "next/link";
import { messages } from "@/lib/microcopy";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring in production
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl mb-6" aria-hidden>🌧️</div>
      <h1 className="text-2xl font-bold text-white leading-snug max-w-sm">
        {messages.serverError.heading}
      </h1>
      <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
        {messages.serverError.body}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button onClick={reset} className="btn-primary">
          {messages.serverError.ctaRetry}
        </button>
        <Link href="/" className="btn-secondary">
          {messages.serverError.ctaHome}
        </Link>
      </div>
    </main>
  );
}
