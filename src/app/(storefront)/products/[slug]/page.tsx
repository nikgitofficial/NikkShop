// src/app/(storefront)/products/[slug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";
import {
  ShoppingCart, Star, ChevronLeft, Check, Minus, Plus,
  Store, Package, Shield, Truck, Share2, Heart, ChevronRight,
  Zap, RotateCcw, BadgeCheck,
} from "lucide-react";
import { calculateDiscount, formatRelative, cn } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";
import { ChatSellerButton } from "@/components/chat/ChatSellerButton";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty]               = useState(1);
  const [added, setAdded]           = useState(false);
  const [wishlist, setWishlist]     = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { format } = useCurrency();

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((d) => { setProduct(d.product); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  function handleAdd() {
    if (!product || product.stock === 0) return;
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[selectedImg]?.url || product.images?.[0]?.url || "",
      quantity: qty,
      slug: product.slug,
      sellerId: product.sellerId,
      sellerName: product.sellerStoreName || product.sellerName,
      stock: product.stock,
    });
    setAdded(true);
    toast.success("Added to cart!", { description: `${qty}× ${product.name}` });
    setTimeout(() => setAdded(false), 2500);
  }

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-3xl animate-pulse" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-5 pt-2">
          <div className="h-4 bg-gray-100 rounded-lg w-24 animate-pulse" />
          <div className="h-9 bg-gray-100 rounded-xl w-4/5 animate-pulse" />
          <div className="h-9 bg-gray-100 rounded-xl w-2/5 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 bg-gray-100 rounded-lg w-5/6 animate-pulse" />
          <div className="h-14 bg-gray-100 rounded-2xl animate-pulse mt-4" />
        </div>
      </div>
    </div>
  );

  /* ── Not found ── */
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-6">
        <Package className="w-9 h-9 text-gray-400" />
      </div>
      <h2 className="text-2xl font-display font-bold text-gray-800">Product not found</h2>
      <p className="text-gray-400 text-sm mt-2">This product may have been removed or the link is incorrect.</p>
      <Link
        href="/products"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-2.5 transition-all"
      >
        <ChevronLeft className="w-4 h-4" /> Browse all products
      </Link>
    </div>
  );

  const discount   = calculateDiscount(product.price, product.compareAt);
  const inStock    = product.stock > 0;
  const lowStock   = product.stock > 0 && product.stock < 5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-10">
        <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <Link href="/products" className="hover:text-gray-700 transition-colors">Products</Link>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <Link href={`/products?category=${product.category}`} className="hover:text-gray-700 transition-colors">
          {product.category}
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <span className="text-gray-600 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">

        {/* ── Left: Image gallery ── */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-200 group">
            {product.images?.[selectedImg]?.url ? (
              <Image
                src={product.images[selectedImg].url}
                alt={product.images[selectedImg].alt || product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                <Package className="w-20 h-20" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discount && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-md">
                  <Zap className="w-3 h-3" /> {discount}% OFF
                </span>
              )}
              {lowStock && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md">
                  Only {product.stock} left
                </span>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => setWishlist((w) => !w)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            >
              <Heart className={cn("w-4 h-4 transition-colors", wishlist ? "fill-red-500 text-red-500" : "text-gray-400")} />
            </button>
          </div>

          {/* Thumbnail strip */}
          {product.images?.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {product.images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={cn(
                    "relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200",
                    i === selectedImg
                      ? "border-gray-900 shadow-md scale-105"
                      : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                  )}
                >
                  <Image src={img.url} alt={img.alt || ""} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Details ── */}
        <div className="flex flex-col gap-5 lg:pt-2">

          {/* Category + actions */}
          <div className="flex items-center justify-between">
            <Link
              href={`/products?category=${product.category}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-700 transition-colors"
            >
              {product.category}
            </Link>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success("Link copied to clipboard");
              }}
              className="p-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 leading-tight tracking-tight">
            {product.name}
          </h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "w-4 h-4",
                      s <= Math.round(product.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.reviewCount} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 py-1">
            <span className="text-4xl font-bold text-gray-900 tracking-tight">
              {format(product.price)}
            </span>
            {product.compareAt && (
              <span className="text-xl text-gray-400 line-through font-medium">
                {format(product.compareAt)}
              </span>
            )}
            {discount && (
              <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                Save {discount}%
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Description */}
          <p className="text-gray-500 leading-relaxed text-sm">{product.description}</p>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((t: string) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-500 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2 text-sm font-medium">
            {inStock ? (
              <>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  lowStock ? "bg-amber-400" : "bg-emerald-500 animate-pulse"
                )} />
                <span className={lowStock ? "text-amber-600" : "text-emerald-600"}>
                  {lowStock ? `Only ${product.stock} left in stock — order soon` : "In stock & ready to ship"}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-red-500">Out of stock</span>
              </>
            )}
          </div>

          {/* Qty + CTA */}
          {inStock && (
            <div className="flex items-stretch gap-3">
              {/* Quantity selector */}
              <div className="flex items-center bg-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-4 py-3.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 min-w-[44px] text-center text-sm font-bold text-gray-800">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="px-4 py-3.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAdd}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-sm",
                  added
                    ? "bg-emerald-500 text-white border border-emerald-500 scale-[0.98]"
                    : "bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.97]"
                )}
              >
                {added ? (
                  <><Check className="w-5 h-5" /> Added to Cart!</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                )}
              </button>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: Shield,     label: "Secure checkout",  sub: "SSL encrypted" },
              { icon: Truck,      label: "Fast shipping",    sub: "2–5 business days" },
              { icon: RotateCcw,  label: "Easy returns",     sub: "30-day policy" },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 border border-gray-200 rounded-2xl text-center"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-600 leading-tight">{label}</span>
                <span className="text-[10px] text-gray-400">{sub}</span>
              </div>
            ))}
          </div>

          {/* Seller card */}
          <div className="flex items-center gap-3.5 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
            <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Sold by</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {product.sellerStoreName || product.sellerName}
                </p>
                <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
              </div>
            </div>
            <ChatSellerButton
              sellerId={product.sellerId}
              productId={product._id}
              productName={product.name}
              productImage={product.images?.[0]?.url}
            />
          </div>

        </div>
      </div>
    </div>
  );
}