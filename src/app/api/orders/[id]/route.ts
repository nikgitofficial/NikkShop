// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/lib/models/Order";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ await params — required in Next.js 15

  if (!id) return NextResponse.json({ error: "Missing order ID" }, { status: 400 });

  await connectDB();
  const order = await Order.findById(id).lean();

  if (!order) return NextResponse.json({ order: null }, { status: 404 });

  return NextResponse.json({ order });
}