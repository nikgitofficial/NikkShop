// src/app/api/admin/find/route.ts
import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const admin = await User.findOne({ role: "ADMIN" }).lean();
    if (!admin) return NextResponse.json({ error: "No admin found" }, { status: 404 });

    return NextResponse.json({ adminId: admin._id.toString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}