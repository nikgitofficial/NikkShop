// src/app/(storefront)/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  refunded: "bg-gray-100 text-gray-500",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-4xl font-display text-gray-900 mb-2">My Orders</h1>
      <p className="text-gray-500 text-sm mb-10">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <Package className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-display text-gray-400 mb-2">No orders yet</h3>
          <p className="text-gray-400 text-sm mb-6">Your orders will appear here after checkout</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-gray-300 transition-colors">
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpanded(expanded === order._id ? null : order._id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-400 font-mono mb-0.5">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm font-medium text-gray-700">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize", STATUS_STYLE[order.status] || "bg-gray-100 text-gray-500")}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-gray-900">{formatPrice(order.total)}</span>
                  <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", expanded === order._id && "rotate-90")} />
                </div>
              </button>

              {/* Expanded items */}
              {expanded === order._id && (
                <div className="border-t border-gray-100 animate-fade-in">
                  <div className="divide-y divide-gray-100">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.productImage && (
                            <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="48px" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                          <p className="text-xs text-gray-400">by {item.sellerName} · Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order totals */}
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-1.5 text-sm">
                    {[
                      { label: "Subtotal", value: formatPrice(order.subtotal) },
                      { label: "Shipping", value: order.shipping === 0 ? "Free" : formatPrice(order.shipping) },
                      { label: "Tax", value: formatPrice(order.tax) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-gray-500">
                        <span>{label}</span><span>{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                      <span>Total</span><span>{formatPrice(order.total)}</span>
                    </div>
                  </div>

                  {/* Shipping address */}
                  {order.shippingAddress && (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Shipped to</p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.name} · {order.shippingAddress.line1}
                        {order.shippingAddress.city && `, ${order.shippingAddress.city}`}
                        {order.shippingAddress.country && `, ${order.shippingAddress.country}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}