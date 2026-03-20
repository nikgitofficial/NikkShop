// src/lib/models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "USER" | "SELLER" | "ADMIN";

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  sellerProfile?: {
    storeName: string;
    storeDescription?: string;
    storeLogo?: string;
    storeBanner?: string;
    approved: boolean;
    totalSales: number;
    rating: number;
    reviewCount: number;
  };
  emailVerified?: Date;
  resetOtp?: string;
  resetOtpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    image: { type: String },
    role: { type: String, enum: ["USER", "SELLER", "ADMIN"], default: "USER" },
    sellerProfile: {
      storeName: String,
      storeDescription: String,
      storeLogo: String,
      storeBanner: String,
      approved: { type: Boolean, default: false },
      totalSales: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
    emailVerified: Date,
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;