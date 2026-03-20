// src/app/api/conversations/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    // Reset unread count for this user
    await Conversation.findByIdAndUpdate(id, {
      [`unreadCount.${session.user.id}`]: 0,
    });

    // Mark all messages as read
    await Message.updateMany(
      { conversationId: id, readBy: { $ne: session.user.id } },
      { $addToSet: { readBy: session.user.id } }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}