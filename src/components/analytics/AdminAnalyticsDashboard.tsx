// src/components/analytics/AdminAnalyticsDashboard.tsx
"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, ShoppingBag, Package, Users, Store,
  TrendingUp, ArrowUpRight, ArrowDownRight, BarChart2,
  Crown, CheckCircle, XCircle, Clock, Truck,
  RotateCcw, AlertCircle,
} from "lucide-react";
import { CurrencySwitcher } from "@/components/ui/CurrencySwitcher";
import { useCurrency } from "@/context/CurrencyContext";

// ── Types ────────────────────────────────────────────────────────
interface Props {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalUnits: number;
    avgOrderValue: number;
    momGrowth: number;
    totalSellers: number;
    totalBuyers: number;
    totalProducts: number;
    publishedProducts: number;
  };
  monthlyChartData: {
    month: string; label: string;
    revenue: number; orders: number; units: number;
    newUsers: number; newSellers: number;
  }[];
  topSellers: { id: string; name: string; email: string; revenue: number; orders: number; products: number; image?: string }[];
  topProducts: { id: string; name: string; revenue: number; units: number; image?: string; sellerName?: string }[];
  categoryData: { name: string; revenue: number; units: number }[];
  statusBreakdown: Record<string, { count: number; revenue: number }>;
  recentOrders: { id: string; userName: string; total: number; status: string; itemCount: number; createdAt?: string }[];
}

// ── Constants ────────────────────────────────────────────────────
const PALETTE = ["#09090b", "#7c3aed", "#0284c7", "#059669", "#d97706", "#dc2626", "#db2777", "#65a30d"];

const STATUS_META: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  paid:      { color: "#059669", icon: CheckCircle,  label: "Paid" },
  delivered: { color: "#0284c7", icon: CheckCircle,  label: "Delivered" },
  shipped:   { color: "#7c3aed", icon: Truck,        label: "Shipped" },
  pending:   { color: "#d97706", icon: Clock,        label: "Pending" },
  cancelled: { color: "#dc2626", icon: XCircle,      label: "Cancelled" },
  refunded:  { color: "#6b7280", icon: RotateCcw,    label: "Refunded" },
};

function fmtDate(s?: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { color: "#6b7280", icon: AlertCircle, label: status };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
      style={{ background: meta.color + "18", color: meta.color }}
    >
      <meta.icon className="w-2.5 h-2.5" />
      {meta.label}
    </span>
  );
}

type ChartTab = "revenue" | "orders" | "units" | "newUsers";

