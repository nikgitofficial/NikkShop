// src/app/(dashboard)/admin/analytics/page.tsx
import { redirect } from "next/navigation";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { AdminAnalyticsDashboard } from "@/components/analytics/AdminAnalyticsDashboard";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/");

  await connectDB();

  const [products, allOrders, allUsers] = await Promise.all([
    Product.find({}).lean(),
    Order.find({}).sort({ createdAt: -1 }).lean(),
    User.find({}).lean(),
  ]);

  const sellers = (allUsers as any[]).filter((u) => u.role === "SELLER");
  const buyers = (allUsers as any[]).filter((u) => u.role === "USER" || !u.role);

  // ── Monthly data (last 12 months) ──────────────────────────────
  const now = new Date();
  const monthlyData: Record<string, { revenue: number; orders: number; units: number; newUsers: number; newSellers: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = { revenue: 0, orders: 0, units: 0, newUsers: 0, newSellers: 0 };
  }

  for (const order of allOrders as any[]) {
    if (order.status === "cancelled" || order.status === "refunded") continue;
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[key]) continue;
    const rev = (order.items as any[]).reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const units = (order.items as any[]).reduce((s: number, i: any) => s + i.quantity, 0);
    monthlyData[key].revenue += rev;
    monthlyData[key].orders += 1;
    monthlyData[key].units += units;
  }

  for (const u of allUsers as any[]) {
    const d = new Date(u.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[key]) continue;
    if (u.role === "SELLER") monthlyData[key].newSellers += 1;
    else monthlyData[key].newUsers += 1;
  }

  const monthlyChartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    ...data,
  }));

  // ── Platform KPIs ───────────────────────────────────────────────
  const validOrders = (allOrders as any[]).filter(
    (o) => o.status !== "cancelled" && o.status !== "refunded"
  );
  const totalRevenue = validOrders.reduce((s: number, o: any) =>
    s + (o.items as any[]).reduce((si: number, i: any) => si + i.price * i.quantity, 0), 0);
  const totalOrders = validOrders.length;
  const totalUnits = validOrders.reduce((s: number, o: any) =>
    s + (o.items as any[]).reduce((si: number, i: any) => si + i.quantity, 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // MoM growth
  const thisMonth = monthlyChartData[monthlyChartData.length - 1]?.revenue ?? 0;
  const lastMonth = monthlyChartData[monthlyChartData.length - 2]?.revenue ?? 0;
  const momGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  // ── Order status breakdown ──────────────────────────────────────
  const statusBreakdown: Record<string, { count: number; revenue: number }> = {};
  for (const order of allOrders as any[]) {
    const rev = (order.items as any[]).reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    if (!statusBreakdown[order.status]) statusBreakdown[order.status] = { count: 0, revenue: 0 };
    statusBreakdown[order.status].count += 1;
    statusBreakdown[order.status].revenue += rev;
  }

  // ── Top sellers by revenue ──────────────────────────────────────
  const sellerRevenueMap: Record<string, { name: string; email: string; revenue: number; orders: number; products: number; image?: string }> = {};
  for (const order of validOrders as any[]) {
    for (const item of order.items as any[]) {
      const sid = item.sellerId;
      if (!sid) continue;
      if (!sellerRevenueMap[sid]) {
        const sellerDoc = (allUsers as any[]).find((u) => u._id.toString() === sid);
        sellerRevenueMap[sid] = {
          name: sellerDoc?.name ?? "Unknown",
          email: sellerDoc?.email ?? "",
          image: sellerDoc?.image,
          revenue: 0,
          orders: 0,
          products: (products as any[]).filter((p) => p.sellerId === sid).length,
        };
      }
      sellerRevenueMap[sid].revenue += item.price * item.quantity;
    }
    // count unique sellers per order
    const sellerIds = [...new Set((order.items as any[]).map((i: any) => i.sellerId).filter(Boolean))];
    sellerIds.forEach((sid: string) => {
      if (sellerRevenueMap[sid]) sellerRevenueMap[sid].orders += 1;
    });
  }
  const topSellers = Object.entries(sellerRevenueMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── Top products platform-wide ──────────────────────────────────
  const productMap: Record<string, { name: string; revenue: number; units: number; image?: string; sellerName?: string }> = {};
  for (const order of validOrders as any[]) {
    for (const item of order.items as any[]) {
      const pid = item.productId;
      if (!productMap[pid]) {
        const prod = (products as any[]).find((p) => p._id.toString() === pid);
        const seller = (allUsers as any[]).find((u) => u._id.toString() === item.sellerId);
        productMap[pid] = {
          name: item.name,
          revenue: 0,
          units: 0,
          image: prod?.images?.[0]?.url,
          sellerName: seller?.name,
        };
      }
      productMap[pid].revenue += item.price * item.quantity;
      productMap[pid].units += item.quantity;
    }
  }
  const topProducts = Object.entries(productMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── Category breakdown ──────────────────────────────────────────
  const categoryMap: Record<string, { revenue: number; units: number }> = {};
  for (const order of validOrders as any[]) {
    for (const item of order.items as any[]) {
      const prod = (products as any[]).find((p) => p._id.toString() === item.productId);
      const cat = prod?.category || "Uncategorized";
      if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, units: 0 };
      categoryMap[cat].revenue += item.price * item.quantity;
      categoryMap[cat].units += item.quantity;
    }
  }
  const categoryData = Object.entries(categoryMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Recent orders ───────────────────────────────────────────────
  const recentOrders = (allOrders as any[]).slice(0, 10).map((o) => ({
    id: o._id.toString(),
    userName: o.userName ?? "Unknown",
    total: (o.items as any[]).reduce((s: number, i: any) => s + i.price * i.quantity, 0),
    status: o.status,
    itemCount: (o.items as any[]).reduce((s: number, i: any) => s + i.quantity, 0),
    createdAt: o.createdAt?.toString(),
  }));

  return (
    <AdminAnalyticsDashboard
      kpis={{
        totalRevenue,
        totalOrders,
        totalUnits,
        avgOrderValue,
        momGrowth,
        totalSellers: sellers.length,
        totalBuyers: buyers.length,
        totalProducts: (products as any[]).length,
        publishedProducts: (products as any[]).filter((p) => p.status === "published").length,
      }}
      monthlyChartData={monthlyChartData}
      topSellers={topSellers}
      topProducts={topProducts}
      categoryData={categoryData}
      statusBreakdown={statusBreakdown}
      recentOrders={recentOrders}
    />
  );
}