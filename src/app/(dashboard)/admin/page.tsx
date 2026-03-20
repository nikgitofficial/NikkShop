// src/app/(dashboard)/admin/page.tsx
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { formatPrice, formatRelative, serializeDoc } from "@/lib/utils";
import Link from "next/link";
import { getSession as auth } from "@/lib/auth";
import { Users, Package, ShoppingCart, DollarSign, AlertCircle, ArrowRight, Check, X } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");

  await connectDB();

  const [userCount, productCount, orderCount, revenueAgg, recentOrders, pendingSellers] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ status: "published" }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $in: ["paid", "processing", "shipped", "delivered"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(8).lean(),
    User.find({ role: "SELLER", "sellerProfile.approved": false }).select("-password").limit(5).lean(),
  ]);

  const revenue = revenueAgg[0]?.total || 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: formatPrice(revenue), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Total Orders", value: orderCount.toLocaleString(), icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
          { label: "Products", value: productCount.toLocaleString(), icon: Package, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
          { label: "Users", value: userCount.toLocaleString(), icon: Users, color: "text-pink-600", bg: "bg-pink-50 border-pink-200" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`border rounded-2xl p-5 shadow-sm ${bg}`}>
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <p className={`text-2xl lg:text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending seller approvals */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800">Pending Sellers</h2>
              {pendingSellers.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingSellers.length}
                </span>
              )}
            </div>
            <Link href="/admin/sellers" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
              Manage all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {pendingSellers.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No pending approvals</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(pendingSellers as any[]).map((seller) => (
                <div key={seller._id.toString()} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                    {seller.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{seller.sellerProfile?.storeName || seller.name}</p>
                    <p className="text-xs text-gray-400 truncate">{seller.email}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Link href={`/admin/sellers?approve=${seller._id}`} className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/admin/sellers?reject=${seller._id}`} className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(recentOrders as any[]).map((order) => (
              <div key={order._id.toString()} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800">{order.userName}</p>
                  <p className="text-xs text-gray-400">{formatRelative(order.createdAt)} · {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{formatPrice(order.total)}</p>
                  <span className={`text-xs font-medium capitalize ${
                    order.status === "paid" || order.status === "delivered" ? "text-emerald-600" :
                    order.status === "cancelled" ? "text-red-500" : "text-amber-600"
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { href: "/admin/products", label: "All Products", icon: Package },
          { href: "/admin/orders", label: "All Orders", icon: ShoppingCart },
          { href: "/admin/categories", label: "Categories", icon: AlertCircle },
          { href: "/admin/sellers", label: "Sellers", icon: Users },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-4 flex items-center gap-3 transition-all hover:bg-gray-50 shadow-sm group"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}