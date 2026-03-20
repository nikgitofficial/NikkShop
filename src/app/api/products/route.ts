// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") || 12)));
    const skip = (page - 1) * limit;

    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "newest";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const featured = searchParams.get("featured");
    const sellerId = searchParams.get("sellerId");

    // Build filter
    const filter: Record<string, any> = { status: "published" };

    if (category) filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    if (featured === "true") filter.featured = true;
    if (sellerId) filter.sellerId = sellerId;
    if (q) filter.$text = { $search: q };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sort
    const sortMap: Record<string, any> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      popular: { totalSold: -1 },
      rating: { rating: -1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
