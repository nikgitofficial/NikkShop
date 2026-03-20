// src/components/chat/ChatSellerButton.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";

interface Props {
  sellerId: string;
  productId?: string;
  productName?: string;
  productImage?: string;
}

export function ChatSellerButton({ sellerId, productId, productName, productImage }: Props) {
  const { data: session } = useSession();
  const router            = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChat() {
    if (!session) {
      router.push("/login");
      return;
    }
    if (session.user.id === sellerId) return;

    setLoading(true);
    try {
      const res  = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: sellerId, productId, productName, productImage }),
      });
      const data = await res.json();
      if (data.conversation) {
        window.dispatchEvent(
          new CustomEvent("open-chat", {
            detail: { conversationId: data.conversation._id },
          })
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (session?.user?.id === sellerId) return null;

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-600 hover:text-gray-900 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
        : <MessageCircle className="w-3.5 h-3.5" />
      }
      {loading ? "Starting…" : "Chat"}
    </button>
  );
}