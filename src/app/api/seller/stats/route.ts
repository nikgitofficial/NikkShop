// src/app/api/seller/stats/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { getSession as auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "SELLER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const sellerId = session.user?.id;

  const [products, orders] = await Promise.all([
    Product.find({ sellerId }).lean(),
    Order.find({ "items.sellerId": sellerId }).lean(),
  ]);

  const paidOrders = orders.filter((o: any) =>
    !["cancelled", "refunded"].includes(o.status)
  );

  const revenue = paidOrders.reduce((sum: number, order: any) => {
    const myItems = (order.items || []).filter((i: any) => i.sellerId === sellerId);
    return sum + myItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  }, 0);

  const totalSold = products.reduce((s: number, p: any) => s + (p.totalSold || 0), 0);
  const totalViews = products.reduce((s: number, p: any) => s + (p.views || 0), 0);

  // Revenue by month (last 6 months)
  const now = new Date();
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleString("default", { month: "short" });
    const revenue = paidOrders
      .filter((o: any) => {
        const od = new Date(o.createdAt);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      })
      .reduce((sum: number, order: any) => {
        const myItems = (order.items || []).filter((i: any) => i.sellerId === sellerId);
        return sum + myItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      }, 0);
    return { month: label, revenue };
  });

  return NextResponse.json({
    stats: {
      totalProducts: products.length,
      publishedProducts: products.filter((p: any) => p.status === "published").length,
      totalOrders: orders.length,
      revenue,
      totalSold,
      totalViews,
    },
    monthlyRevenue,
  });
}
