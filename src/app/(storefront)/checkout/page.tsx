// src/app/(storefront)/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Lock, ShieldCheck, ArrowLeft, Truck, CreditCard } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cod">("stripe");
  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "",
    address: "", address2: "", city: "", state: "", zip: "", country: "PH",
  });

  const subtotal = totalPrice();
  const shipping = subtotal < 75 ? 8.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // ✅ Fix 1: router.replace moved out of render into useEffect
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  // Prevent rendering the form while redirecting
  if (items.length === 0) return null;

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (paymentMethod === "cod") {
        const res = await fetch("/api/orders/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, form, subtotal, shipping, tax, total }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to place order");
        clearCart();
        router.push(`/checkout/success?order_id=${data.orderId}&method=cod`);
      } else {
        const res = await fetch("/api/payments/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, form, subtotal, shipping, tax, total }),
        });
        const data = await res.json();
        // ✅ Fix 2: guard window for SSR
        if (data.url) {
          if (typeof window !== "undefined") {
            window.location.href = data.url;
          }
        } else {
          throw new Error(data.error || "Failed to create checkout session");
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to cart
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <input className="input-field" type="email" placeholder="Email address" value={form.email} onChange={(e) => field("email", e.target.value)} required />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="First name" value={form.firstName} onChange={(e) => field("firstName", e.target.value)} required />
                <input className="input-field" placeholder="Last name" value={form.lastName} onChange={(e) => field("lastName", e.target.value)} required />
              </div>
              <input className="input-field" placeholder="Street address" value={form.address} onChange={(e) => field("address", e.target.value)} required />
              <input className="input-field" placeholder="Apartment, suite, etc. (optional)" value={form.address2} onChange={(e) => field("address2", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="City" value={form.city} onChange={(e) => field("city", e.target.value)} required />
                <input className="input-field" placeholder="State / Province" value={form.state} onChange={(e) => field("state", e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="ZIP / Postal code" value={form.zip} onChange={(e) => field("zip", e.target.value)} required />
                <select className="input-field" value={form.country} onChange={(e) => field("country", e.target.value)}>
                  {[["US","United States"],["CA","Canada"],["GB","United Kingdom"],["PH","Philippines"],["AU","Australia"],["SG","Singapore"]].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                  paymentMethod === "stripe" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <CreditCard className="w-5 h-5 flex-shrink-0 text-gray-700" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Card / Stripe</p>
                  <p className="text-xs text-gray-400">Pay securely online</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                  paymentMethod === "cod" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Truck className="w-5 h-5 flex-shrink-0 text-gray-700" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                  <p className="text-xs text-gray-400">Pay when you receive</p>
                </div>
              </button>
            </div>

            {paymentMethod === "cod" && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                Your order will be placed immediately. Please have the exact amount ready upon delivery.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-black text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-gray-800 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" />
              : paymentMethod === "cod" ? <Truck className="w-5 h-5" />
              : <Lock className="w-5 h-5" />}
            {loading
              ? paymentMethod === "cod" ? "Placing order…" : "Redirecting to Stripe…"
              : paymentMethod === "cod" ? `Place Order · ${formatPrice(total)}` : `Pay ${formatPrice(total)}`}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            {paymentMethod === "cod" ? "Your order details are safe and encrypted" : "Secured by Stripe · 256-bit SSL encryption"}
          </div>
        </form>

        {/* Order summary */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-5">
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 p-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />}
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-[10px] font-bold text-white flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400">by {item.sellerName}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 text-sm">
            {[
              { label: "Subtotal", value: formatPrice(subtotal) },
              { label: "Shipping", value: shipping === 0 ? "Free" : formatPrice(shipping), color: shipping === 0 ? "text-emerald-500" : "" },
              { label: "Tax (8%)", value: formatPrice(tax) },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-gray-500">
                <span>{label}</span>
                <span className={cn("font-medium text-gray-900", color)}>{value}</span>
              </div>
            ))}
            <div className="my-2 h-px bg-gray-100" />
            <div className="flex justify-between font-bold text-lg">
              <span className="text-gray-700">Total</span>
              <span className="text-gray-900">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}