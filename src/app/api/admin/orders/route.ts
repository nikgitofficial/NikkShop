// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { getSession as auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { orderId, status } = await req.json();
  await connectDB();

  const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true }).lean();
  return NextResponse.json({ order });
}
