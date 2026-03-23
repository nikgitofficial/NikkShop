// src/components/layout/Navbar.tsx
// Place your logo file at: public/logo.png (or .svg / .jpg)
"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  ShoppingBag, Search, Menu, X, User, LogOut,
  LayoutDashboard, Store, ChevronDown, Home, Sparkles, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencySwitcher } from "@/components/ui/CurrencySwitcher";

export function Navbar() {
  const { data: session } = useSession();
  const totalItems = useCartStore((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      requestAnimationFrame(() => setMobileVisible(true));
    } else {
      setMobileVisible(false);
    }
  }, [mobileOpen]);

  function closeMobile() {
    setMobileVisible(false);
    setTimeout(() => setMobileOpen(false), 250);
  }

  useEffect(() => {
    if (!userMenuOpen) return;
    function handler(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const role = (session?.user as any)?.role;
  const dashboardHref = role === "ADMIN" ? "/admin" : role === "SELLER" ? "/seller" : null;

  const navLinks = [
    { href: "/products",               label: "Products", icon: Home },
    { href: "/products?sort=popular",  label: "Popular",  icon: TrendingUp },
    { href: "/products?featured=true", label: "Featured", icon: Sparkles },
  ];

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-300 bg-white",
        scrolled ? "border-b border-gray-200 shadow-sm" : "border-b border-gray-100"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
  <Image
    src="/logo.png"
    alt="NikkShop"
    width={130}
    height={40}
    priority
    className="object-contain h-9 w-auto"
  />
  <span className="text-lg font-bold text-gray-900 tracking-tight">
    NikkShop
  </span>
</Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all font-medium"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {mounted && (
                <div className="hidden sm:block">
                  <CurrencySwitcher />
                </div>
              )}

              <Link
                href="/search"
                className="p-2.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" />
              </Link>

              <Link
                href="/cart"
                className="relative p-2.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                aria-label="Cart"
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {mounted && totalItems > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>

              {/* User menu — desktop */}
              {session ? (
                <div className="relative hidden md:block" data-user-menu>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all ml-1"
                  >
                    {session.user?.image ? (
                      <Image src={session.user.image} alt="" width={26} height={26} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-[26px] h-[26px] rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">
                        {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                    <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden animate-scale-in z-50">
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                        {role && (
                          <span className={cn(
                            "inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide",
                            role === "ADMIN" ? "badge-purple" : role === "SELLER" ? "badge-amber" : "badge-gray"
                          )}>
                            {role}
                          </span>
                        )}
                      </div>
                      <div className="p-1.5">
                        {dashboardHref && (
                          <Link href={dashboardHref} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all" onClick={() => setUserMenuOpen(false)}>
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                        )}
                        <Link href="/account" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all" onClick={() => setUserMenuOpen(false)}>
                          <User className="w-4 h-4" /> My Account
                        </Link>
                        <Link href="/orders" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all" onClick={() => setUserMenuOpen(false)}>
                          <Store className="w-4 h-4" /> My Orders
                        </Link>
                        <div className="my-1 h-px bg-gray-100" />
                        <button
                          onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <LogOut className="w-4 h-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2 ml-1">
                  <Link href="/login" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                    Sign in
                  </Link>
                  <Link href="/register" className="px-4 py-2 text-sm text-white font-medium rounded-lg bg-black hover:bg-gray-800 transition-colors">
                    Get started
                  </Link>
                </div>
              )}

              {/* Hamburger — mobile only */}
              <button
                className="md:hidden ml-1 p-2.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          className={cn(
            "md:hidden fixed inset-0 z-50 flex justify-end",
            "transition-opacity duration-[250ms]",
            mobileVisible ? "opacity-100" : "opacity-0"
          )}
          onClick={closeMobile}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div
            className={cn(
              "relative w-72 max-w-[85vw] bg-white flex flex-col h-full shadow-2xl",
              "transition-transform duration-[250ms] ease-out",
              mobileVisible ? "translate-x-0" : "translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <Link href="/" onClick={closeMobile} className="flex items-center gap-2">
  <Image
    src="/logo.png"
    alt="NikkShop"
    width={100}
    height={32}
    className="object-contain h-8 w-auto"
  />
  <span className="text-base font-bold text-gray-900 tracking-tight">
    NikkShop
  </span>
</Link>
              <button
                onClick={closeMobile}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium"
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  {label}
                </Link>
              ))}

              <div className="my-2 h-px bg-gray-100" />

              {session ? (
                <>
                  {dashboardHref && (
                    <Link href={dashboardHref} onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium">
                      <LayoutDashboard className="w-4 h-4 text-gray-400" /> Dashboard
                    </Link>
                  )}
                  <Link href="/account" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium">
                    <User className="w-4 h-4 text-gray-400" /> My Account
                  </Link>
                  <Link href="/orders" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium">
                    <Store className="w-4 h-4 text-gray-400" /> My Orders
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium">
                    <User className="w-4 h-4 text-gray-400" /> Sign in
                  </Link>
                  <Link href="/register" onClick={closeMobile} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-black text-white hover:bg-gray-800 transition-all font-medium">
                    <Sparkles className="w-4 h-4" /> Get started
                  </Link>
                </>
              )}

              {mounted && (
                <div className="pt-2 px-1">
                  <CurrencySwitcher />
                </div>
              )}
            </nav>

            {/* User info + sign out */}
            {session && (
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-3 px-2 py-1.5 rounded-xl bg-gray-50">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="" width={32} height={32} className="rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{session.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); closeMobile(); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}