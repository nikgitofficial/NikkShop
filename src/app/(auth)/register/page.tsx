// src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Store, ShoppingBag, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "seller" ? "SELLER" : "USER";

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<"USER" | "SELLER">(defaultRole);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    storeName: "", storeDescription: "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (role === "SELLER" && !form.storeName.trim()) {
      toast.error("Store name is required for sellers");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("Account created!", {
        description: role === "SELLER"
          ? "Your seller account is pending admin approval"
          : "Welcome to NikkShop!",
      });
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-gray-400 text-sm">Join the NikkShop marketplace</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: "USER" as const, label: "Buyer", sub: "Shop products", icon: ShoppingBag },
            { value: "SELLER" as const, label: "Seller", sub: "Sell products", icon: Store },
          ].map(({ value, label, sub, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                role === value
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <Icon className={cn("w-5 h-5", role === value ? "text-gray-900" : "text-gray-400")} />
              <div>
                <p className={cn("text-sm font-semibold", role === value ? "text-gray-900" : "text-gray-500")}>
                  {label}
                </p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Name */}
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Full name"
              className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              minLength={2}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="Email address"
              className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password (min 8 chars)"
              className="w-full pl-10 pr-10 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Confirm password */}
          <input
            type="password"
            placeholder="Confirm password"
            className="w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            required
            minLength={8}
          />

          {/* Seller fields */}
          {role === "SELLER" && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Store Details
              </p>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Store name *"
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  value={form.storeName}
                  onChange={(e) => set("storeName", e.target.value)}
                  required={role === "SELLER"}
                />
              </div>
              <textarea
                placeholder="Store description (optional)"
                className="w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all min-h-[80px] resize-none"
                value={form.storeDescription}
                onChange={(e) => set("storeDescription", e.target.value)}
              />
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                ⚠️ Seller accounts require admin approval before you can publish products.
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Account
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-gray-900 font-semibold hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}