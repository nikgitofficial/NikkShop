"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useCurrency } from "@/context/CurrencyContext";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId   = searchParams.get("order_id");
  const method    = searchParams.get("method");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const clearCart = useCartStore((s) => s.clearCart);
  const { format } = useCurrency();

  useEffect(() => {
    clearCart();

    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((r) => r.json())
        .then((d) => { setOrder(d.order); setLoading(false); });
      return;
    }

    if (sessionId) {
      fetch(`/api/orders/by-session?session_id=${sessionId}`)
        .then((r) => r.json())
        .then((d) => { setOrder(d.order); setLoading(false); });
      return;
    }

    setLoading(false);
  }, [sessionId, orderId]);

  // ✅ Show last 8 chars uppercase — matches "Order #EF8D8900" format on orders page
  const shortId = (id: string) => id?.slice(-8).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-100 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative">
        {/* Check icon */}
        <div className="w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
        <p className="text-gray-500 text-lg mb-10">
          {method === "cod"
            ? "Your order has been placed. Please prepare payment upon delivery."
            : "Thank you for your purchase. You'll receive a confirmation email shortly."}
        </p>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading order details...</span>
          </div>
        )}

        {order && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden text-left mb-8 shadow-sm">
            {/* Order ID + Status */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-1">Order ID</p>
                {/* ✅ Matches orders page format: Order #EF8D8900 */}
                <p className="font-mono text-sm font-semibold text-gray-800">
                  Order #{shortId(order._id)}
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                {order.status}
              </span>
            </div>

            {/* COD notice */}
            {method === "cod" && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-xs text-amber-600 font-medium">
                  💵 Cash on Delivery — please have the exact amount ready.
                </p>
              </div>
            )}

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {order.items?.map((item: any) => (
                <div key={item.productId} className="flex justify-between items-center px-5 py-3">
                  <div>
                    <p className="text-sm text-gray-800 font-medium">{item.productName}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {format(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center px-5 py-4 border-t border-gray-100 bg-gray-50">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="text-xl font-bold text-gray-900">{format(order.total)}</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/orders"
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-all"
          >
            <Package className="w-4 h-4" /> View Orders
          </Link>
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}