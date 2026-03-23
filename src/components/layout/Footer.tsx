// src/components/layout/Footer.tsx
// Place your logo file at: public/logo.png (or .svg / .jpg)
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Zap, RefreshCcw, ArrowRight } from "lucide-react";

const NAV_COLS = [
  {
    title: "Shop",
    links: [
      { href: "/products",               label: "All Products" },
      { href: "/products?featured=true", label: "Featured" },
      { href: "/products?sort=newest",   label: "New Arrivals" },
      { href: "/products?sort=popular",  label: "Best Sellers" },
    ],
  },
  {
    title: "Sell",
    links: [
      { href: "/register?role=seller",   label: "Become a Seller" },
      { href: "/seller",                 label: "Seller Dashboard" },
      { href: "/seller/products/new",    label: "List a Product" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/account", label: "My Account" },
      { href: "/orders",  label: "Order History" },
      { href: "/cart",    label: "Shopping Cart" },
      { href: "/login",   label: "Sign In" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms",   label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

const TRUST = [
  { icon: ShieldCheck, label: "Secure payments", sub: "SSL & Stripe" },
  { icon: Zap,         label: "Fast delivery",   sub: "Digital instant" },
  { icon: RefreshCcw,  label: "Easy returns",    sub: "30-day policy" },
];

const TECH_STACK = [
  { label: "Next.js 15",  href: "https://nextjs.org" },
  { label: "MongoDB",     href: "https://mongodb.com" },
  { label: "Stripe",      href: "https://stripe.com" },
  { label: "Vercel Blob", href: "https://vercel.com/storage/blob" },
  { label: "Pusher",      href: "https://pusher.com" },
];

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-24">

      {/* ── Newsletter / CTA strip ── */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Start selling on NikShop</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Join thousands of sellers reaching buyers worldwide.
              </p>
            </div>
            <Link
              href="/register?role=seller"
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              Open your store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Brand col */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
  <Image
    src="/logo.png"
    alt="NikShop"
    width={120}
    height={38}
    className="object-contain h-9 w-auto"
  />
  <span className="text-lg font-bold text-gray-900 tracking-tight">
    NikkShop
  </span>
</Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              A modern multi-seller marketplace where independent sellers connect with buyers worldwide.
            </p>

            {/* Trust badges */}
            <div className="space-y-3">
              {TRUST.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 leading-none">{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav cols */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {NAV_COLS.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} NikShop. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span className="text-[10px] text-gray-300 mr-1">Built with</span>
              {TECH_STACK.map((t, i) => (
                <span key={t.label} className="flex items-center gap-1.5">
                  <a
                    href={t.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-gray-400 hover:text-gray-700 transition-colors font-medium"
                  >
                    {t.label}
                  </a>
                  {i < TECH_STACK.length - 1 && (
                    <span className="text-gray-200 text-[10px]">·</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}