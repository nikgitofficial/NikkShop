"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useCurrency } from "@/context/CurrencyContext";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCartStore();
  const { format } = useCurrency();

  const subtotal = totalPrice();
  const shipping = subtotal > 0 && subtotal < 75 ? 8.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="w-10 h-10 text-gray-300" />
      </div>
      <h1 className="text-3xl font-display text-gray-900 mb-3">Your cart is empty</h1>
      <p className="text-gray-400 mb-8">Looks like you haven't added anything yet.</p>
      <Link href="/products" className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-800 transition-colors">
        Browse Products <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display text-gray-900">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-200 transition-all"
            >
              {/* Image */}
              <Link
                href={`/products/${item.slug}`}
                className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50"
              >
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-medium text-gray-800 hover:text-black transition-colors line-clamp-2 leading-snug"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-gray-400 mt-1">by {item.sellerName}</p>
                <p className="text-sm font-semibold text-gray-600 mt-2">
                  {format(item.price)}
                </p>
              </div>

              {/* Quantity + Delete row */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Total price */}
                <p className="text-base font-bold text-gray-900">
                  {format(item.price * item.quantity)}
                </p>

                {/* Quantity stepper */}
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="px-3 py-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-2 text-sm font-semibold text-gray-900 min-w-[36px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="px-3 py-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-display text-gray-900 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
                <span className="font-medium text-gray-900">{format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className={shipping === 0 ? "text-emerald-500 font-medium" : "font-medium text-gray-900"}>
                  {shipping === 0 ? "Free" : format(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Tax (8%)</span>
                <span className="font-medium text-gray-900">{format(tax)}</span>
              </div>

              {shipping > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-600">
                  <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                  Add {format(75 - subtotal)} more for free shipping
                </div>
              )}
            </div>

            <div className="my-5 h-px bg-gray-100" />

            <div className="flex justify-between items-center mb-6">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="text-2xl font-bold text-gray-900">{format(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 w-full py-4 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-800 transition-colors"
            >
              Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/products"
              className="block text-center mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}