// src/app/api/orders/by-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/lib/models/Order";

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  await connectDB();

  // Retry up to 5 times (webhook may arrive slightly after redirect)
  for (let i = 0; i < 5; i++) {
    const order = await Order.findOne({ stripeSessionId: sessionId }).lean();
    if (order) return NextResponse.json({ order });
    await new Promise((r) => setTimeout(r, 1000));
  }

  return NextResponse.json({ order: null });
}
