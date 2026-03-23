// src/components/analytics/CurrencySwitcher.tsx
"use client";

import { useCurrency } from "@/context/CurrencyContext";

export function CurrencySwitcher() {
  const { currency, setCurrency, loading } = useCurrency();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 text-sm font-medium">
      <button
        onClick={() => setCurrency("USD")}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
          currency === "USD"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <span>🇺🇸</span> USD
      </button>
      <button
        onClick={() => setCurrency("PHP")}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
          currency === "PHP"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <span>🇵🇭</span> PHP
        {loading && (
          <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
      </button>
    </div>
  );
}