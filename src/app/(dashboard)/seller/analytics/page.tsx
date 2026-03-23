// src/app/(dashboard)/seller/analytics/page.tsx
import { redirect } from "next/navigation";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { SellerAnalyticsDashboard } from "@/components/analytics/SellerAnalyticsDashboard";
import { CurrencyProvider } from "@/context/CurrencyContext";

export default async function SellerAnalyticsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "SELLER" && role !== "ADMIN") redirect("/");

  await connectDB();
  const sellerId = session.user?.id;

  // --- Fetch all data ---
  const [products, allOrders] = await Promise.all([
    Product.find({ sellerId }).lean(),
    Order.find({ "items.sellerId": sellerId })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // --- Revenue by month (last 12 months) ---
  const now = new Date();
  const monthlyData: Record<string, { revenue: number; orders: number; units: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = { revenue: 0, orders: 0, units: 0 };
  }

  for (const order of allOrders as any[]) {
    if (order.status === "cancelled" || order.status === "refunded") continue;
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[key]) continue;
    const myItems = order.items.filter((i: any) => i.sellerId === sellerId);
    const rev = myItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const units = myItems.reduce((s: number, i: any) => s + i.quantity, 0);
    monthlyData[key].revenue += rev;
    monthlyData[key].orders += 1;
    monthlyData[key].units += units;
  }

  const monthlyChartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    ...data,
  }));

  // --- Revenue by status ---
  const statusBreakdown: Record<string, number> = {};
  for (const order of allOrders as any[]) {
    const myRev = (order.items as any[])
      .filter((i: any) => i.sellerId === sellerId)
      .reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + myRev;
  }

  // --- Top products by revenue ---
  const productRevMap: Record<string, { name: string; revenue: number; units: number; image?: string }> = {};
  for (const order of allOrders as any[]) {
    if (order.status === "cancelled" || order.status === "refunded") continue;
    for (const item of (order.items as any[]).filter((i: any) => i.sellerId === sellerId)) {
      if (!productRevMap[item.productId]) {
        productRevMap[item.productId] = { name: item.name, revenue: 0, units: 0 };
      }
      productRevMap[item.productId].revenue += item.price * item.quantity;
      productRevMap[item.productId].units += item.quantity;
    }
  }

  for (const p of products as any[]) {
    const id = p._id.toString();
    if (productRevMap[id]) {
      productRevMap[id].image = p.images?.[0]?.url;
      if (!productRevMap[id].name) productRevMap[id].name = p.name;
    }
  }

  const topProducts = Object.entries(productRevMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // --- Top products by views ---
  const topByViews = (products as any[])
    .filter((p) => p.views > 0)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map((p) => ({ id: p._id.toString(), name: p.name, views: p.views || 0, image: p.images?.[0]?.url }));

  // --- Category breakdown ---
  const categoryMap: Record<string, { revenue: number; units: number }> = {};
  for (const order of allOrders as any[]) {
    if (order.status === "cancelled" || order.status === "refunded") continue;
    for (const item of (order.items as any[]).filter((i: any) => i.sellerId === sellerId)) {
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

  // --- Overall KPIs ---
  const totalRevenue = Object.values(monthlyData).reduce((s, m) => s + m.revenue, 0);
  const totalOrders = (allOrders as any[]).filter(
    (o) => o.status !== "cancelled" && o.status !== "refunded"
  ).length;
  const totalUnits = Object.values(monthlyData).reduce((s, m) => s + m.units, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionViews = (products as any[]).reduce((s, p) => s + (p.views || 0), 0);
  const conversionRate = conversionViews > 0 ? (totalUnits / conversionViews) * 100 : 0;

  // --- MoM growth ---
  const thisMonth = monthlyChartData[monthlyChartData.length - 1]?.revenue ?? 0;
  const lastMonth = monthlyChartData[monthlyChartData.length - 2]?.revenue ?? 0;
  const momGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  return (
    // CurrencyProvider must wrap here so SellerAnalyticsDashboard (a Client Component)
    // and CurrencySwitcher can both read/write currency state.
    <CurrencyProvider>
      <SellerAnalyticsDashboard
        kpis={{ totalRevenue, totalOrders, totalUnits, avgOrderValue, conversionRate, momGrowth }}
        monthlyChartData={monthlyChartData}
        topProducts={topProducts}
        topByViews={topByViews}
        categoryData={categoryData}
        statusBreakdown={statusBreakdown}
        totalProducts={(products as any[]).length}
        publishedProducts={(products as any[]).filter((p) => p.status === "published").length}
      />
    </CurrencyProvider>
  );
}