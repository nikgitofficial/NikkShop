// src/app/(storefront)/search/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Package } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q.trim())}&limit=24`);
        const data = await res.json();
        setResults(data.products || []);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounce.current);
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-14">
        <h1 className="text-4xl font-display text-gray-900 text-center mb-8">Search Products</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
          )}
          <input
            autoFocus
            className="w-full h-14 pl-12 pr-12 bg-white border border-gray-200 rounded-2xl text-gray-900 text-base placeholder:text-gray-400 outline-none transition-all focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] shadow-sm"
            placeholder="Search for products, categories, sellers…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      {!q.trim() && (
        <div className="text-center py-16 text-gray-300">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg text-gray-400">Start typing to search</p>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            No results for "<span className="text-gray-700">{q}</span>"
          </p>
          <p className="text-gray-400 text-sm">Try different keywords or browse categories</p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} for "
            <span className="text-gray-700">{q}</span>"
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}