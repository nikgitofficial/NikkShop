// src/app/(dashboard)/seller/products/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, Package, Edit, Trash2, Eye, EyeOff,
  Search, TrendingUp, Loader2
} from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";
import { CurrencySwitcher } from "@/components/analytics/CurrencySwitcher";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-500",
  archived: "bg-amber-100 text-amber-700",
  pending: "bg-blue-100 text-blue-700",
};

function SellerProductsInner() {
  const { format } = useCurrency();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/seller/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleStatus(product: any) {
    const newStatus = product.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/seller/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Product ${newStatus === "published" ? "published" : "unpublished"}`);
      fetchProducts();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Product deleted");
      setProducts((p) => p.filter((x) => x._id !== id));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  const stats = {
    total: products.length,
    published: products.filter((p) => p.status === "published").length,
    draft: products.filter((p) => p.status === "draft").length,
    totalViews: products.reduce((s, p) => s + (p.views || 0), 0),
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display text-gray-900">My Products</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your product listings</p>
        </div>
        {/* Currency switcher + Add Product — mirrors the analytics header */}
        <div className="flex items-center gap-2">
          <CurrencySwitcher />
          <Link
            href="/seller/products/new"
            className="flex items-center gap-2 px-5 py-2.5 text-sm text-white font-medium rounded-xl bg-black hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900" },
          { label: "Published", value: stats.published, color: "text-emerald-600" },
          { label: "Drafts", value: stats.draft, color: "text-amber-600" },
          { label: "Total Views", value: stats.totalViews.toLocaleString(), color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            placeholder="Search your products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-40 px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-display text-gray-400 mb-2">No products yet</h3>
          <p className="text-sm text-gray-400 mb-6">Create your first product listing to start selling</p>
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-white font-medium rounded-xl bg-black hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create First Product
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Product", "Status", "Price", "Stock", "Views", "Created", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((product) => {
                  const primaryImg = product.images?.find((i: any) => i.isPrimary) || product.images?.[0];
                  return (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {primaryImg?.url ? (
                              <Image src={primaryImg.url} alt={product.name} fill className="object-cover" sizes="44px" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gray-400">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_STYLES[product.status] || "bg-gray-100 text-gray-500")}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {/* format() from useCurrency — converts + formats with correct symbol */}
                          <p className="text-sm font-semibold text-gray-800">{format(product.price)}</p>
                          {product.compareAt && (
                            <p className="text-xs text-gray-400 line-through">{format(product.compareAt)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-sm font-medium",
                          product.stock === 0 ? "text-red-500" :
                          product.stock < 5 ? "text-amber-500" :
                          "text-gray-700"
                        )}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {(product.views || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatRelative(product.createdAt)}</td>
                      <td className="px-4 py-3 pr-5">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/seller/products/${product._id}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => toggleStatus(product)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                            title={product.status === "published" ? "Unpublish" : "Publish"}
                          >
                            {product.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteProduct(product._id, product.name)}
                            disabled={deleting === product._id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === product._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Outer export wraps with CurrencyProvider so useCurrency() works inside
import { CurrencyProvider } from "@/context/CurrencyContext";

export default function SellerProductsPage() {
  return (
    <CurrencyProvider>
      <SellerProductsInner />
    </CurrencyProvider>
  );
}