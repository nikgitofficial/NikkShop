// src/app/api/orders/cod/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { items, form, subtotal, shipping, tax, total } = body;

    if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });

    await connectDB();

    // Verify stock
    for (const item of items) {
      const product = await Product.findById(item.productId).lean() as any;
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${item.name}"` },
          { status: 400 }
        );
      }
    }

    // Create order directly with pending status
    const order = await Order.create({
      userId: session?.user?.id || undefined,
      userEmail: form.email,
      userName: `${form.firstName} ${form.lastName}`,
      userPhone: form.phone || "",
      items: items.map((i: any) => ({
        productId: i.productId,
        productName: i.name,
        productImage: i.image,
        productSlug: i.slug,
        sellerId: i.sellerId,
        sellerName: i.sellerName,
        price: i.price,
        quantity: i.quantity,
      })),
      status: "pending",
      paymentMethod: "cod",
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress: {
        name: `${form.firstName} ${form.lastName}`,
        line1: form.address,
        line2: form.address2 || "",
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
      },
    });

    // Decrement stock
    await Promise.all(
      items.map((item: any) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity, totalSold: item.quantity },
        })
      )
    );

    return NextResponse.json({ orderId: order._id.toString() });
  } catch (err: any) {
    console.error("[COD order error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}