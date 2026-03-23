"use client";

// src/components/dashboard/DashboardSidebar.tsx
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Tag, Users,
  LogOut, Plus, Store, BarChart3, ChevronRight,
  MessageCircle, Settings, Menu, X, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  role: "ADMIN" | "SELLER";
  user: { name?: string; email?: string; image?: string };
}

export function DashboardSidebar({ role, user }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [mobileOpen]);

  function closeMobile() {
    setVisible(false);
    setTimeout(() => setMobileOpen(false), 250);
  }

  const adminLinks = [
    { href: "/admin",              label: "Overview",     icon: LayoutDashboard, exact: true },
    { href: "/admin/analytics",    label: "Analytics",    icon: TrendingUp },   // ← NEW
    { href: "/admin/products",     label: "All Products", icon: Package },
    { href: "/admin/orders",       label: "Orders",       icon: ShoppingCart },
    { href: "/admin/categories",   label: "Categories",   icon: Tag },
    { href: "/admin/sellers",      label: "Sellers",      icon: Users },
    { href: "/admin/chat",         label: "All Chats",    icon: MessageCircle },
    { href: "/admin/account",      label: "My Profile",   icon: Settings },
  ];

  const sellerLinks = [
    { href: "/seller",              label: "Overview",    icon: BarChart3,    exact: true },
    { href: "/seller/analytics",    label: "Analytics",   icon: TrendingUp },  // ← NEW
    { href: "/seller/products",     label: "My Products", icon: Package },
    { href: "/seller/products/new", label: "Add Product", icon: Plus },
    { href: "/seller/orders",       label: "My Orders",   icon: ShoppingCart },
    { href: "/seller/chat",         label: "Messages",    icon: MessageCircle },
    { href: "/seller/account",      label: "My Profile",  icon: Settings },
  ];

  const links = role === "ADMIN" ? adminLinks : sellerLinks;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-display text-lg text-gray-900">NikkShop</span>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="mt-3">
          <span className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest",
            role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
          )}>
            {role === "ADMIN" ? "Admin Panel" : "Seller Dashboard"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group",
                active
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0",
                active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span>{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/60" />}
            </Link>
          );
        })}

        <div className="my-2 h-px bg-gray-100" />

        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all group"
        >
          <Store className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          View Storefront
        </Link>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <Link
          href={role === "ADMIN" ? "/admin/account" : "/seller/account"}
          onClick={onClose}
          className="flex items-center gap-3 mb-3 px-2 hover:bg-gray-50 rounded-xl py-1.5 transition-colors"
        >
          {user.image ? (
            <Image src={user.image} alt="" width={32} height={32} className="rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <Settings className="w-3.5 h-3.5 text-gray-300" />
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-gray-200 bg-white flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-display text-base text-gray-900">NikkShop</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-widest",
            role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
          )}>
            {role}
          </span>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer overlay ─────────────────────────── */}
      {mobileOpen && (
        <div
          className={cn(
            "lg:hidden fixed inset-0 z-50 flex",
            "transition-opacity duration-[250ms]",
            visible ? "opacity-100" : "opacity-0"
          )}
          onClick={closeMobile}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Drawer */}
          <div
            className={cn(
              "relative w-72 max-w-[85vw] bg-white flex flex-col min-h-screen shadow-2xl",
              "transition-transform duration-[250ms] ease-out",
              visible ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onClose={closeMobile} />
          </div>
        </div>
      )}
    </>
  );
}