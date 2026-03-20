// src/app/(storefront)/account/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Package, LogOut, Store, ShieldCheck, ChevronRight, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { toast } from "sonner";

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", image: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/account");
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        image: session.user.image || "",
      });
    }
  }, [session]);

  if (status === "loading") return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
    </div>
  );

  if (!session) return null;
  const user = session.user as any;
  const role = user.role;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, image: form.image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await update({ name: form.name, image: form.image });
      toast.success("Profile updated!");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const menuItems = [
    { href: "/orders", label: "My Orders", sub: "View order history", icon: Package },
    ...(role === "SELLER" ? [{ href: "/seller", label: "Seller Dashboard", sub: "Manage your products", icon: Store }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin Panel", sub: "Platform management", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-display text-gray-900">My Account</h1>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
            editing
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
           editing ? <Save className="w-4 h-4" /> :
           <User className="w-4 h-4" />}
          {saving ? "Saving..." : editing ? "Save Changes" : "Edit Profile"}
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-5">
          {/* Avatar — editable when in edit mode */}
          {editing ? (
            <AvatarUpload
              currentImage={form.image}
              name={form.name}
              size={72}
              onUpload={(url) => setForm((f) => ({ ...f, image: url }))}
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
              {user.image ? (
                <img src={form.image || user.image} alt={user.name || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold text-2xl">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full text-lg font-medium text-gray-900 border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:border-black transition-colors mb-1"
                placeholder="Your name"
              />
            ) : (
              <h2 className="text-xl font-display text-gray-900 truncate">{user.name ?? "User"}</h2>
            )}
            <p className="text-gray-500 text-sm truncate">{user.email}</p>
            <span className={cn(
              "inline-flex items-center mt-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider",
              role === "ADMIN" ? "bg-purple-100 text-purple-700" :
              role === "SELLER" ? "bg-amber-100 text-amber-700" :
              "bg-gray-100 text-gray-500"
            )}>
              {role}
            </span>
          </div>
        </div>

        {editing && (
          <p className="text-xs text-gray-400 mt-4 text-center">
            Click the camera icon to change your photo · JPG, PNG, WebP up to 5MB
          </p>
        )}
      </div>

      {/* Menu items */}
      <div className="space-y-2 mb-6">
        {menuItems.map(({ href, label, sub, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 bg-white border border-gray-200 hover:border-gray-300 rounded-2xl transition-all hover:bg-gray-50 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex w-full items-center justify-center gap-2.5 py-3.5 bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-2xl transition-all text-sm font-medium shadow-sm"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}