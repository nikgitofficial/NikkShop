// src/lib/models/Product.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAt?: number;
  images: { url: string; alt?: string; isPrimary: boolean }[];
  category: string;
  subcategory?: string;
  tags: string[];
  stock: number;
  sku?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  variants?: { name: string; options: string[] }[];
  published: boolean;
  featured: boolean;
  sellerId: string;
  sellerName: string;
  sellerStoreName: string;
  status: "draft" | "published" | "archived" | "pending";
  views: number;
  totalSold: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAt: { type: Number },
    images: [
      {
        url: { type: String, required: true },
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    category: { type: String, required: true },
    subcategory: String,
    tags: [String],
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, sparse: true },
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    variants: [{ name: String, options: [String] }],
    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String, required: true },
    sellerStoreName: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived", "pending"],
      default: "draft",
    },
    views: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Text search index
ProductSchema.index({ name: "text", description: "text", tags: "text" });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ sellerId: 1, status: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
