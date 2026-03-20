// src/components/chat/ContactAdminButton.tsx
"use client";

import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ContactAdminButton() {
  const [loading, setLoading] = useState(false);

  async function handleContact() {
    setLoading(true);
    try {
      // First find an admin user
      const adminRes = await fetch("/api/admin/find");
      const adminData = await adminRes.json();
      if (!adminData.adminId) throw new Error("No admin found");

      // Create or get conversation with admin
      const res = await fetch("/api/conversations/admin-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: adminData.adminId }),
      });
      const data = await res.json();
      if (data.conversation) {
        window.dispatchEvent(new CustomEvent("open-chat", {
          detail: { conversationId: data.conversation._id },
        }));
        toast.success("Connected to admin support!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to contact admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleContact}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
      Contact Admin
    </button>
  );
}