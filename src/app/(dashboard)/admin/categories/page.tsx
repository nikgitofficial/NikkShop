// src/app/(dashboard)/admin/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Tag,
  Trash2,
  Loader2,
  Check,
  ArrowLeft,
  LayoutGrid,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [form, setForm]             = useState({ name: "", description: "", icon: "" });
  const [showForm, setShowForm]     = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setLoading(false);
      });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Category created successfully!");
      setCategories((c) => [...c, data.category]);
      setForm({ name: "", description: "", icon: "" });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create category. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Category deleted.");
      setCategories((c) => c.filter((cat) => cat._id !== id));
    } catch {
      toast.error("Failed to delete category. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  const activeCount   = categories.filter((c) => c.active).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div className="max-w-3xl mx-auto">
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
              Categories
            </h1>
            <p className="text-gray-400 text-sm mt-1.5">
              {categories.length > 0
                ? `${categories.length} categor${categories.length !== 1 ? "ies" : "y"} · ${activeCount} active${inactiveCount > 0 ? ` · ${inactiveCount} inactive` : ""}`
                : "Organize your products into categories"}
            </p>
          </div>

          <button
            onClick={() => setShowForm((v) => !v)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all shadow-sm mt-0.5",
              showForm
                ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                : "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
            )}
          >
            {showForm ? (
              <><X className="w-4 h-4" /> Cancel</>
            ) : (
              <><Plus className="w-4 h-4" /> Add Category</>
            )}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 leading-tight">New Category</h2>
              <p className="text-[11px] text-gray-400">Fill in the details below</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors"
                  placeholder="e.g. Electronics"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Icon <span className="text-gray-400 font-normal">(emoji)</span>
                </label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors"
                  placeholder="e.g. 📱"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors"
                placeholder="Brief description of this category…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl border border-gray-900 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {saving ? "Creating…" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm({ name: "", description: "", icon: "" }); }}
                className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition-all"
              >
                Discard
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl flex items-center justify-center py-24 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <p className="text-sm text-gray-400">Loading categories…</p>
          </div>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <Tag className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600">No categories yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Create your first category to start organizing products.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl px-3 py-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" /> Add Category
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* List header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800 leading-tight">All Categories</h2>
                <p className="text-[11px] text-gray-400">{categories.length} total</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                  {cat.icon || "🏷️"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.description}</p>
                  )}
                  <p className="text-[11px] text-gray-300 mt-0.5 font-mono">/{cat.slug}</p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {cat.productCount > 0 && (
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                      cat.active
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-gray-100 border-gray-200 text-gray-500"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        cat.active ? "bg-emerald-500" : "bg-gray-400"
                      )}
                    />
                    {cat.active ? "Active" : "Inactive"}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(cat._id)}
                    disabled={deleting === cat._id}
                    title="Delete category"
                    className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deleting === cat._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-gray-600">{activeCount}</span> active ·{" "}
              <span className="font-semibold text-gray-600">{inactiveCount}</span> inactive
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add new
            </button>
          </div>
        </div>
      )}
    </div>
  );
}