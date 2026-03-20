// src/components/chat/ChatWindow.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import { Send, ImageIcon, ShoppingBag, Loader2, Smile } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

interface Props {
  conversationId: string;
  currentUserId: string;
  onUnreadChange: () => void;
}

export function ChatWindow({ conversationId, currentUserId, onUnreadChange }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [participants, setParticipants] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingAvatars, setTypingAvatars] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch messages
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((r) => r.json())
      .then((d) => { setMessages(d.messages || []); setLoading(false); });

    // Fetch conversation details to get live participant images
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        const conv = d.conversations?.find((c: any) => c._id === conversationId);
        if (conv?.participantDetails) {
          const map: Record<string, any> = {};
          conv.participantDetails.forEach((p: any) => {
            map[p.userId] = p;
          });
          setParticipants(map);
        }
      });

    fetch(`/api/conversations/${conversationId}/read`, { method: "POST" })
      .then(() => onUnreadChange());
  }, [conversationId]);

  useEffect(() => {
    const channel = pusherClient.subscribe(`conversation-${conversationId}`);

    channel.bind("new-message", (data: any) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
      fetch(`/api/conversations/${conversationId}/read`, { method: "POST" })
        .then(() => onUnreadChange());
    });

    channel.bind("typing-start", (data: any) => {
      if (data.userId === currentUserId) return;
      setTypingUsers((prev) => prev.includes(data.userName) ? prev : [...prev, data.userName]);
      if (data.userImage) {
        setTypingAvatars((prev) => ({ ...prev, [data.userName]: data.userImage }));
      }
    });

    channel.bind("typing-stop", (data: any) => {
      if (data.userId === currentUserId) return;
      setTypingUsers((prev) => prev.filter((u) => u !== data.userName));
    });

    return () => pusherClient.unsubscribe(`conversation-${conversationId}`);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    fetch(`/api/conversations/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typing: true }),
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/conversations/${conversationId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typing: false }),
      });
    }, 2000);
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    fetch(`/api/conversations/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typing: false }),
    });
    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      setText("");
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chat");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: data.url }),
        });
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Get live image for a sender — falls back to stale msg.senderImage, then initials
  function getSenderImage(msg: any): string | null {
    return participants[msg.senderId]?.image || msg.senderImage || null;
  }

  function getSenderName(msg: any): string {
    return participants[msg.senderId]?.name || msg.senderName || "?";
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      <p className="text-xs text-gray-400">Loading messages…</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Smile className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">No messages yet</p>
              <p className="text-xs text-gray-400 mt-0.5">Send a message to start the conversation 👋</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUserId;
          const prevMsg = messages[idx - 1];
          const nextMsg = messages[idx + 1];
          const isFirstInGroup = prevMsg?.senderId !== msg.senderId;
          const isLastInGroup = nextMsg?.senderId !== msg.senderId;
          const senderImage = getSenderImage(msg);
          const senderName = getSenderName(msg);

          return (
            <div
              key={msg._id}
              className={cn(
                "flex gap-2.5",
                isMe ? "flex-row-reverse" : "flex-row",
                isFirstInGroup ? "mt-3" : "mt-0.5"
              )}
            >
              {/* Avatar — only show for last message in group */}
              {!isMe && (
                <div className="flex-shrink-0 mt-auto w-8">
                  {isLastInGroup ? (
                    senderImage ? (
                      <Image
                        src={senderImage}
                        alt={senderName}
                        width={32}
                        height={32}
                        className="rounded-full border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                        {senderName?.[0]?.toUpperCase()}
                      </div>
                    )
                  ) : null}
                </div>
              )}

              {/* Message bubble */}
              <div className={cn("max-w-[72%] flex flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
                {/* Sender name — only show first in group for non-me */}
                {!isMe && isFirstInGroup && (
                  <span className="text-[10px] text-gray-500 font-semibold px-1 mb-0.5">
                    {senderName}
                  </span>
                )}

                {/* Order context */}
                {msg.orderDetails && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
                    <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Order #{msg.orderDetails.orderNumber} · {msg.orderDetails.status}</span>
                  </div>
                )}

                {/* Image */}
                {msg.image && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <Image src={msg.image} alt="Shared image" width={220} height={220} className="object-cover" />
                  </div>
                )}

                {/* Text */}
                {msg.content && (
                  <div className={cn(
                    "px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                    isMe
                      ? "bg-gray-900 text-white rounded-2xl rounded-br-md"
                      : "bg-gray-100 border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md"
                  )}>
                    {msg.content}
                  </div>
                )}

                {/* Timestamp — only last in group */}
                {isLastInGroup && (
                  <span className="text-[10px] text-gray-400 px-1 mt-0.5">
                    {formatRelative(msg.createdAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-end gap-2.5 mt-3">
            {typingAvatars[typingUsers[0]] ? (
              <Image
                src={typingAvatars[typingUsers[0]]}
                alt={typingUsers[0]}
                width={32}
                height={32}
                className="rounded-full border border-gray-200 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {typingUsers[0]?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-400 px-1">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white px-3 py-2.5">
        <div className={cn(
          "flex items-center gap-2 bg-gray-50 border rounded-2xl px-3 py-1.5 transition-all",
          text.length > 0 ? "border-gray-400 ring-2 ring-gray-900/5" : "border-gray-200"
        )}>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0 disabled:opacity-40"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none py-1.5"
          />

          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className={cn(
              "p-1.5 rounded-xl transition-all flex-shrink-0",
              text.trim() && !sending
                ? "bg-gray-900 text-white hover:bg-gray-700 shadow-sm"
                : "text-gray-300 cursor-not-allowed"
            )}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Press <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono text-[9px] text-gray-500">Enter</kbd> to send
        </p>
      </div>
    </div>
  );
}