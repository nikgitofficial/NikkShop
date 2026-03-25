// src/lib/models/Order.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentMethod = "stripe" | "cod" | "paymongo";

export interface IOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  _id: string;
  userId?: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  items: IOrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  stripeSessionId?: string;
  stripePaymentIntent?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: String,
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    userPhone: { type: String },
    items: [
      {
        productId: String,
        productName: String,
        productImage: String,
        productSlug: String,
        sellerId: String,
        sellerName: String,
        price: Number,
        quantity: Number,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "cod", "paymongo"],
      default: "stripe",
    },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    shippingAddress: {
      name: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntent: String,
    trackingNumber: String,
    notes: String,
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ "items.sellerId": 1, createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;