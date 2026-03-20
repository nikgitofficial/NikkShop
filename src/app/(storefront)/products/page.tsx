// src/app/(storefront)/products/page.tsx
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import { serializeDoc } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductsFilter } from "@/components/product/ProductsFilter";
import { SortSelect } from "./SortSelect";
import { SlidersHorizontal, Package, Search } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Products" };

type SearchParams = {
  category?: string; q?: string; sort?: string;
  minPrice?: string; maxPrice?: string;
  featured?: string; page?: string;
};

interface Props {
  searchParams: Promise<SearchParams>;
}

async function getData(params: SearchParams) {
  await connectDB();
  const page = Math.max(1, Number(params.page || 1));
  const limit = 16;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = { status: "published" };
  if (params.category) filter.category = { $regex: new RegExp(`^${params.category}$`, "i") };
  if (params.featured === "true") filter.featured = true;
  if (params.q) filter.$text = { $search: params.q };
  if (params.minPrice || params.maxPrice) {
    filter.price = {};
    if (params.minPrice) filter.price.$gte = Number(params.minPrice);
    if (params.maxPrice) filter.price.$lte = Number(params.maxPrice);
  }

  const sortMap: Record<string, any> = {
    newest: { createdAt: -1 }, oldest: { createdAt: 1 },
    "price-asc": { price: 1 }, "price-desc": { price: -1 },
    popular: { totalSold: -1 }, rating: { rating: -1 },
  };

  const [products, total, categories] = await Promise.all([
    Product.find(filter).sort(sortMap[params.sort || "newest"]).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
  ]);

  return {
    products: serializeDoc(products),
    total, page,
    totalPages: Math.ceil(total / limit),
    categories: serializeDoc(categories),
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { products, total, page, totalPages, categories } = await getData(params);

  const hasActiveFilters = params.q || params.category || params.minPrice || params.maxPrice || params.featured;

  const title = params.q
    ? `Results for "${params.q}"`
    : params.category
    ? params.category
    : params.featured === "true"
    ? "Featured Products"
    : "All Products";

  const start = ((page - 1) * 16) + 1;
  const end = Math.min(page * 16, total);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gray-700 transition-colors">Products</Link>
          {params.category && (
            <>
              <span>/</span>
              <span className="text-gray-700">{params.category}</span>
            </>
          )}
        </nav>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{title}</h1>
            <p className="text-gray-400 text-sm">
              {total === 0
                ? "No products found"
                : total === 1
                ? "1 product found"
                : `Showing ${start}–${end} of ${total.toLocaleString()} products`}
            </p>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {params.q && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium border border-gray-200">
                  Search: "{params.q}"
                  <Link
                    href={`/products?${new URLSearchParams(
                      Object.fromEntries(Object.entries(params).filter(([k]) => k !== "q") as [string, string][])
                    )}`}
                    className="text-gray-400 hover:text-gray-700 ml-0.5"
                  >✕</Link>
                </span>
              )}
              {params.featured && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium border border-gray-200">
                  ⭐ Featured
                  <Link
                    href={`/products?${new URLSearchParams(
                      Object.fromEntries(Object.entries(params).filter(([k]) => k !== "featured") as [string, string][])
                    )}`}
                    className="text-gray-400 hover:text-gray-700 ml-0.5"
                  >✕</Link>
                </span>
              )}
              <Link
                href="/products"
                className="text-xs text-red-500 hover:text-red-600 font-medium underline underline-offset-2"
              >
                Clear all
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar */}
        <aside className="lg:w-52 flex-shrink-0">
          <ProductsFilter categories={categories} searchParams={params} />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <SlidersHorizontal className="w-4 h-4" />
              <span>
                {total === 0 ? "No results" : `${total.toLocaleString()} result${total !== 1 ? "s" : ""}`}
              </span>
            </div>
            <SortSelect defaultValue={params.sort || "newest"} />
          </div>

          {/* Empty state */}
          {products.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 border border-gray-100 rounded-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                {params.q ? (
                  <Search className="w-7 h-7 text-gray-300" />
                ) : (
                  <Package className="w-7 h-7 text-gray-300" />
                )}
              </div>
              <h3 className="text-base font-semibold text-gray-500 mb-1">No products found</h3>
              <p className="text-sm text-gray-400 mb-6">
                {params.q
                  ? `No results for "${params.q}". Try different keywords.`
                  : "Try adjusting your filters to find what you're looking for."}
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              {/* Product grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p: any) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-400">
                      Page {page} of {totalPages}
                    </p>
                    <p className="text-sm text-gray-400">
                      Showing {start}–{end} of {total.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5">
                    {/* Previous */}
                    {page > 1 ? (
                      <Link
                        href={`/products?${new URLSearchParams({
                          ...Object.fromEntries(
                            Object.entries(params).filter(([, v]) => v) as [string, string][]
                          ),
                          page: String(page - 1),
                        })}`}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        ←
                      </Link>
                    ) : (
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-gray-300 border border-gray-100 bg-gray-50 cursor-not-allowed">
                        ←
                      </span>
                    )}

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        // Show first, last, current ±2, and ellipsis placeholders
                        return p === 1 || p === totalPages || Math.abs(p - page) <= 2;
                      })
                      .reduce((acc: (number | string)[], p, idx, arr) => {
                        if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) {
                          acc.push("...");
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === "..." ? (
                          <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-sm text-gray-400">
                            …
                          </span>
                        ) : (
                          <Link
                            key={p}
                            href={`/products?${new URLSearchParams({
                              ...Object.fromEntries(
                                Object.entries(params).filter(([, v]) => v) as [string, string][]
                              ),
                              page: String(p),
                            })}`}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all border ${
                              p === page
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {p}
                          </Link>
                        )
                      )}

                    {/* Next */}
                    {page < totalPages ? (
                      <Link
                        href={`/products?${new URLSearchParams({
                          ...Object.fromEntries(
                            Object.entries(params).filter(([, v]) => v) as [string, string][]
                          ),
                          page: String(page + 1),
                        })}`}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        →
                      </Link>
                    ) : (
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-gray-300 border border-gray-100 bg-gray-50 cursor-not-allowed">
                        →
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}