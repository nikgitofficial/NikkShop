// src/components/product/ProductsFilter.tsx
"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  categories: any[];
  searchParams: Record<string, string | undefined>;
}

export function ProductsFilter({ categories, searchParams }: Props) {
  const router = useRouter();

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== key && k !== "page") params.set(k, v);
    });
    if (value) params.set(key, value);
    router.push(`/products?${params.toString()}`);
  }, [searchParams, router]);

  const PRICE_RANGES = [
    { label: "Under $25", min: "", max: "25" },
    { label: "$25 – $50", min: "25", max: "50" },
    { label: "$50 – $100", min: "50", max: "100" },
    { label: "$100 – $250", min: "100", max: "250" },
    { label: "Over $250", min: "250", max: "" },
  ];

  const activeFilters = Object.entries(searchParams).filter(
    ([k, v]) => v && k !== "sort" && k !== "page"
  ).length;

  return (
    <div className="space-y-6">
      {/* Active filters */}
      {activeFilters > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Filters</span>
            <button
              onClick={() => router.push("/products")}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-medium"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {searchParams.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black text-white text-xs font-medium">
                {searchParams.category}
                <button onClick={() => updateFilter("category", null)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {(searchParams.minPrice || searchParams.maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black text-white text-xs font-medium">
                Price range
                <button onClick={() => { updateFilter("minPrice", null); updateFilter("maxPrice", null); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          <Tag className="w-3.5 h-3.5" /> Categories
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => updateFilter("category", null)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-all font-medium",
              !searchParams.category
                ? "bg-black text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => updateFilter("category", cat.name)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between font-medium",
                searchParams.category === cat.name
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <span>{cat.name}</span>
              {cat.productCount > 0 && (
                <span className={cn("text-xs", searchParams.category === cat.name ? "text-white/60" : "text-gray-400")}>
                  {cat.productCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Price Range</div>
        <div className="space-y-0.5">
          {PRICE_RANGES.map(({ label, min, max }) => {
            const isActive = searchParams.minPrice === min && searchParams.maxPrice === max;
            return (
              <button
                key={label}
                onClick={() => {
                  const params = new URLSearchParams();
                  Object.entries(searchParams).forEach(([k, v]) => {
                    if (v && k !== "minPrice" && k !== "maxPrice" && k !== "page") params.set(k, v);
                  });
                  if (min) params.set("minPrice", min);
                  if (max) params.set("maxPrice", max);
                  router.push(`/products?${params.toString()}`);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-all font-medium",
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured */}
      <div>
        <button
          onClick={() => updateFilter("featured", searchParams.featured ? null : "true")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border font-medium",
            searchParams.featured
              ? "bg-black text-white border-black"
              : "border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <span className="text-base">⭐</span>
          Featured Only
        </button>
      </div>
    </div>
  );
}