// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getSession as auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const filter: any = {};
  if (role) filter.role = role;

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, role } = await req.json();
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select("-password").lean();

  return NextResponse.json({ user });
}
