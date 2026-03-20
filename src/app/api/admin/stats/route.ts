// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { getSession as auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const [users, products, orders, revenue] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $in: ["paid", "processing", "shipped", "delivered"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const pendingSellers = await User.countDocuments({
    role: "SELLER",
    "sellerProfile.approved": false,
  });

  return NextResponse.json({
    stats: {
      users,
      products,
      orders,
      revenue: revenue[0]?.total || 0,
      pendingSellers,
    },
    recentOrders,
  });
}
