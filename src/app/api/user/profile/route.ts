// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    // Only allow safe fields to be updated
    const allowed: Record<string, any> = {};
    if (body.name) allowed.name = body.name;
    if (body.image) allowed.image = body.image;
    if (body.sellerProfile) allowed.sellerProfile = body.sellerProfile;

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: allowed },
      { new: true }
    ).lean();

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}