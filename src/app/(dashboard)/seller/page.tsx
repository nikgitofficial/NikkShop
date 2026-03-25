// src/app/(dashboard)/seller/page.tsx
import { redirect } from "next/navigation";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { serializeDoc } from "@/lib/utils";
import Link from "next/link";
import { Package, ShoppingCart, TrendingUp, Eye, Plus, ArrowRight, Star } from "lucide-react";
import { ContactAdminButton } from "@/components/chat/ContactAdminButton";
import { SellerDashboardClient } from "@/components/seller/SellerDashboardClient";

export default async function SellerDashboard() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "SELLER" && role !== "ADMIN") redirect("/");

  await connectDB();
  const sellerId = session.user?.id;

  const [products, recentProducts] = await Promise.all([
    Product.find({ sellerId }).lean(),
    Product.find({ sellerId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const orders = await Order.find({ "items.sellerId": sellerId }).sort({ createdAt: -1 }).limit(10).lean();

  const stats = {
    totalProducts: products.length,
    published: products.filter((p) => p.status === "published").length,
    totalViews: products.reduce((s: number, p: any) => s + (p.views || 0), 0),
    totalSold: products.reduce((s: number, p: any) => s + (p.totalSold || 0), 0),
    revenue: orders
      .filter((o: any) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((s: number, o: any) => {
        const myItems = o.items.filter((i: any) => i.sellerId === sellerId);
        return s + myItems.reduce((si: number, i: any) => si + i.price * i.quantity, 0);
      }, 0),
  };

  const serializedRecentProducts = (recentProducts as any[]).map((p) => serializeDoc(p));
  const serializedOrders = (orders as any[]).map((o) => serializeDoc(o));

  return (
    <SellerDashboardClient
      userName={session.user?.name ?? ""}
      stats={stats}
      recentProducts={serializedRecentProducts}
      orders={serializedOrders}
      sellerId={sellerId ?? ""}
    />
  );
}