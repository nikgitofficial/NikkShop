// src/app/api/conversations/admin-contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession as auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId } = await req.json();
    await connectDB();

    // Find target user
    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const currentUser = await User.findById(session.user.id).lean();

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [session.user.id, targetUserId] },
      productId: { $exists: false }, // admin/seller chats have no product
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [session.user.id, targetUserId],
        participantDetails: [
          {
            userId: session.user.id,
            name: currentUser?.name || session.user.name || "User",
            image: currentUser?.image || session.user.image,
            role: (session.user as any).role,
          },
          {
            userId: targetUserId,
            name: targetUser.name,
            image: targetUser.image,
            role: targetUser.role,
          },
        ],
        unreadCount: { [session.user.id]: 0, [targetUserId]: 0 },
        lastMessageAt: new Date(),
      });
    }

    return NextResponse.json({ conversation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}