// src/app/(dashboard)/seller/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart, Loader2, ChevronRight, Phone,
  Hash, Calendar, User, MapPin, Package, CreditCard, Tag, Truck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useCurrency } from "@/context/CurrencyContext";
import { CurrencySwitcher } from "@/components/analytics/CurrencySwitcher";
import { CurrencyProvider } from "@/context/CurrencyContext";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  refunded: "bg-gray-100 text-gray-500",
};

function SellerOrdersInner() {
  const { data: session } = useSession();
  const { format } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/seller/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); });
  }, [session]);

  const sellerId = session?.user?.id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Orders containing your products</p>
        </div>
        <CurrencySwitcher />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-display text-gray-400 mb-2">No orders yet</h3>
          <p className="text-sm text-gray-400">Publish products to start receiving orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const myItems = order.items?.filter((i: any) => i.sellerId === sellerId) || [];
            const myTotal = myItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
            const isOpen = expanded === order._id;

            return (
              <div key={order._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-gray-300 transition-colors">

                {/* Header row */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : order._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400 font-mono">{order._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">{order.userName}</p>
                      </div>
                      {order.userPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-400">{order.userPhone}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLE[order.status] || "bg-gray-100 text-gray-500")}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900">{format(myTotal)}</p>
                      <p className="text-xs text-gray-400">{myItems.length} item{myItems.length !== 1 ? "s" : ""}</p>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-90")} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 animate-fade-in">

                    {/* Items section */}
                    <div className="px-5 pt-4 pb-1">
                      <div className="flex items-center gap-1.5 mb-3">
                        <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Items</p>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {myItems.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-5 py-3">
                          {item.productImage && (
                            <img src={item.productImage} alt={item.productName} className="w-11 h-11 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Package className="w-3 h-3 text-gray-300" />
                              <p className="text-xs text-gray-400">Qty: {item.quantity} × {format(item.price)}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-800">{format(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order total */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Earnings</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Tag className="w-3.5 h-3.5 text-gray-300" />
                          <span>{myItems.length} item{myItems.length !== 1 ? "s" : ""}</span>
                        </div>
                        <span className="text-base font-bold text-gray-900">{format(myTotal)}</span>
                      </div>
                    </div>

                    {/* Shipping address */}
                    {order.shippingAddress && (
                      <div className="px-5 py-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 mb-3">
                          <Truck className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ship to</p>
                        </div>
                        <div className="space-y-1.5">
                          {order.shippingAddress.name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                              <span>{order.shippingAddress.name}</span>
                            </div>
                          )}
                          {order.userPhone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                              <span>{order.userPhone}</span>
                            </div>
                          )}
                          {order.shippingAddress.line1 && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                              <span>
                                {order.shippingAddress.line1}
                                {order.shippingAddress.city && `, ${order.shippingAddress.city}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <CurrencyProvider>
      <SellerOrdersInner />
    </CurrencyProvider>
  );
}