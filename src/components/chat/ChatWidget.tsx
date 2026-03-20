// src/components/chat/ChatWidget.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, ChevronLeft } from "lucide-react";
import { pusherClient } from "@/lib/pusher";
import { ChatWindow } from "./ChatWindow";
import { ConversationList } from "./ConversationList";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function ChatWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<any>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/conversations/unread")
      .then((r) => r.json())
      .then((d) => setUnread(d.unread || 0));
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = pusherClient.subscribe(`user-${session.user.id}`);
    channel.bind("conversation-updated", () => {
      fetch("/api/conversations/unread")
        .then((r) => r.json())
        .then((d) => setUnread(d.unread || 0));
    });
    return () => pusherClient.unsubscribe(`user-${session.user.id}`);
  }, [session?.user?.id]);

  useEffect(() => {
    function handleOpenChat(e: any) {
      setActiveConversationId(e.detail.conversationId);
      setOpen(true);
      // Fetch conversation details for header
      fetch("/api/conversations")
        .then((r) => r.json())
        .then((d) => {
          const conv = d.conversations?.find((c: any) => c._id === e.detail.conversationId);
          if (conv) setActiveConversation(conv);
        });
    }
    window.addEventListener("open-chat", handleOpenChat);
    return () => window.removeEventListener("open-chat", handleOpenChat);
  }, []);

  // Fetch conversation details when activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) { setActiveConversation(null); return; }
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        const conv = d.conversations?.find((c: any) => c._id === activeConversationId);
        if (conv) setActiveConversation(conv);
      });
  }, [activeConversationId]);

  function refreshUnread() {
    fetch("/api/conversations/unread")
      .then((r) => r.json())
      .then((d) => setUnread(d.unread || 0));
  }

  if (!session) return null;

  // Get the other participant in the active conversation
  const otherParticipant = activeConversation?.participantDetails?.find(
    (p: any) => p.userId !== session.user.id
  );

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[95vw] sm:w-[380px] h-[560px] bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              {activeConversationId ? (
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : null}

              {activeConversationId && otherParticipant ? (
                // Show other person's profile in header
                <div className="flex items-center gap-2.5">
                  {otherParticipant.image ? (
                    <Image
                      src={otherParticipant.image}
                      alt={otherParticipant.name}
                      width={32}
                      height={32}
                      className="rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {otherParticipant.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {otherParticipant.name}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">
                      {otherParticipant.role?.toLowerCase() || "user"}
                      {activeConversation?.productName && ` · re: ${activeConversation.productName}`}
                    </p>
                  </div>
                </div>
              ) : (
                // Show messages header
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gray-900 flex items-center justify-center">
                    <MessageCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">Messages</p>
                    {unread > 0 && (
                      <p className="text-[11px] text-gray-400">
                        {unread} unread message{unread !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden">
            {activeConversationId ? (
              <ChatWindow
                conversationId={activeConversationId}
                currentUserId={session.user.id}
                onUnreadChange={refreshUnread}
              />
            ) : (
              <ConversationList
                currentUserId={session.user.id}
                onSelect={(id: string) => setActiveConversationId(id)}
              />
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
          open
            ? "bg-gray-200 border border-gray-300 text-gray-700 hover:bg-gray-300"
            : "bg-gray-900 text-white hover:bg-gray-700"
        )}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}