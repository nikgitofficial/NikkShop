// src/app/(storefront)/checkout/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
    if (!sessionId) { setLoading(false); return; }
    fetch(`/api/orders/by-session?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d.order); setLoading(false); });
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>

        <h1 className="text-4xl font-display text-white mb-3 animate-slide-up">Order Confirmed!</h1>
        <p className="text-white/50 text-lg mb-10 animate-slide-up animation-delay-100">
          Thank you for your purchase. You'll receive a confirmation email shortly.
        </p>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-white/40 mb-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading order details...</span>
          </div>
        )}

        {order && (
          <div className="glass border border-white/[0.08] rounded-2xl overflow-hidden text-left mb-8 animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <p className="text-xs text-white/30 mb-1">Order ID</p>
                <p className="font-mono text-sm text-white/70">{order._id}</p>
              </div>
              <span className="badge-green px-3 py-1 rounded-full text-xs font-semibold capitalize">
                {order.status}
              </span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {order.items?.map((item: any) => (
                <div key={item.productId} className="flex justify-between items-center px-5 py-3">
                  <div>
                    <p className="text-sm text-white/80">{item.productName}</p>
                    <p className="text-xs text-white/30">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-white/70">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-5 py-4 border-t border-white/[0.06]">
              <span className="font-semibold text-white/80">Total</span>
              <span className="text-xl font-bold text-white">{formatPrice(order.total)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up animation-delay-200">
          <Link href="/orders" className="flex items-center justify-center gap-2 px-7 py-3.5 glass border border-white/[0.1] hover:border-white/20 text-white/70 hover:text-white rounded-xl text-sm transition-all">
            <Package className="w-4 h-4" /> View Orders
          </Link>
          <Link href="/products" className="btn-glow flex items-center justify-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl text-sm">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
