// src/app/api/seller/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
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

  // Find orders that contain at least one item from this seller
  const orders = await Order.find({
    "items.sellerId": session.user?.id,
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ orders });
}
