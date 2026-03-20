// src/app/api/seller/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import { getSession as auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().positive(),
  compareAt: z.number().positive().optional().nullable(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).min(1, "At least one image required"),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  weight: z.number().optional(),
  variants: z.array(z.object({
    name: z.string(),
    options: z.array(z.string()),
  })).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  featured: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SELLER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = 20;

    const filter: any = { sellerId: session.user?.id };
    if (status) filter.status = status;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SELLER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Only sellers can create products" }, { status: 403 });
    }

    await connectDB();

    // Get seller info
    const seller = await User.findById(session.user?.id).lean() as any;
    if (!seller) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (role === "SELLER" && !seller.sellerProfile?.approved) {
      return NextResponse.json({ error: "Your seller account is pending approval" }, { status: 403 });
    }

    const body = await req.json();
    const data = productSchema.parse(body);

    // Ensure at least one image is primary
    const images = data.images.map((img, i) => ({
      ...img,
      isPrimary: i === 0 ? true : img.isPrimary,
    }));

    // Generate unique slug
    let slug = slugify(data.name);
    const existing = await Product.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await Product.create({
      ...data,
      images,
      slug,
      sellerId: session.user?.id,
      sellerName: seller.name,
      sellerStoreName: seller.sellerProfile?.storeName || seller.name,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
