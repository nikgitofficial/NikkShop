// src/app/api/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import Conversation from "@/lib/models/Conversation";
import User from "@/lib/models/User";
import { pusherServer } from "@/lib/pusher";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    // Fetch fresh user images for all unique senders
    const senderIds = [...new Set(messages.map((m: any) => m.senderId))];
    const users = await User.find({ _id: { $in: senderIds } }).lean();
    const userMap = Object.fromEntries(users.map((u: any) => [u._id.toString(), u]));

    // Inject fresh image and name into each message
    const enriched = messages.map((msg: any) => ({
      ...msg,
      senderImage: userMap[msg.senderId]?.image || msg.senderImage,
      senderName: userMap[msg.senderId]?.name || msg.senderName,
    }));

    return NextResponse.json({ messages: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { content, image, orderId, orderDetails } = await req.json();

    if (!content && !image && !orderId) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    await connectDB();

    // Verify participant
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.includes(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch fresh user data from DB
    const freshUser = await User.findById(session.user.id).lean() as any;

    const message = await Message.create({
      conversationId: id,
      senderId: session.user.id,
      senderName: freshUser?.name || session.user.name || "User",
      senderImage: freshUser?.image || session.user.image || "",
      content,
      image,
      orderId,
      orderDetails,
      readBy: [session.user.id],
    });

    // Update unread counts
    const unreadUpdate: Record<string, number> = {};
    conversation.participants.forEach((participantId: string) => {
      if (participantId !== session.user.id) {
        const current = (conversation.unreadCount as any)?.get?.(participantId) || 0;
        unreadUpdate[`unreadCount.${participantId}`] = current + 1;
      }
    });

    await Conversation.findByIdAndUpdate(id, {
      lastMessage: content || (image ? "📷 Image" : `🛒 Order #${orderDetails?.orderNumber}`),
      lastMessageAt: new Date(),
      ...unreadUpdate,
    });

    // Pusher
    await pusherServer.trigger(`conversation-${id}`, "new-message", {
      message: JSON.parse(JSON.stringify(message)),
    });

    conversation.participants.forEach(async (participantId: string) => {
      await pusherServer.trigger(`user-${participantId}`, "conversation-updated", {
        conversationId: id,
      });
    });

    return NextResponse.json({ message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}