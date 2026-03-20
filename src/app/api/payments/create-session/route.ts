// src/app/api/payments/create-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { items, form, subtotal, shipping, tax, total } = body;

    if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });

    // Verify stock
    await connectDB();
    for (const item of items) {
      const product = await Product.findById(item.productId).lean() as any;
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${item.name}"` },
          { status: 400 }
        );
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: form.email,
      line_items: [
        ...items.map((item: any) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              images: item.image ? [item.image] : [],
              metadata: { productId: item.productId, sellerId: item.sellerId },
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        ...(shipping > 0 ? [{
          price_data: {
            currency: "usd",
            product_data: { name: "Shipping" },
            unit_amount: Math.round(shipping * 100),
          },
          quantity: 1,
        }] : []),
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Tax (8%)" },
            unit_amount: Math.round(tax * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session?.user?.id || "",
        userEmail: form.email,
        userName: `${form.firstName} ${form.lastName}`,
        // Only store essential IDs — full details fetched from DB in webhook
        items: JSON.stringify(items.map((i: any) => ({
          productId: i.productId,
          sellerId: i.sellerId,
          price: i.price,
          quantity: i.quantity,
        }))),
        shippingAddress: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          line1: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        }),
        subtotal: String(subtotal),
        shipping: String(shipping),
        tax: String(tax),
        total: String(total),
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}