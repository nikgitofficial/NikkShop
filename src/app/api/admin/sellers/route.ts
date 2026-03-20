// src/app/api/admin/sellers/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
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
  const sellers = await User.find({ role: "SELLER" })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ sellers });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { sellerId, approved } = await req.json();
  await connectDB();

  const user = await User.findByIdAndUpdate(
    sellerId,
    { "sellerProfile.approved": approved },
    { new: true }
  ).select("-password").lean();

  return NextResponse.json({ user });
}