export function AdminAnalyticsDashboard({
  kpis, monthlyChartData, topSellers, topProducts,
  categoryData, statusBreakdown, recentOrders,
}: Props) {
  const [chartTab, setChartTab] = useState<ChartTab>("revenue");
  const { format, convert, currency } = useCurrency();

  // Abbreviated formatter for charts (respects currency)
  function fmt(n: number) {
    const c = convert(n);
    const symbol = currency === "PHP" ? "₱" : "$";
    if (c >= 1_000_000) return `${symbol}${(c / 1_000_000).toFixed(2)}M`;
    if (c >= 1_000) return `${symbol}${(c / 1_000).toFixed(1)}K`;
    return `${symbol}${c.toFixed(0)}`;
  }

  const maxSellerRev = Math.max(...topSellers.map((s) => s.revenue), 1);
  const maxProductRev = Math.max(...topProducts.map((p) => p.revenue), 1);

  const statusEntries = Object.entries(statusBreakdown)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
  const totalStatusRev = statusEntries.reduce((s, e) => s + e.revenue, 0);

  // Convert monthly chart data for the revenue axis
  const convertedChartData = monthlyChartData.map((d) => ({
    ...d,
    revenue: convert(d.revenue),
  }));

  const kpiCards = [
    {
      label: "Platform Revenue", value: format(kpis.totalRevenue),
      icon: DollarSign, color: "#059669", bg: "#f0fdf4", border: "#bbf7d0",
      sub: `${kpis.momGrowth >= 0 ? "+" : ""}${kpis.momGrowth.toFixed(1)}% vs last month`,
      up: kpis.momGrowth >= 0,
    },
    {
      label: "Total Orders", value: kpis.totalOrders.toLocaleString(),
      icon: ShoppingBag, color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe",
      sub: `${kpis.totalUnits.toLocaleString()} units sold`, up: true,
    },
    {
      label: "Avg Order Value", value: format(kpis.avgOrderValue),
      icon: TrendingUp, color: "#0284c7", bg: "#eff6ff", border: "#bfdbfe",
      sub: "per transaction", up: true,
    },
    {
      label: "Active Sellers", value: kpis.totalSellers.toLocaleString(),
      icon: Store, color: "#d97706", bg: "#fffbeb", border: "#fde68a",
      sub: `${topSellers.length} with sales`, up: true,
    },
    {
      label: "Buyers", value: kpis.totalBuyers.toLocaleString(),
      icon: Users, color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8",
      sub: "registered customers", up: true,
    },
    {
      label: "Products", value: `${kpis.publishedProducts}/${kpis.totalProducts}`,
      icon: Package, color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4",
      sub: "published / total", up: true,
    },
  ];

  const chartTabs: { key: ChartTab; label: string }[] = [
    { key: "revenue",  label: "Revenue" },
    { key: "orders",   label: "Orders" },
    { key: "units",    label: "Units" },
    { key: "newUsers", label: "New Users" },
  ];

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-3.5 text-sm min-w-[140px]">
        <p className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="text-xs font-bold text-gray-800">
              {p.name === "Revenue" ? format(p.value) : p.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-16">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-gray-300" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Admin</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Platform Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Full marketplace overview · last 12 months</p>
        </div>
        <div className="flex items-center gap-3">
          <CurrencySwitcher />
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-violet-50 border border-violet-100">
            <Crown className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700">Admin View</span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {kpiCards.map(({ label, value, icon: Icon, color, bg, border, sub, up }) => (
          <div key={label} className="rounded-2xl p-4 shadow-sm border" style={{ background: bg, borderColor: border }}>
            <div className="flex items-center justify-between mb-3">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-[10px] font-semibold flex items-center gap-0.5" style={{ color }}>
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </span>
            </div>
            <p className="text-xl font-bold leading-tight" style={{ color }}>{value}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">{label}</p>
            <p className="text-[10px] text-gray-300 mt-0.5 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Area Chart ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-semibold text-gray-900">Platform Performance</h2>
            <p className="text-xs text-gray-400">Month-by-month breakdown</p>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
            {chartTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setChartTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  chartTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={convertedChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={72}
              tickFormatter={(v: number) => chartTab === "revenue" ? fmt(v) : v.toLocaleString()}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey={chartTab}
              name={chartTabs.find((t) => t.key === chartTab)?.label ?? chartTab}
              stroke="#7c3aed" strokeWidth={2.5}
              fill="url(#adminGrad)"
              dot={{ r: 3, fill: "#7c3aed", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#7c3aed", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Row 2: Top Sellers + Category Pie ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Top Sellers</h2>
          <p className="text-xs text-gray-400 mb-5">Ranked by platform revenue generated</p>
          {topSellers.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-200">
              <Store className="w-10 h-10 mb-2" />
              <p className="text-sm">No seller data yet</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {topSellers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {s.image
                      ? <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold text-gray-400">{s.name[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{s.orders} orders · {s.products} products</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900 flex-shrink-0">{fmt(s.revenue)}</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(s.revenue / maxSellerRev) * 100}%`, background: PALETTE[i % PALETTE.length] }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Revenue by Category</h2>
          <p className="text-xs text-gray-400 mb-4">Platform-wide share</p>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-200">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm">No data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="revenue" paddingAngle={2}>
                    {categoryData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => format(Number(v ?? 0))}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-1">
                {categoryData.slice(0, 6).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="text-xs text-gray-600 truncate max-w-[110px]">{c.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{fmt(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 3: Top Products + Order Status ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Top Products</h2>
          <p className="text-xs text-gray-400 mb-5">Best-selling across all sellers</p>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-200">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm">No sales yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      : <Package className="w-4 h-4 text-gray-200 m-auto mt-2" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                        {p.sellerName && <p className="text-[10px] text-gray-400 truncate">by {p.sellerName}</p>}
                      </div>
                      <p className="text-xs font-bold text-gray-900 flex-shrink-0">{fmt(p.revenue)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(p.revenue / maxProductRev) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{p.units} sold</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Order Status</h2>
          <p className="text-xs text-gray-400 mb-5">Revenue & count by state</p>
          {statusEntries.length === 0 ? (
            <p className="text-xs text-gray-300 py-6 text-center">No orders</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusEntries} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="count" paddingAngle={2}>
                    {statusEntries.map((e) => <Cell key={e.name} fill={STATUS_META[e.name]?.color ?? "#6b7280"} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, name: any) => [Number(v ?? 0).toLocaleString(), String(name ?? "")]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 mt-3">
                {statusEntries.map((e) => {
                  const pct = totalStatusRev > 0 ? (e.revenue / totalStatusRev) * 100 : 0;
                  const color = STATUS_META[e.name]?.color ?? "#6b7280";
                  return (
                    <div key={e.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-xs capitalize text-gray-600 font-medium">{e.name}</span>
                          <span className="text-[10px] text-gray-300">({e.count})</span>
                        </div>
                        <span className="text-xs font-bold text-gray-800">{fmt(e.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 4: Monthly Bar + User Growth ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Orders & Units</h2>
          <p className="text-xs text-gray-400 mb-5">Monthly volume</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="orders" name="Orders" fill="#09090b" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="units"  name="Units"  fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">User & Seller Growth</h2>
          <p className="text-xs text-gray-400 mb-5">New registrations per month</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Line type="monotone" dataKey="newUsers"   name="Buyers"  stroke="#0284c7" strokeWidth={2} dot={{ r: 3, fill: "#0284c7", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="newSellers" name="Sellers" stroke="#d97706" strokeWidth={2} dot={{ r: 3, fill: "#d97706", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Orders Table ───────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <p className="text-xs text-gray-400">Latest 10 transactions platform-wide</p>
        </div>
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-200">
            <ShoppingBag className="w-10 h-10 mb-2" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Customer", "Items", "Total", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-gray-800 text-sm">{o.userName}</p>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">
                      {o.itemCount} item{o.itemCount !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-gray-900 text-sm">
                      {format(o.total)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-400">
                      {fmtDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}