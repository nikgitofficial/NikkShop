// src/components/product/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";
import { calculateDiscount, cn } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  product: any;
}

export function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const { format } = useCurrency();
  const primaryImg = product.images?.find((i: any) => i.isPrimary) || product.images?.[0];
  const discount = calculateDiscount(product.price, product.compareAt);
  const outOfStock = product.stock === 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: primaryImg?.url || "",
      quantity: 1,
      slug: product.slug,
      sellerId: product.sellerId,
      sellerName: product.sellerStoreName || product.sellerName,
      stock: product.stock,
    });
    toast.success("Added to cart", { description: product.name });
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {primaryImg?.url ? (
          <Image
            src={primaryImg.url}
            alt={primaryImg.alt || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <ShoppingCart className="w-10 h-10" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount && (
            <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[11px] font-bold">
              -{discount}%
            </span>
          )}
          {product.featured && (
            <span className="px-2 py-0.5 rounded-md bg-black text-white text-[11px] font-bold flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-white" /> Featured
            </span>
          )}
          {outOfStock && (
            <span className="px-2 py-0.5 rounded-md bg-gray-500 text-white text-[11px] font-medium">
              Out of stock
            </span>
          )}
        </div>

        {/* Quick add */}
        <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all",
              outOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800 hover:scale-110"
            )}
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{product.category}</p>
        <h3 className="text-sm font-medium text-gray-800 group-hover:text-black transition-colors line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">{format(product.price)}</span>
            {product.compareAt && (
              <span className="text-xs text-gray-400 line-through">{format(product.compareAt)}</span>
            )}
          </div>
          {product.rating > 0 && (
            <div className="flex items-center gap-0.5 text-xs text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-gray-400 truncate">by {product.sellerStoreName || product.sellerName}</p>
      </div>
    </Link>
  );
}