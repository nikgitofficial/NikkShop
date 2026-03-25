"use client";

// src/components/seller/SellerDashboardClient.tsx
import Link from "next/link";
import {
  Package, ShoppingCart, TrendingUp, Eye,
  Plus, ArrowRight, Star, MessageCircle,
} from "lucide-react";
import { ContactAdminButton } from "@/components/chat/ContactAdminButton";
import { CurrencySwitcher } from "@/components/analytics/CurrencySwitcher";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  userName: string;
  stats: {
    totalProducts: number;
    published: number;
    totalViews: number;
    totalSold: number;
    revenue: number;
  };
  recentProducts: any[];
  orders: any[];
  sellerId: string;
}

export function SellerDashboardClient({
  userName,
  stats,
  recentProducts,
  orders,
  sellerId,
}: Props) {
  const { format } = useCurrency();

  const statCards = [
    { label: "Revenue",      value: format(stats.revenue),               icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { label: "Products",     value: stats.totalProducts,                  icon: Package,    color: "text-purple-600",  bg: "bg-purple-50 border-purple-200"  },
    { label: "Published",    value: stats.published,                      icon: Star,       color: "text-amber-600",   bg: "bg-amber-50 border-amber-200"    },
    { label: "Total Views",  value: stats.totalViews.toLocaleString(),    icon: Eye,        color: "text-blue-600",    bg: "bg-blue-50 border-blue-200"      },
    { label: "Units Sold",   value: stats.totalSold,                      icon: ShoppingCart, color: "text-pink-600", bg: "bg-pink-50 border-pink-200"      },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display text-gray-900">
            Welcome back,{" "}
            <span className="text-black font-bold">{userName.split(" ")[0]}</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's what's happening with your store today
          </p>
        </div>

        {/* Currency switcher + Contact Admin */}
        <div className="flex items-center gap-2">
          <CurrencySwitcher />
          <ContactAdminButton />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`border rounded-2xl p-5 shadow-sm ${bg}`}>
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Products</h2>
            <Link
              href="/seller/products"
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400 mb-4">No products yet</p>
              <Link
                href="/seller/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white font-medium rounded-xl bg-black hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Product
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentProducts.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {p.images?.[0]?.url && (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {format(p.price)} · {p.stock} in stock
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                      p.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <Link
              href="/seller/orders"
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center">
              <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">
                No orders yet. Publish products to start selling!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((o) => {
                const myItems = o.items.filter((i: any) => i.sellerId === sellerId);
                const myTotal = myItems.reduce(
                  (s: number, i: any) => s + i.price * i.quantity,
                  0
                );
                return (
                  <div
                    key={o._id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {o.userName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {myItems.length} item{myItems.length !== 1 ? "s" : ""} ·{" "}
                        {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        {format(myTotal)}
                      </p>
                      <span
                        className={`text-xs font-medium capitalize ${
                          o.status === "paid" || o.status === "delivered"
                            ? "text-emerald-600"
                            : o.status === "shipped"
                            ? "text-blue-600"
                            : o.status === "cancelled"
                            ? "text-red-500"
                            : "text-amber-600"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: "/seller/products/new", label: "Add New Product",  icon: Plus,         desc: "List a new item for sale"      },
          { href: "/seller/products",     label: "Manage Products",  icon: Package,      desc: "Edit, publish, or delete"      },
          { href: "/seller/orders",       label: "View Orders",      icon: ShoppingCart, desc: "Track and fulfill orders"      },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-gray-50 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}