// src/app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/lib/models/Category";
import { slugify } from "@/lib/utils";
import { getSession as auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  await connectDB();
  const categories = await Category.find({}).sort({ order: 1, name: 1 }).lean();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { name, description, image, icon } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const slug = slugify(name);
  const existing = await Category.findOne({ slug });
  if (existing) return NextResponse.json({ error: "Category already exists" }, { status: 400 });

  const cat = await Category.create({ name, slug, description, image, icon });
  return NextResponse.json({ category: cat }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await connectDB();
  await Category.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}