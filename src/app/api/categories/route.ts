// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/lib/models/Category";
import { getSession as auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  await connectDB();
  const cats = await Category.find({ active: true }).sort({ order: 1, name: 1 }).lean();
  return NextResponse.json({ categories: cats });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { name, description, image, icon } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const slug = slugify(name);
  const cat = await Category.create({ name, slug, description, image, icon });
  return NextResponse.json({ category: cat }, { status: 201 });
}
