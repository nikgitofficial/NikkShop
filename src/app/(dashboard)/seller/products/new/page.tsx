// src/app/(dashboard)/seller/products/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUploader, type UploadedImage } from "@/components/upload/ImageUploader";
import {
  Package, DollarSign, Hash, FileText,
  ChevronRight, Save, Eye, Loader2, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Electronics", "Clothing & Apparel", "Home & Garden", "Sports & Outdoors",
  "Books & Media", "Toys & Games", "Health & Beauty", "Food & Beverage",
  "Art & Collectibles", "Automotive", "Baby & Kids", "Office Supplies",
  "Pet Supplies", "Tools & Hardware", "Jewelry & Accessories", "Other",
];

type FormState = {
  name: string; description: string; price: string; compareAt: string;
  category: string; subcategory: string; tags: string; stock: string;
  sku: string; status: "draft" | "published"; featured: boolean; images: UploadedImage[];
};

const EMPTY: FormState = {
  name: "", description: "", price: "", compareAt: "",
  category: "", subcategory: "", tags: "", stock: "0",
  sku: "", status: "draft", featured: false, images: [],
};

const inputClass = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "images" | "pricing" | "details">("basic");

  function set(key: keyof FormState, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent, asDraft = false) {
    e.preventDefault();
    if (form.images.length === 0) {
      toast.error("Please upload at least one product image");
      setActiveTab("images");
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
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        stock: parseInt(form.stock) || 0,
        sku: form.sku || undefined,
        images: form.images,
        status: asDraft ? "draft" : form.status,
        featured: form.featured,
      };
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      toast.success(asDraft ? "Product saved as draft!" : "Product published successfully!", { description: form.name });
      router.push("/seller/products");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

const tabs: {
  id: "basic" | "images" | "pricing" | "details";
  label: string;
  icon: React.ElementType;
  badge?: number;
}[] = [
  { id: "basic", label: "Basic Info", icon: FileText },
  { id: "images", label: "Images", icon: Package, badge: form.images.length || undefined },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "details", label: "Details", icon: Hash },
];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <span>Seller</span><ChevronRight className="w-3 h-3" />
        <span>Products</span><ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">New Product</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display text-gray-900">Create Product</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details to list your product on NikShop</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => submit(e, true)}
            disabled={saving || !form.name}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-40"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button
            type="button"
            onClick={(e) => { set("status", "published"); submit(e); }}
            disabled={saving || !form.name || form.images.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm text-white font-medium rounded-xl bg-black hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl border border-gray-200 mb-6">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === id
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:block">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">

          {/* BASIC INFO */}
          {activeTab === "basic" && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  className={inputClass + " text-base"}
                  placeholder="e.g. Premium Wireless Headphones"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  className={inputClass + " min-h-[160px] resize-y"}
                  placeholder="Describe your product in detail. Include key features, materials, dimensions..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  required
                />
                <p className="text-xs text-gray-400 mt-1.5">{form.description.length} / 5000 characters</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    required
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Headphones"
                    value={form.subcategory}
                    onChange={(e) => set("subcategory", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  className={inputClass}
                  placeholder="wireless, audio, noise-cancelling (comma-separated)"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1.5">Separate tags with commas. Tags help buyers find your product.</p>
              </div>
            </div>
          )}

          {/* IMAGES */}
          {activeTab === "images" && (
            <div className="animate-fade-in">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-800">Product Images *</h3>
                <p className="text-xs text-gray-400 mt-0.5">Upload up to 8 images. The first (starred) image is the primary display image.</p>
              </div>
              <ImageUploader
                value={form.images}
                onChange={(imgs) => set("images", imgs)}
                maxImages={8}
              />
            </div>
          )}

          {/* PRICING */}
          {activeTab === "pricing" && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number" step="0.01" min="0"
                      className={inputClass + " pl-9"}
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compare At Price
                    <span className="ml-2 text-xs text-gray-400">(original/crossed out)</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number" step="0.01" min="0"
                      className={inputClass + " pl-9"}
                      placeholder="0.00"
                      value={form.compareAt}
                      onChange={(e) => set("compareAt", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {form.price && form.compareAt && parseFloat(form.compareAt) > parseFloat(form.price) && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                    {Math.round(((parseFloat(form.compareAt) - parseFloat(form.price)) / parseFloat(form.compareAt)) * 100)}%
                  </div>
                  <p className="text-green-700">
                    Discount badge will show: <strong>{Math.round(((parseFloat(form.compareAt) - parseFloat(form.price)) / parseFloat(form.compareAt)) * 100)}% off</strong>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                  <input
                    type="number" min="0"
                    className={inputClass}
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => set("stock", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU (optional)</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. WH-001-BLK"
                    value={form.sku}
                    onChange={(e) => set("sku", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DETAILS */}
          {activeTab === "details" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                <label htmlFor="featured" className="flex flex-col cursor-pointer">
                  <span className="text-sm font-medium text-gray-800">Feature this product</span>
                  <span className="text-xs text-gray-400">Featured products appear on the homepage and get higher visibility</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Status</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["draft", "published"] as const).map((s) => (
                    <label key={s} className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                      form.status === s
                        ? "border-gray-400 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}>
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={form.status === s}
                        onChange={() => set("status", s)}
                        className="accent-black"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 capitalize">{s}</p>
                        <p className="text-xs text-gray-400">
                          {s === "draft" ? "Only visible to you" : "Visible to all buyers"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  After publishing, your product will be visible on the storefront immediately. You can edit or unpublish at any time from your product dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between mt-6">
          {activeTab !== "basic" ? (
            <button
              type="button"
              onClick={() => {
                const order = ["basic", "images", "pricing", "details"];
                setActiveTab(order[order.indexOf(activeTab) - 1] as any);
              }}
              className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all"
            >
              ← Back
            </button>
          ) : <div />}

          {activeTab !== "details" ? (
            <button
              type="button"
              onClick={() => {
                const order = ["basic", "images", "pricing", "details"];
                setActiveTab(order[order.indexOf(activeTab) + 1] as any);
              }}
              disabled={activeTab === "basic" && !form.name}
              className="px-5 py-2.5 text-sm text-white font-medium rounded-xl bg-black hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving || form.images.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-sm text-white font-medium rounded-xl bg-black hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {form.status === "published" ? "Publish Product" : "Save Draft"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}