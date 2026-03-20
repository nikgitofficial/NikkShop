// src/app/api/conversations/unread/route.ts
import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ unread: 0 });

    await connectDB();
    const conversations = await Conversation.find({
      participants: session.user.id,
    }).lean();

    const unread = conversations.reduce((total, conv) => {
      const count = (conv.unreadCount as any)?.[session.user.id] || 0;
      return total + count;
    }, 0);

    return NextResponse.json({ unread });
  } catch {
    return NextResponse.json({ unread: 0 });
  }
}