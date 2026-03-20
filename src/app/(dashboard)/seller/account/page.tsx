// src/app/(dashboard)/seller/account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { toast } from "sonner";
import { Loader2, Save, User, Mail, Store, FileText } from "lucide-react";

export default function SellerAccountPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: "",
    image: "",
    storeName: "",
    storeDescription: "",
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        setForm({
          name: d.user?.name || "",
          image: d.user?.image || "",
          storeName: d.user?.sellerProfile?.storeName || "",
          storeDescription: d.user?.sellerProfile?.storeDescription || "",
        });
        setFetching(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          image: form.image,
          sellerProfile: {
            storeName: form.storeName,
            storeDescription: form.storeDescription,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await update({ name: form.name, image: form.image });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-gray-900">Account Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Update your profile and store information</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <AvatarUpload
              currentImage={form.image}
              name={form.name}
              size={80}
              onUpload={(url) => setForm((f) => ({ ...f, image: url }))}
            />
            <div>
              <p className="text-sm font-medium text-gray-800">{form.name || "Your Name"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{session?.user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-black transition-colors"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-100 rounded-xl text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Store Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Store Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
                  placeholder="Your store name"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Store Description</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.storeDescription}
                  onChange={(e) => setForm((f) => ({ ...f, storeDescription: e.target.value }))}
                  placeholder="Describe your store..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-black transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}