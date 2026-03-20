// src/lib/models/Category.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: string;
  order: number;
  active: boolean;
  productCount: number;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    image: String,
    icon: String,
    parent: String,
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
