// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { getSession as auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  const filter: any = {};
  if (status) filter.status = status;
  if (q) filter.$text = { $search: q };

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ products });
}
