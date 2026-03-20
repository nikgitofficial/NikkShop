// src/components/chat/ConversationList.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import { formatRelative, cn } from "@/lib/utils";
import { MessageCircle, Loader2 } from "lucide-react";

interface Props {
  currentUserId: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ currentUserId, onSelect }: Props) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchConversations() {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => { setConversations(d.conversations || []); setLoading(false); });
  }

  useEffect(() => {
    fetchConversations();
    const channel = pusherClient.subscribe(`user-${currentUserId}`);
    channel.bind("conversation-updated", fetchConversations);
    return () => pusherClient.unsubscribe(`user-${currentUserId}`);
  }, [currentUserId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      <p className="text-xs text-gray-400">Loading conversations…</p>
    </div>
  );

  if (conversations.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
        <MessageCircle className="w-5 h-5 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-600">No conversations yet</p>
        <p className="text-xs text-gray-400 mt-0.5">Start a chat from any product page</p>
      </div>
    </div>
  );

  return (
    <div className="overflow-y-auto h-full divide-y divide-gray-100">
      {conversations.map((conv) => {
        const other = conv.participantDetails?.find((p: any) => p.userId !== currentUserId);
        const unread = conv.unreadCount?.[currentUserId] || 0;

        return (
          <button
            key={conv._id}
            onClick={() => onSelect(conv._id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left",
              unread > 0 && "bg-blue-50/40"
            )}
          >
            {/* Avatar with role badge */}
            <div className="relative flex-shrink-0">
              {other?.image ? (
                <Image
                  src={other.image}
                  alt={other.name || "User"}
                  width={44}
                  height={44}
                  className="rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
                  {other?.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}

              {/* Role badge */}
              {other?.role && other.role !== "USER" && (
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 text-[8px] font-bold px-1 py-0.5 rounded-full border border-white",
                  other.role === "ADMIN" ? "bg-purple-500 text-white" :
                  other.role === "SELLER" ? "bg-amber-500 text-white" :
                  "bg-gray-500 text-white"
                )}>
                  {other.role === "ADMIN" ? "ADM" : "SEL"}
                </span>
              )}

              {/* Unread badge */}
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 shadow-sm">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"
                  )}>
                    {other?.name || "User"}
                  </p>
                  {/* Role label */}
                  <span className={cn(
                    "text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
                    other?.role === "ADMIN" ? "bg-purple-100 text-purple-600" :
                    other?.role === "SELLER" ? "bg-amber-100 text-amber-600" :
                    "bg-gray-100 text-gray-500"
                  )}>
                    {other?.role || "USER"}
                  </span>
                </div>
                {conv.lastMessageAt && (
                  <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                    {formatRelative(conv.lastMessageAt)}
                  </span>
                )}
              </div>

              {conv.productName && (
                <p className="text-[10px] text-blue-500 font-medium truncate mb-0.5">
                  re: {conv.productName}
                </p>
              )}

              <p className={cn(
                "text-xs truncate",
                unread > 0 ? "text-gray-700 font-semibold" : "text-gray-400"
              )}>
                {conv.lastMessage || "Start a conversation"}
              </p>
            </div>

            {unread > 0 && (
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}