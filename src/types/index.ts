// src/types/index.ts

export type UserRole = "USER" | "SELLER" | "ADMIN";

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
  sellerId: string;
  sellerName: string;
  stock: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAt?: number;
  images: ProductImage[];
  category: string;
  subcategory?: string;
  tags: string[];
  stock: number;
  sku?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  userId?: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
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
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  active: boolean;
  productCount: number;
}

export interface SellerProfile {
  storeName: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  approved: boolean;
  totalSales: number;
  rating: number;
  reviewCount: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  sellerProfile?: SellerProfile;
  createdAt: string;
}

// API response wrapper
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
