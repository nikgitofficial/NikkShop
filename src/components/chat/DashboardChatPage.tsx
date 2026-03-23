"use client";

// src/components/chat/DashboardChatPage.tsx
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import { ChatWindow } from "./ChatWindow";
import { formatRelative, cn } from "@/lib/utils";
import { MessageCircle, Loader2, Search, X } from "lucide-react";

interface Props {
  currentUserId: string;
  role: "ADMIN" | "SELLER";
}

function ConversationItem({
  conv,
  currentUserId,
  active,
  onClick,
}: {
  conv: any;
  currentUserId: string;
  active: boolean;
  onClick: () => void;
}) {
  const other  = conv.participantDetails?.find((p: any) => p.userId !== currentUserId);
  const unread = conv.unreadCount?.[currentUserId] || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left border-b border-gray-100",
        active
          ? "bg-gray-900 border-gray-900"
          : unread > 0
          ? "bg-blue-50/40 hover:bg-gray-50"
          : "hover:bg-gray-50"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {other?.image ? (
          <Image
            src={other.image}
            alt={other?.name || "User"}
            width={44}
            height={44}
            className="rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <div className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
            active ? "bg-white text-gray-900" : "bg-gray-900 text-white"
          )}>
            {other?.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        {other?.role && other.role !== "USER" && (
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 text-[8px] font-bold px-1 py-0.5 rounded-full border-2",
            active ? "border-gray-900" : "border-white",
            other.role === "ADMIN" ? "bg-purple-500 text-white" : "bg-amber-500 text-white"
          )}>
            {other.role === "ADMIN" ? "ADM" : "SEL"}
          </span>
        )}
        {unread > 0 && !active && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={cn(
            "text-sm truncate",
            active ? "font-semibold text-white" :
            unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"
          )}>
            {other?.name || "User"}
          </p>
          {conv.lastMessageAt && (
            <span className={cn(
              "text-[10px] flex-shrink-0 ml-2",
              active ? "text-gray-400" : "text-gray-400"
            )}>
              {formatRelative(conv.lastMessageAt)}
            </span>
          )}
        </div>

        {conv.productName && (
          <p className={cn(
            "text-[10px] font-medium truncate mb-0.5",
            active ? "text-blue-300" : "text-blue-500"
          )}>
            re: {conv.productName}
          </p>
        )}

        <p className={cn(
          "text-xs truncate",
          active ? "text-gray-400" :
          unread > 0 ? "text-gray-700 font-semibold" : "text-gray-400"
        )}>
          {conv.lastMessage || "Start a conversation"}
        </p>
      </div>

      {unread > 0 && !active && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
      )}
    </button>
  );
}

export function DashboardChatPage({ currentUserId, role }: Props) {
  const [conversations, setConversations]   = useState<any[]>([]);
  const [filtered, setFiltered]             = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeId, setActiveId]             = useState<string | null>(null);
  const [search, setSearch]                 = useState("");
  const [totalUnread, setTotalUnread]       = useState(0);

  const fetchConversations = useCallback(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        const convs = d.conversations || [];
        setConversations(convs);
        setLoading(false);
        const unread = convs.reduce((sum: number, c: any) => sum + (c.unreadCount?.[currentUserId] || 0), 0);
        setTotalUnread(unread);
      });
  }, [currentUserId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Realtime updates
  useEffect(() => {
    const channel = pusherClient.subscribe(`user-${currentUserId}`);
    channel.bind("conversation-updated", fetchConversations);
    return () => pusherClient.unsubscribe(`user-${currentUserId}`);
  }, [currentUserId, fetchConversations]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) { setFiltered(conversations); return; }
    const q = search.toLowerCase();
    setFiltered(conversations.filter((c) => {
      const other = c.participantDetails?.find((p: any) => p.userId !== currentUserId);
      return (
        other?.name?.toLowerCase().includes(q) ||
        c.productName?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
      );
    }));
  }, [search, conversations, currentUserId]);

  function handleUnreadChange() { fetchConversations(); }

  const activeConv = conversations.find((c) => c._id === activeId);
  const otherParticipant = activeConv?.participantDetails?.find(
    (p: any) => p.userId !== currentUserId
  );

  return (
    <div className="flex h-[calc(100vh-2rem)] max-h-[900px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      {/* ── Left panel: conversation list ── */}
      <div className={cn(
        "flex flex-col border-r border-gray-200",
        "w-full lg:w-80 xl:w-96 flex-shrink-0",
        activeId ? "hidden lg:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {role === "ADMIN" ? "All Chats" : "Messages"}
              </h1>
              {totalUnread > 0 && (
                <p className="text-xs text-gray-400">{totalUnread} unread</p>
              )}
            </div>
            {totalUnread > 0 && (
              <span className="min-w-[22px] h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  {search ? "No results found" : "No conversations yet"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {search ? "Try a different search" : "Conversations will appear here"}
                </p>
              </div>
            </div>
          ) : (
            filtered.map((conv) => (
              <ConversationItem
                key={conv._id}
                conv={conv}
                currentUserId={currentUserId}
                active={activeId === conv._id}
                onClick={() => setActiveId(conv._id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel: chat window ── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        activeId ? "flex" : "hidden lg:flex"
      )}>
        {activeId && otherParticipant ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
              {/* Mobile back button */}
              <button
                onClick={() => setActiveId(null)}
                className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ←
              </button>

              {otherParticipant.image ? (
                <Image
                  src={otherParticipant.image}
                  alt={otherParticipant.name}
                  width={38}
                  height={38}
                  className="rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {otherParticipant.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {otherParticipant.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  <span className={cn(
                    "font-medium",
                    otherParticipant.role === "ADMIN" ? "text-purple-600" :
                    otherParticipant.role === "SELLER" ? "text-amber-600" : "text-gray-500"
                  )}>
                    {otherParticipant.role}
                  </span>
                  {activeConv?.productName && (
                    <> · <span className="text-blue-500">re: {activeConv.productName}</span></>
                  )}
                </p>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                conversationId={activeId}
                currentUserId={currentUserId}
                onUnreadChange={handleUnreadChange}
              />
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-700">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">
                Choose a conversation from the left to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}