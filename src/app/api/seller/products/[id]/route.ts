// src/app/api/seller/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { getSession as auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const product = await Product.findOne({
      _id: id,
      sellerId: session.user?.id,
    }).lean();

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const role = (session.user as any).role;

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = product.sellerId === session.user?.id;
    if (role !== "ADMIN" && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    if (body.name && body.name !== product.name) {
      let newSlug = slugify(body.name);
      const conflict = await Product.findOne({ slug: newSlug, _id: { $ne: id } });
      if (conflict) newSlug = `${newSlug}-${Date.now()}`;
      body.slug = newSlug;
    }

    const updated = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    return NextResponse.json({ product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const role = (session.user as any).role;
    const product = await Product.findById(id);

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = product.sellerId === session.user?.id;
    if (role !== "ADMIN" && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await product.deleteOne();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}