"use client";

// src/components/analytics/SellerAnalyticsDashboard.tsx
import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Package, Eye, BarChart2, PieChart as PieIcon,
  Zap, ArrowUpRight, ArrowDownRight, Target, Activity,
  Download, FileSpreadsheet, FileText, Search, Filter,
  X, Calendar, ChevronDown, SlidersHorizontal,
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { CurrencySwitcher } from "./CurrencySwitcher";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalUnits: number;
    avgOrderValue: number;
    conversionRate: number;
    momGrowth: number;
  };
  monthlyChartData: { month: string; label: string; revenue: number; orders: number; units: number }[];
  topProducts: { id: string; name: string; revenue: number; units: number; image?: string }[];
  topByViews: { id: string; name: string; views: number; image?: string }[];
  categoryData: { name: string; revenue: number; units: number }[];
  statusBreakdown: Record<string, number>;
  totalProducts: number;
  publishedProducts: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ["#18181b", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0284c7", "#db2777", "#65a30d"];

const STATUS_COLORS: Record<string, string> = {
  paid: "#059669",
  delivered: "#0284c7",
  shipped: "#7c3aed",
  pending: "#d97706",
  cancelled: "#dc2626",
  refunded: "#6b7280",
};

// Month index for ordering
const MONTH_ORDER: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

type Tab = "revenue" | "orders" | "units";
type ExportFormat = "excel" | "pdf";

// ─── Export Utilities ─────────────────────────────────────────────────────────

/** Convert array of objects to CSV string */
function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

/** Trigger a file download in the browser */
function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export data to Excel-compatible CSV */
function exportToExcel(
  filteredMonthly: Props["monthlyChartData"],
  filteredProducts: Props["topProducts"],
  categoryData: Props["categoryData"],
  statusBreakdown: Record<string, number>,
  formatFn: (n: number) => string
) {
  const sections: string[] = [];

  // Section 1: Monthly Performance
  sections.push("Monthly Performance");
  sections.push(toCSV(
    ["Month", "Revenue", "Orders", "Units"],
    filteredMonthly.map((r) => [r.label, formatFn(r.revenue), r.orders, r.units])
  ));

  sections.push("\nTop Products by Revenue");
  sections.push(toCSV(
    ["Rank", "Product", "Revenue", "Units Sold"],
    filteredProducts.map((p, i) => [i + 1, p.name, formatFn(p.revenue), p.units])
  ));

  sections.push("\nCategory Breakdown");
  sections.push(toCSV(
    ["Category", "Revenue", "Units"],
    categoryData.map((c) => [c.name, formatFn(c.revenue), c.units])
  ));

  sections.push("\nOrder Status");
  sections.push(toCSV(
    ["Status", "Revenue"],
    Object.entries(statusBreakdown).map(([k, v]) => [k, formatFn(v)])
  ));

  downloadFile(sections.join("\n"), "seller_analytics.csv", "text/csv;charset=utf-8;");
}

/** Export data to a printable HTML page (opens in new tab for Save as PDF) */
function exportToPDF(
  filteredMonthly: Props["monthlyChartData"],
  filteredProducts: Props["topProducts"],
  categoryData: Props["categoryData"],
  statusBreakdown: Record<string, number>,
  kpis: Props["kpis"],
  formatFn: (n: number) => string
) {
  const tableRow = (cells: (string | number)[], header = false) => {
    const tag = header ? "th" : "td";
    return `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;
  };
  const table = (headers: string[], rows: (string | number)[][]) =>
    `<table><thead>${tableRow(headers, true)}</thead><tbody>${rows.map((r) => tableRow(r)).join("")}</tbody></table>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Seller Analytics Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111; margin: 40px; font-size: 13px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: 600; margin: 28px 0 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    .meta { color: #6b7280; font-size: 12px; margin-bottom: 32px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
    .kpi-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
    th { background: #f3f4f6; text-align: left; padding: 7px 10px; font-weight: 600; color: #374151; }
    td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
    tr:last-child td { border: none; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Seller Analytics Report</h1>
  <p class="meta">Generated ${new Date().toLocaleString()} &nbsp;·&nbsp; 12-month overview</p>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Total Revenue</div><div class="kpi-value">${formatFn(kpis.totalRevenue)}</div></div>
    <div class="kpi"><div class="kpi-label">Total Orders</div><div class="kpi-value">${kpis.totalOrders.toLocaleString()}</div></div>
    <div class="kpi"><div class="kpi-label">Units Sold</div><div class="kpi-value">${kpis.totalUnits.toLocaleString()}</div></div>
    <div class="kpi"><div class="kpi-label">Avg Order Value</div><div class="kpi-value">${formatFn(kpis.avgOrderValue)}</div></div>
    <div class="kpi"><div class="kpi-label">Conversion Rate</div><div class="kpi-value">${kpis.conversionRate.toFixed(2)}%</div></div>
    <div class="kpi"><div class="kpi-label">MoM Growth</div><div class="kpi-value">${kpis.momGrowth.toFixed(1)}%</div></div>
  </div>

  <h2>Monthly Performance</h2>
  ${table(["Month", "Revenue", "Orders", "Units"], filteredMonthly.map((r) => [r.label, formatFn(r.revenue), r.orders, r.units]))}

  <h2>Top Products by Revenue</h2>
  ${table(["Rank", "Product", "Revenue", "Units Sold"], filteredProducts.map((p, i) => [i + 1, p.name, formatFn(p.revenue), p.units]))}

  <h2>Category Breakdown</h2>
  ${table(["Category", "Revenue", "Units"], categoryData.map((c) => [c.name, formatFn(c.revenue), c.units]))}

  <h2>Order Status</h2>
  ${table(["Status", "Revenue"], Object.entries(statusBreakdown).map(([k, v]) => [k.charAt(0).toUpperCase() + k.slice(1), formatFn(v)]))}

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

/** Pill badge for active filters */
function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black text-white text-[11px] font-medium">
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity"><X className="w-3 h-3" /></button>
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function SellerAnalyticsDashboard({
  kpis, monthlyChartData, topProducts, topByViews,
  categoryData, statusBreakdown, totalProducts, publishedProducts,
}: Props) {
  const [tab, setTab] = useState<Tab>("revenue");
  const { format, convert, currency } = useCurrency();

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [startMonth, setStartMonth] = useState<string>("");   // e.g. "Jan"
  const [endMonth, setEndMonth] = useState<string>("");       // e.g. "Dec"
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Available options
  const monthLabels = monthlyChartData.map((d) => d.label);
  const categories = categoryData.map((c) => c.name);
  const statuses = Object.keys(statusBreakdown);

  // ── Filtered monthly data ──
  const filteredMonthly = useMemo(() => {
    return monthlyChartData.filter((d) => {
      const idx = MONTH_ORDER[d.label] ?? d.label;
      const start = startMonth ? MONTH_ORDER[startMonth] ?? 0 : 0;
      const end = endMonth ? MONTH_ORDER[endMonth] ?? 11 : 11;
      return (idx as number) >= start && (idx as number) <= end;
    });
  }, [monthlyChartData, startMonth, endMonth]);

  // ── Filtered products (by search) ──
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return topProducts;
    return topProducts.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [topProducts, search]);

  // ── Filtered top-by-views (by search) ──
  const filteredViews = useMemo(() => {
    if (!search.trim()) return topByViews;
    return topByViews.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [topByViews, search]);

  // ── Filtered category data ──
  const filteredCategories = useMemo(() => {
    if (!categoryFilter) return categoryData;
    return categoryData.filter((c) => c.name === categoryFilter);
  }, [categoryData, categoryFilter]);

  // ── Filtered status breakdown ──
  const filteredStatus = useMemo(() => {
    if (!statusFilter) return statusBreakdown;
    return Object.fromEntries(
      Object.entries(statusBreakdown).filter(([k]) => k === statusFilter)
    );
  }, [statusBreakdown, statusFilter]);

  // ── Derived filtered KPIs from filtered monthly ──
  const filteredKpis = useMemo(() => {
    const rev = filteredMonthly.reduce((s, d) => s + d.revenue, 0);
    const orders = filteredMonthly.reduce((s, d) => s + d.orders, 0);
    const units = filteredMonthly.reduce((s, d) => s + d.units, 0);
    return {
      ...kpis,
      totalRevenue: rev || kpis.totalRevenue,
      totalOrders: orders || kpis.totalOrders,
      totalUnits: units || kpis.totalUnits,
      avgOrderValue: orders > 0 ? rev / orders : kpis.avgOrderValue,
    };
  }, [filteredMonthly, kpis]);

  // ── Active filter count ──
  const activeFilters = [search, startMonth, endMonth, categoryFilter, statusFilter].filter(Boolean).length;

  // ── Helpers ──
  function formatCompact(n: number) {
    const v = convert(n);
    const symbol = currency === "PHP" ? "₱" : "$";
    if (v >= 1_000_000) return `${symbol}${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${symbol}${(v / 1_000).toFixed(1)}K`;
    return `${symbol}${v.toFixed(0)}`;
  }

  const clearAllFilters = () => {
    setSearch(""); setStartMonth(""); setEndMonth("");
    setCategoryFilter(""); setStatusFilter("");
  };

  const handleExport = (fmt: ExportFormat) => {
    setExportOpen(false);
    if (fmt === "excel") {
      exportToExcel(filteredMonthly, filteredProducts, filteredCategories, filteredStatus, format);
    } else {
      exportToPDF(filteredMonthly, filteredProducts, filteredCategories, filteredStatus, filteredKpis, format);
    }
  };

  const maxRev = Math.max(...filteredProducts.map((p) => p.revenue), 1);
  const statusData = Object.entries(filteredStatus).map(([name, value]) => ({ name, value }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="text-xs">
            {p.name}: {p.name === "Revenue" ? format(p.value) : p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  const kpiCards = [
    { label: "Total Revenue", value: format(filteredKpis.totalRevenue), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", trend: kpis.momGrowth, trendLabel: "vs last month" },
    { label: "Total Orders", value: filteredKpis.totalOrders.toLocaleString(), icon: ShoppingBag, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", trend: null, trendLabel: "fulfilled" },
    { label: "Units Sold", value: filteredKpis.totalUnits.toLocaleString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", trend: null, trendLabel: "items shipped" },
    { label: "Avg Order Value", value: format(filteredKpis.avgOrderValue), icon: Target, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", trend: null, trendLabel: "per transaction" },
    { label: "Conversion Rate", value: `${kpis.conversionRate.toFixed(2)}%`, icon: Zap, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200", trend: null, trendLabel: "views → sales" },
    { label: "Published", value: `${publishedProducts} / ${totalProducts}`, icon: Activity, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", trend: null, trendLabel: "products live" },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-5 h-5 text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Analytics</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">12-month performance overview for your store</p>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySwitcher />

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportOpen ? "rotate-180" : ""}`} />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => handleExport("excel")}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Export to Excel (.csv)
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    onClick={() => handleExport("pdf")}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    Export to PDF
                  </button>
                </div>
              )}
              {exportOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle filters */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              showFilters || activeFilters > 0
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <span className="ml-0.5 w-5 h-5 rounded-full bg-white text-gray-900 text-[10px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date range: Start month */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />From Month
              </label>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all text-gray-700"
              >
                <option value="">All months</option>
                {monthLabels.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Date range: End month */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />To Month
              </label>
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all text-gray-700"
              >
                <option value="">All months</option>
                {monthLabels.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                <Filter className="w-3 h-3 inline mr-1" />Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all text-gray-700"
              >
                <option value="">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                <Filter className="w-3 h-3 inline mr-1" />Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all text-gray-700"
              >
                <option value="">All statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active filter pills */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-medium">Active:</span>
            {search && <FilterBadge label={`Search: "${search}"`} onRemove={() => setSearch("")} />}
            {startMonth && <FilterBadge label={`From: ${startMonth}`} onRemove={() => setStartMonth("")} />}
            {endMonth && <FilterBadge label={`To: ${endMonth}`} onRemove={() => setEndMonth("")} />}
            {categoryFilter && <FilterBadge label={`Category: ${categoryFilter}`} onRemove={() => setCategoryFilter("")} />}
            {statusFilter && <FilterBadge label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter("")} />}
            <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-gray-700 underline ml-1 transition-colors">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {kpiCards.map(({ label, value, icon: Icon, color, bg, border, trend, trendLabel }) => (
          <div key={label} className={`border ${border} ${bg} rounded-2xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <Icon className={`w-4 h-4 ${color}`} />
              {trend !== null && (
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(trend).toFixed(1)}%
                </span>
              )}
            </div>
            <p className={`text-xl font-bold ${color} leading-tight`}>{value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{label}</p>
            <p className="text-[10px] text-gray-300">{trendLabel}</p>
          </div>
        ))}
      </div>

      {/* ── Main Chart ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-semibold text-gray-900">Performance Over Time</h2>
            <p className="text-xs text-gray-400">
              {startMonth || endMonth
                ? `${startMonth || "Start"} – ${endMonth || "End"}`
                : "Last 12 months"}
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(["revenue", "orders", "units"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {filteredMonthly.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[280px] text-gray-300">
            <Calendar className="w-10 h-10 mb-2" />
            <p className="text-sm">No data for selected range</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={filteredMonthly} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#18181b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => tab === "revenue" ? formatCompact(v) : v.toLocaleString()}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={tab}
                name={tab.charAt(0).toUpperCase() + tab.slice(1)}
                stroke="#18181b"
                strokeWidth={2}
                fill="url(#areaGrad)"
                dot={{ r: 3, fill: "#18181b", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#18181b", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Row 2: Top Products + Category Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

        {/* Top Products by Revenue */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900">Top Products</h2>
            {search && (
              <span className="text-xs text-gray-400">
                {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-5">Ranked by revenue (last 12 months)</p>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm">{search ? `No products matching "${search}"` : "No sales data yet"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 group">
                  <span className="text-xs font-bold text-gray-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      : <Package className="w-4 h-4 text-gray-300 m-auto mt-2" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-800 truncate pr-2">{p.name}</p>
                      <p className="text-xs font-bold text-gray-900 flex-shrink-0">{formatCompact(p.revenue)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-black rounded-full transition-all" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{p.units} sold</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown Pie */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">By Category</h2>
          <p className="text-xs text-gray-400 mb-4">Revenue share{categoryFilter ? ` · ${categoryFilter}` : ""}</p>

          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <PieIcon className="w-10 h-10 mb-2" />
              <p className="text-sm">No data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={filteredCategories} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="revenue" paddingAngle={2}>
                    {filteredCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [format(v), "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {filteredCategories.slice(0, 5).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-gray-600 truncate max-w-[100px]">{c.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{formatCompact(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 3: Monthly Bar + Order Status + Top Views ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Orders + Units Bar */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Orders & Units</h2>
          <p className="text-xs text-gray-400 mb-5">Monthly breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={filteredMonthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Bar dataKey="orders" name="Orders" fill="#18181b" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="units" name="Units" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Order Status Breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1 text-sm">Order Status</h2>
            <p className="text-xs text-gray-400 mb-4">Revenue by fulfillment state{statusFilter ? ` · ${statusFilter}` : ""}</p>
            {statusData.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-4">No data</p>
            ) : (
              <div className="space-y-2.5">
                {statusData.sort((a, b) => b.value - a.value).map((s) => {
                  const total = statusData.reduce((sum, x) => sum + x.value, 0);
                  const pct = total > 0 ? (s.value / total) * 100 : 0;
                  const color = STATUS_COLORS[s.name] ?? "#6b7280";
                  return (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs capitalize text-gray-600 font-medium">{s.name}</span>
                        <span className="text-xs font-bold text-gray-800">{formatCompact(s.value)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top by Views */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900 text-sm">Most Viewed</h2>
              {search && <span className="text-xs text-gray-400">{filteredViews.length} result{filteredViews.length !== 1 ? "s" : ""}</span>}
            </div>
            <p className="text-xs text-gray-400 mb-4">Products driving traffic</p>
            {filteredViews.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-gray-300">
                <Eye className="w-8 h-8 mb-1" />
                <p className="text-xs">{search ? `No results for "${search}"` : "No views yet"}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredViews.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-gray-300 w-3">{i + 1}</span>
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : <Eye className="w-3 h-3 text-gray-300 m-auto mt-2" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 truncate">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Eye className="w-3 h-3 text-gray-300" />
                      <span className="text-xs font-semibold text-gray-700">{p.views.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}