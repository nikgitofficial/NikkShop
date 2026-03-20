// src/app/(dashboard)/admin/orders/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
  Loader2,
  ChevronDown,
  Package,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_STYLE: Record<
  string,
  { pill: string; dot: string; label: string }
> = {
  pending:    { pill: "bg-amber-50 border-amber-200 text-amber-700",       dot: "bg-amber-400",   label: "Pending" },
  paid:       { pill: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500", label: "Paid" },
  processing: { pill: "bg-blue-50 border-blue-200 text-blue-700",          dot: "bg-blue-500",    label: "Processing" },
  shipped:    { pill: "bg-indigo-50 border-indigo-200 text-indigo-700",    dot: "bg-indigo-500",  label: "Shipped" },
  delivered:  { pill: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500", label: "Delivered" },
  cancelled:  { pill: "bg-red-50 border-red-200 text-red-600",             dot: "bg-red-400",     label: "Cancelled" },
  refunded:   { pill: "bg-gray-100 border-gray-200 text-gray-500",         dot: "bg-gray-400",    label: "Refunded" },
};

const FILTER_TABS = [
  { key: "all",        label: "All Orders" },
  { key: "pending",    label: "Pending" },
  { key: "paid",       label: "Paid" },
  { key: "processing", label: "Processing" },
  { key: "shipped",    label: "Shipped" },
  { key: "delivered",  label: "Delivered" },
  { key: "cancelled",  label: "Cancelled" },
  { key: "refunded",   label: "Refunded" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const searchRef               = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setLoading(false);
      });
  }, []);

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order status updated to "${status}"`);
      setOrders((o) =>
        o.map((x) => (x._id === orderId ? { ...x, status } : x))
      );
    } catch {
      toast.error("Failed to update order status. Please try again.");
    }
    setUpdating(null);
  }

  // Normalise query — strip leading "#" and whitespace, uppercase for comparison
  const query = search.replace(/^#\s*/, "").trim().toUpperCase();

  const filtered = orders
    .filter((o) => (filter === "all" ? true : o.status === filter))
    .filter((o) => (query ? o._id.slice(-8).toUpperCase().includes(query) : true));

  const hasSearch = query.length > 0;

  // Highlights the matched segment inside the 8-char order ID
  function HighlightedId({ id }: { id: string }) {
    const shortId = id.slice(-8).toUpperCase();
    if (!hasSearch || !shortId.includes(query)) {
      return <span>#{shortId}</span>;
    }
    const idx = shortId.indexOf(query);
    return (
      <>
        #{shortId.slice(0, idx)}
        <mark className="bg-amber-200 text-amber-900 rounded-sm not-italic px-0.5">
          {shortId.slice(idx, idx + query.length)}
        </mark>
        {shortId.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </Link>

        <div className="flex items-start justify-between gap-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 leading-tight">
              All Orders
            </h1>
            <p className="text-gray-400 text-sm mt-1.5">
              {orders.length > 0
                ? `${orders.length.toLocaleString()} order${orders.length !== 1 ? "s" : ""} across all statuses`
                : "Manage and track customer orders"}
            </p>
          </div>

          {/* Order ID search — top-right of header, compact & unobtrusive */}
          <div className="flex-shrink-0 mt-0.5">
            <div
              className={cn(
                "flex items-center gap-2 bg-white border rounded-xl px-3 py-2 shadow-sm transition-all duration-150",
                hasSearch
                  ? "border-gray-400 ring-2 ring-gray-900/5"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Order ID…"
                spellCheck={false}
                className="w-44 text-xs text-gray-700 placeholder:text-gray-400 bg-transparent outline-none font-mono tracking-wide"
              />
              {hasSearch && (
                <button
                  onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                  className="p-0.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Live feedback beneath the input */}
            {hasSearch && (
              <p className="text-[11px] mt-1.5 text-right pr-0.5">
                {filtered.length === 0 ? (
                  <span className="text-red-400 font-medium">No match for #{query}</span>
                ) : (
                  <span className="text-gray-400">
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""}{" "}
                    <span className="text-gray-300">·</span>{" "}
                    <button
                      onClick={() => setSearch("")}
                      className="text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
                    >
                      clear
                    </button>
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTER_TABS.map(({ key, label }) => {
          const count =
            key === "all"
              ? orders.length
              : orders.filter((o) => o.status === key).length;
          const isActive = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                isActive
                  ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              {label}
              {count > 0 && (
                <span className={cn("ml-1.5 text-[10px] font-bold", isActive ? "text-white/60" : "text-gray-400")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl flex items-center justify-center py-24 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <p className="text-sm text-gray-400">Loading orders…</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            {hasSearch ? (
              <Search className="w-6 h-6 text-gray-400" />
            ) : (
              <ShoppingCart className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <p className="text-sm font-semibold text-gray-600">
            {hasSearch ? `No order matching "#${query}"` : "No orders found"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {hasSearch
              ? "Try searching with fewer characters or check the ID."
              : filter === "all"
              ? "No orders have been placed yet."
              : `No orders with status "${filter}" found.`}
          </p>
          {hasSearch && (
            <button
              onClick={() => setSearch("")}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 transition-colors"
            >
              <X className="w-3 h-3" /> Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {["Order ID", "Customer", "Items", "Status", "Total", "Date", "Update Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 first:pl-5 last:pr-5 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => {
                  const style = STATUS_STYLE[order.status] || STATUS_STYLE["refunded"];
                  return (
                    <tr
                      key={order._id}
                      className={cn(
                        "transition-colors hover:bg-gray-50/60",
                        hasSearch && "bg-amber-50/30"
                      )}
                    >
                      {/* Order ID */}
                      <td className="px-4 py-3.5 pl-5">
                        <p className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-lg px-2 py-0.5 inline-flex items-center gap-0.5">
                          <HighlightedId id={order._id} />
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0">
                            {order.userName?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[130px]">{order.userName}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[130px]">{order.userEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          <span className="text-sm text-gray-600 font-medium">
                            {order.items?.length}
                            <span className="text-gray-400 font-normal"> item{order.items?.length !== 1 ? "s" : ""}</span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border", style.pill)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)} />
                          {style.label}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-gray-800">{formatPrice(order.total)}</p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</p>
                      </td>

                      {/* Update Status */}
                      <td className="px-4 py-3.5 pr-5">
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                            disabled={updating === order._id}
                            className="appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-medium outline-none focus:border-gray-400 transition-colors capitalize pr-7 disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s} className="capitalize">{s}</option>
                            ))}
                          </select>
                          {updating === order._id ? (
                            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-gray-400" />
                          ) : (
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-600">{filtered.length}</span>{" "}
              of{" "}
              <span className="font-semibold text-gray-600">{orders.length}</span>{" "}
              orders
              {hasSearch && (
                <>
                  {" "}·{" "}
                  <button
                    onClick={() => setSearch("")}
                    className="text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
                  >
                    clear search
                  </button>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400">Changes save automatically</p>
          </div>
        </div>
      )}
    </div>
  );
}