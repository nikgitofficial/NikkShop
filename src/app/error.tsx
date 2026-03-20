// src/app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative">
          <h2 className="text-3xl font-display text-white mb-3">Something went wrong</h2>
          <p className="text-white/40 mb-8 max-w-sm mx-auto">
            An unexpected error occurred. Please try again.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="btn-glow px-6 py-3 text-white font-medium rounded-xl text-sm"
            >
              Try again
            </button>
            <Link
              href="/"
              className="glass border border-white/[0.1] hover:border-white/20 px-6 py-3 text-white/70 hover:text-white rounded-xl text-sm transition-all"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
