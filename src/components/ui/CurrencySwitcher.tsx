// src/components/ui/CurrencySwitcher.tsx
"use client";

import { useCurrency } from "@/context/CurrencyContext";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CurrencySwitcher() {
  const { currency, setCurrency, loading } = useCurrency();

  return (
    <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5 bg-gray-50">
      {(["USD", "PHP"] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
            currency === c
              ? "bg-black text-white"
              : "text-gray-500 hover:text-gray-800"
          )}
        >
          {c === "USD" ? "$ USD" : "₱ PHP"}
        </button>
      ))}
      {loading && <Loader2 className="w-3 h-3 animate-spin text-gray-400 mr-1" />}
    </div>
  );
}