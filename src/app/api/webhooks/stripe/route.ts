// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import connectDB from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutComplete(session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const meta = session.metadata;
  if (!meta) return;

  await connectDB();

  // Avoid duplicate order creation
  const exists = await Order.findOne({ stripeSessionId: session.id });
  if (exists) return;

  const items = JSON.parse(meta.items);
  const shippingAddress = JSON.parse(meta.shippingAddress);

  await Order.create({
    userId: meta.userId || undefined,
    userEmail: meta.userEmail,
    userName: meta.userName,
    items,
    status: "paid",
    subtotal: parseFloat(meta.subtotal),
    shipping: parseFloat(meta.shipping),
    tax: parseFloat(meta.tax),
    total: parseFloat(meta.total),
    shippingAddress,
    stripeSessionId: session.id,
    stripePaymentIntent: session.payment_intent as string,
  });

  // Decrement stock for each item
  await Promise.all(
    items.map((item: any) =>
      Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, totalSold: item.quantity },
      })
    )
  );
}
