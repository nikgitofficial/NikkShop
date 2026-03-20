"use client";

export function SortSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 hover:border-gray-300 transition-colors cursor-pointer"
      defaultValue={defaultValue}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set("sort", e.target.value);
        url.searchParams.delete("page");
        window.location.href = url.toString();
      }}
    >
      {[
        { value: "newest", label: "Newest First" },
        { value: "popular", label: "Most Popular" },
        { value: "rating", label: "Top Rated" },
        { value: "price-asc", label: "Price: Low → High" },
        { value: "price-desc", label: "Price: High → Low" },
      ].map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}