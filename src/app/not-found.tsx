// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative">
          <p className="text-8xl font-display text-white/5 select-none mb-4 leading-none">404</p>
          <h1 className="text-3xl font-display text-white mb-3 -mt-8">Page not found</h1>
          <p className="text-white/40 mb-10">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            href="/"
            className="btn-glow inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
