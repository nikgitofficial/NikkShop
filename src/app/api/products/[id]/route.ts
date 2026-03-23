// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { getSession as auth } from "@/lib/auth";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };

    const product = await Product.findOne(query).lean();
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    Product.findByIdAndUpdate((product as any)._id, { $inc: { views: 1 } }).exec();
    return NextResponse.json({ product });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = (session.user as any).role;
    const isOwner = product.sellerId === session.user?.id;
    if (role !== "ADMIN" && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const updated = await Product.findByIdAndUpdate(id, body, { new: true }).lean();

    // Bust cache so storefront reflects the update immediately
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath(`/products/${(updated as any).slug}`);

    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("[PATCH /api/products]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = (session.user as any).role;
    const isOwner = product.sellerId === session.user?.id;
    if (role !== "ADMIN" && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Save slug before deleting so we can revalidate the product page
    const slug = product.slug;

    await Product.findByIdAndDelete(id);

    // Bust cache so deleted product disappears from storefront immediately
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath(`/products/${slug}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/products]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}