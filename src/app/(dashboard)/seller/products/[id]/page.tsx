// src/app/(dashboard)/seller/products/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ImageUploader, type UploadedImage } from "@/components/upload/ImageUploader";
import { ChevronRight, Save, Eye, Loader2, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CATEGORIES = [
  "Electronics", "Clothing & Apparel", "Home & Garden", "Sports & Outdoors",
  "Books & Media", "Toys & Games", "Health & Beauty", "Food & Beverage",
  "Art & Collectibles", "Automotive", "Baby & Kids", "Office Supplies",
  "Pet Supplies", "Tools & Hardware", "Jewelry & Accessories", "Other",
];

const inputClass = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "images" | "pricing" | "details">("basic");
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/seller/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          const p = d.product;
          setForm({
            name: p.name,
            description: p.description,
            price: String(p.price),
            compareAt: p.compareAt ? String(p.compareAt) : "",
            category: p.category,
            subcategory: p.subcategory || "",
            tags: (p.tags || []).join(", "),
            stock: String(p.stock),
            sku: p.sku || "",
            status: p.status,
            featured: p.featured,
            images: p.images || [],
          });
        }
        setLoading(false);
      });
  }, [id]);

  function set(key: string, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.images.length === 0) {
      toast.error("At least one image is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        compareAt: form.compareAt ? parseFloat(form.compareAt) : null,
        category: form.category,
        subcategory: form.subcategory || undefined,
        tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        stock: parseInt(form.stock) || 0,
        sku: form.sku || undefined,
        images: form.images,
        status: form.status,
        featured: form.featured,
      };
      const res = await fetch(`/api/seller/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Product updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this product permanently?")) return;
    const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Product deleted");
      router.push("/seller/products");
    } else {
      toast.error("Failed to delete");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  if (!form) return (
    <div className="text-center py-20 text-gray-400">Product not found.</div>
  );

  const tabs = ["basic", "images", "pricing", "details"] as const;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/seller/products" className="hover:text-gray-700 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Products
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 truncate max-w-[200px]">{form.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display text-gray-900">Edit Product</h1>
          <p className="text-gray-500 text-sm mt-1 truncate">{form.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm text-white font-medium rounded-xl bg-black hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl border border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 capitalize py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
            )}
          >
            {tab === "basic" ? "Basic Info" : tab === "pricing" ? "Pricing" : tab === "images" ? `Images (${form.images.length})` : "Details"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {/* BASIC */}
          {activeTab === "basic" && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea className={inputClass + " min-h-[160px] resize-y"} value={form.description} onChange={(e) => set("description", e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} required>
                    <option value="">Select...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input className={inputClass} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="comma-separated" />
                </div>
              </div>
            </div>
          )}

          {/* IMAGES */}
          {activeTab === "images" && (
            <div className="animate-fade-in">
              <p className="text-sm text-gray-400 mb-5">Manage product images. The starred image is the primary display image.</p>
              <ImageUploader value={form.images} onChange={(imgs) => set("images", imgs)} maxImages={8} />
            </div>
          )}

          {/* PRICING */}
          {activeTab === "pricing" && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                  <input type="number" step="0.01" min="0" className={inputClass} value={form.price} onChange={(e) => set("price", e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compare At</label>
                  <input type="number" step="0.01" min="0" className={inputClass} value={form.compareAt} onChange={(e) => set("compareAt", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                  <input type="number" min="0" className={inputClass} value={form.stock} onChange={(e) => set("stock", e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input className={inputClass} value={form.sku} onChange={(e) => set("sku", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* DETAILS */}
          {activeTab === "details" && (
            <div className="space-y-5 animate-fade-in">
              <label className={cn(
                "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                form.featured ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300"
              )}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="accent-black w-4 h-4"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Featured product</p>
                  <p className="text-xs text-gray-400">Show on homepage and featured sections</p>
                </div>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {["draft", "published", "archived"].map((s) => (
                    <label key={s} className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all capitalize text-sm",
                      form.status === s
                        ? "border-gray-400 bg-gray-50 text-gray-900 font-medium"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    )}>
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={form.status === s}
                        onChange={() => set("status", s)}
                        className="accent-black"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}