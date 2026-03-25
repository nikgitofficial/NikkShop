// src/app/loading.tsx
import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">

        {/* Logo + name side by side — on top */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="NikkShop"
            width={130}
            height={40}
            priority
            className="object-contain h-9 w-auto"
          />
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            NikkShop
          </span>
        </div>

        {/* Spinner below */}
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />

        {/* Loading text at bottom */}
        <p className="text-gray-400 text-sm">Loading…</p>

      </div>
    </div>
  );
}