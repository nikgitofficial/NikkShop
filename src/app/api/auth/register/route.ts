// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["USER", "SELLER"]).default("USER"),
  storeName: z.string().optional(),
  storeDescription: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashed,
      role: data.role,
      ...(data.role === "SELLER" && data.storeName && {
        sellerProfile: {
          storeName: data.storeName,
          storeDescription: data.storeDescription || "",
          approved: false,
          totalSales: 0,
          rating: 0,
          reviewCount: 0,
        },
      }),
    });

    return NextResponse.json({ success: true, userId: user._id }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
