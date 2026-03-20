// src/app/(dashboard)/admin/products/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Search,
  Package,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  X,
} from "lucide-react";
import { formatPrice, formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STATUS_STYLE: Record<string, { pill: string; dot: string; label: string }> = {
  published: { pill: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500", label: "Published" },
  draft:     { pill: "bg-gray-100 border-gray-200 text-gray-500",         dot: "bg-gray-400",   label: "Draft" },
  archived:  { pill: "bg-amber-50 border-amber-200 text-amber-700",       dot: "bg-amber-400",  label: "Archived" },
  pending:   { pill: "bg-blue-50 border-blue-200 text-blue-700",          dot: "bg-blue-500",   label: "Pending" },
};

const STATUS_FILTERS = [
  { value: "all",       label: "All" },
  { value: "published", label: "Published" },
  { value: "draft",     label: "Draft" },
  { value: "archived",  label: "Archived" },
];

export default function AdminProductsPage() {
  const [products, setProducts]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("q", search);
    const res  = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  async function toggleStatus(product: any) {
    const newStatus = product.status === "published" ? "draft" : "published";
    setActioning(product._id);
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Product ${newStatus === "published" ? "published" : "unpublished"} successfully`);
      fetchProducts();
    } catch {
      toast.error("Failed to update product status. Please try again.");
    }
    setActioning(null);
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return;
    setActioning(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`"${name}" has been deleted.`);
      setProducts((p) => p.filter((x) => x._id !== id));
    } catch {
      toast.error("Failed to delete product. Please try again.");
    }
    setActioning(null);
  }

  const stats = {
    total:     products.length,
    published: products.filter((p) => p.status === "published").length,
    draft:     products.filter((p) => p.status === "draft").length,
    archived:  products.filter((p) => p.status === "archived").length,
  };

  const hasSearch = search.trim().length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 leading-tight">
              All Products
            </h1>
            <p className="text-gray-400 text-sm mt-1.5">
              {products.length > 0
                ? `${products.length.toLocaleString()} product${products.length !== 1 ? "s" : ""} from all sellers`
                : "Manage products across all sellers"}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",     value: stats.total,     color: "text-gray-800",    bg: "bg-white border-gray-200",             iconBg: "bg-gray-100" },
          { label: "Published", value: stats.published, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200",     iconBg: "bg-emerald-100" },
          { label: "Draft",     value: stats.draft,     color: "text-gray-500",    bg: "bg-gray-50 border-gray-200",           iconBg: "bg-gray-200" },
          { label: "Archived",  value: stats.archived,  color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",         iconBg: "bg-amber-100" },
        ].map(({ label, value, color, bg, iconBg }) => (
          <div key={label} className={`border rounded-2xl p-4 shadow-sm ${bg}`}>
            <p className="text-xs font-semibold text-gray-400 mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-xl pl-10 pr-9 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-colors shadow-sm"
            placeholder="Search by product name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {hasSearch && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-shrink-0">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium border transition-all shadow-sm",
                statusFilter === value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl flex items-center justify-center py-24 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <p className="text-sm text-gray-400">Loading products…</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600">No products found</p>
          <p className="text-xs text-gray-400 mt-1">
            {hasSearch
              ? `No products match "${search}". Try a different search.`
              : statusFilter !== "all"
              ? `No products with status "${statusFilter}".`
              : "No products have been listed yet."}
          </p>
          {(hasSearch || statusFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setStatus("all"); }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 transition-colors"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {["Product", "Seller", "Status", "Price", "Stock", "Listed", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 first:pl-5 last:pr-5 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const img   = product.images?.find((i: any) => i.isPrimary) || product.images?.[0];
                  const style = STATUS_STYLE[product.status] || STATUS_STYLE["draft"];
                  const isActioning = actioning === product._id;

                  return (
                    <tr key={product._id} className="hover:bg-gray-50/60 transition-colors group">

                      {/* Product */}
                      <td className="px-4 py-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            {img?.url ? (
                              <Image
                                src={img.url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 line-clamp-1 max-w-[180px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* Seller */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-gray-600 truncate max-w-[120px]">
                          {product.sellerStoreName || product.sellerName}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                          style.pill
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)} />
                          {style.label}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-gray-800">{formatPrice(product.price)}</p>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "text-sm font-semibold",
                          product.stock === 0
                            ? "text-red-500"
                            : product.stock < 5
                            ? "text-amber-600"
                            : "text-gray-600"
                        )}>
                          {product.stock === 0 ? "Out of stock" : product.stock}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-400 whitespace-nowrap">
                          {formatRelative(product.createdAt)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 pr-5">
                        <div className="flex items-center gap-1.5">
                          {/* Publish / Unpublish */}
                          <button
                            onClick={() => toggleStatus(product)}
                            disabled={isActioning}
                            title={product.status === "published" ? "Unpublish" : "Publish"}
                            className={cn(
                              "p-1.5 rounded-lg border transition-colors disabled:opacity-40",
                              product.status === "published"
                                ? "bg-gray-50 border-gray-200 text-gray-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600"
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
                            )}
                          >
                            {isActioning ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : product.status === "published" ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteProduct(product._id, product.name)}
                            disabled={isActioning}
                            title="Delete product"
                            className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-600">{products.length}</span>{" "}
              product{products.length !== 1 ? "s" : ""}
              {(hasSearch || statusFilter !== "all") && (
                <>
                  {" "}·{" "}
                  <button
                    onClick={() => { setSearch(""); setStatus("all"); }}
                    className="text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
                  >
                    clear filters
                  </button>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400">Changes save automatically</p>
          </div>
        </div>
      )}
    </div>
  );
}