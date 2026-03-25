// src/app/(dashboard)/admin/page.tsx
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { formatRelative, serializeDoc } from "@/lib/utils";
import { getSession as auth } from "@/lib/auth";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");

  await connectDB();

  const [userCount, productCount, orderCount, revenueAgg, recentOrders, pendingSellers] =
    await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: "published" }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $in: ["paid", "processing", "shipped", "delivered"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8).lean(),
      User.find({ role: "SELLER", "sellerProfile.approved": false })
        .select("-password")
        .limit(5)
        .lean(),
    ]);

  const revenue = revenueAgg[0]?.total || 0;

  // Serialize and enrich for the client
  const serializedOrders = (recentOrders as any[]).map((order) => ({
    ...serializeDoc(order),
    createdAtRelative: formatRelative(order.createdAt),
  }));

  const serializedSellers = (pendingSellers as any[]).map((s) => serializeDoc(s));

  return (
    <AdminDashboardClient
      revenue={revenue}
      orderCount={orderCount}
      productCount={productCount}
      userCount={userCount}
      recentOrders={serializedOrders}
      pendingSellers={serializedSellers}
    />
  );
}