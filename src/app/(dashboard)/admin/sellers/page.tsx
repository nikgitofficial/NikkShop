// src/app/(dashboard)/admin/sellers/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, X, Store, Users, Loader2, MessageCircle } from "lucide-react";
import { formatRelative, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/sellers")
      .then((r) => r.json())
      .then((d) => { setSellers(d.sellers || []); setLoading(false); });
  }, []);

  async function handleApproval(sellerId: string, approved: boolean) {
    setActioning(sellerId);
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, approved }),
      });
      if (!res.ok) throw new Error();
      toast.success(approved ? "Seller approved!" : "Seller rejected.");
      setSellers((s) =>
        s.map((seller) =>
          seller._id === sellerId
            ? { ...seller, sellerProfile: { ...seller.sellerProfile, approved } }
            : seller
        )
      );
    } catch {
      toast.error("Action failed");
    } finally {
      setActioning(null);
    }
  }

  async function handleChat(sellerId: string) {
    setChatLoading(sellerId);
    try {
      const res = await fetch("/api/conversations/admin-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: sellerId }),
      });
      const data = await res.json();
      if (data.conversation) {
        // Open chat widget with this conversation
        window.dispatchEvent(new CustomEvent("open-chat", {
          detail: { conversationId: data.conversation._id },
        }));
        toast.success("Chat opened!");
      }
    } catch {
      toast.error("Failed to open chat");
    } finally {
      setChatLoading(null);
    }
  }

  const filtered = sellers.filter((s) => {
    if (filter === "pending") return !s.sellerProfile?.approved;
    if (filter === "approved") return s.sellerProfile?.approved;
    return true;
  });

  const pendingCount = sellers.filter((s) => !s.sellerProfile?.approved).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-gray-900">Seller Management</h1>
        <p className="text-gray-500 text-sm mt-1">Approve, reject, or chat with sellers</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all", label: `All (${sellers.length})` },
          { value: "pending", label: `Pending (${pendingCount})` },
          { value: "approved", label: `Approved (${sellers.length - pendingCount})` },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value as any)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
              filter === value
                ? "bg-black text-white border-black"
                : "bg-white text-gray-500 border-gray-200 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {label}
            {value === "pending" && pendingCount > 0 && (
              <span className="ml-2 w-5 h-5 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400">No sellers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((seller) => {
            const approved = seller.sellerProfile?.approved;
            return (
              <div key={seller._id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-gray-300 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold flex-shrink-0">
                  {seller.name?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{seller.name}</p>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                      approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{seller.email}</p>
                  {seller.sellerProfile?.storeName && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Store className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600 font-medium">{seller.sellerProfile.storeName}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-300 mt-1">Joined {formatRelative(seller.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Chat button */}
                  <button
                    onClick={() => handleChat(seller._id)}
                    disabled={chatLoading === seller._id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-all text-sm font-medium disabled:opacity-50"
                  >
                    {chatLoading === seller._id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <MessageCircle className="w-3.5 h-3.5" />}
                    Chat
                  </button>

                  {!approved ? (
                    <>
                      <button
                        onClick={() => handleApproval(seller._id, true)}
                        disabled={actioning === seller._id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all text-sm font-medium disabled:opacity-50"
                      >
                        {actioning === seller._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(seller._id, false)}
                        disabled={actioning === seller._id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all text-sm font-medium disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleApproval(seller._id, false)}
                      disabled={actioning === seller._id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all text-sm"
                    >
                      <X className="w-3.5 h-3.5" /> Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}