// src/app/(storefront)/page.tsx
import Link from "next/link";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import User from "@/lib/models/User";
import { serializeDoc } from "@/lib/utils";
import { ArrowRight, Sparkles, ShieldCheck, Zap, TrendingUp, Tag, Star, Package } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
  return `${n}+`;
}

async function getData() {
  await connectDB();
  const [featured, newest, topRated, categories, productCount, sellerCount, totalUsers] = await Promise.all([
    Product.find({ status: "published", featured: true }).limit(4).lean(),
    Product.find({ status: "published" }).sort({ createdAt: -1 }).limit(8).lean(),
    Product.find({ status: "published", rating: { $gt: 0 } }).sort({ rating: -1 }).limit(4).lean(),
    Category.find({ active: true }).sort({ order: 1, name: 1 }).limit(8).lean(),
    Product.countDocuments({ status: "published" }),
    User.countDocuments({ role: "SELLER" }),
    User.countDocuments(),
  ]);
  return {
    featured: serializeDoc(featured),
    newest: serializeDoc(newest),
    topRated: serializeDoc(topRated),
    categories: serializeDoc(categories),
    stats: { productCount, sellerCount, totalUsers },
  };
}

export default async function HomePage() {
  const { featured, newest, topRated, categories, stats } = await getData();

  const statItems = [
    { value: formatStat(stats.productCount), label: "Products" },
    { value: formatStat(stats.sellerCount),  label: "Sellers" },
    { value: formatStat(stats.totalUsers),   label: "Happy buyers" },
  ];

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        {/* Light orbs instead of dark */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100/80 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-pink-100/60 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-blue-100/50 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-sm text-gray-500 font-medium mb-8">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Multi-seller marketplace — buy from real people
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display text-gray-900 mb-6 text-balance">
            Discover Products
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              Worth Buying
            </span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Shop thousands of products from independent sellers. Real products, real people, real quality.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="flex items-center gap-2 px-7 py-3.5 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-800 transition-colors"
            >
              Browse Products <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register?role=seller"
              className="flex items-center gap-2 px-7 py-3.5 bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-medium transition-all"
            >
              Start Selling →
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-10 mt-12">
            {statItems.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="relative max-w-3xl mx-auto mt-20 grid grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, label: "Secure Payments", sub: "" },
            { icon: Zap, label: "Instant Delivery", sub: "Digital goods" },
            { icon: Sparkles, label: "Verified Sellers", sub: "Quality guaranteed" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
              <Icon className="w-6 h-6 text-gray-700 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-semibold uppercase tracking-wider mb-2">
                <Tag className="w-3.5 h-3.5" /> Categories
              </div>
              <h2 className="text-3xl font-display text-gray-900">Shop by Category</h2>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium"
            >
              All categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat: any) => (
              <Link
                key={cat._id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center text-center p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
              >
                {cat.icon ? (
                  <span className="text-2xl mb-2">{cat.icon}</span>
                ) : (
                  <div className="w-10 h-10 mb-2 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <Package className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate w-full">
                  {cat.name}
                </p>
                {cat.productCount > 0 && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{cat.productCount}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured products ─────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="border-t border-gray-100 mb-12" />
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-purple-600 font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Featured
              </div>
              <h2 className="text-3xl font-display text-gray-900">Hand-Picked For You</h2>
            </div>
            <Link
              href="/products?featured=true"
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Top Rated ─────────────────────────────────────────────── */}
      {topRated.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="border-t border-gray-100 mb-12" />
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-amber-600 font-semibold uppercase tracking-wider mb-2">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Top Rated
              </div>
              <h2 className="text-3xl font-display text-gray-900">Customer Favourites</h2>
            </div>
            <Link
              href="/products?sort=rating"
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topRated.map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── New Arrivals ──────────────────────────────────────────── */}
      {newest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="border-t border-gray-100 mb-12" />
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">
                <TrendingUp className="w-3.5 h-3.5" /> New
              </div>
              <h2 className="text-3xl font-display text-gray-900">New Arrivals</h2>
            </div>
            <Link
              href="/products?sort=newest"
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {newest.map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Promo banners ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="border-t border-gray-100 mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <Zap className="w-7 h-7 text-purple-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free shipping</h3>
            <p className="text-gray-500 text-sm mb-5">On all orders over $50. No code needed.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-sm text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              Shop now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <Sparkles className="w-7 h-7 text-pink-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sell your products</h3>
            <p className="text-gray-500 text-sm mb-5">Join {formatStat(stats.sellerCount)} sellers already growing on NikShop.</p>
            <Link
              href="/register?role=seller"
              className="inline-flex items-center gap-1.5 text-sm text-pink-600 font-semibold hover:text-pink-700 transition-colors"
            >
              Start selling <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-24">
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-pink-900/20 pointer-events-none" />
          <div className="relative">
            <h2 className="text-4xl font-display text-white mb-4">Start Selling Today</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
              Join thousands of sellers who are reaching millions of buyers on NikShop.
            </p>
            <Link
              href="/register?role=seller"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Create Your Store <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}